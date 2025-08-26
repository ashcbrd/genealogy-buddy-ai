#!/usr/bin/env node

/**
 * Test NextAuth with Prisma Adapter
 * 
 * This script tests the NextAuth Prisma adapter setup to ensure
 * authentication flows work correctly with Supabase.
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function testAuth() {
  console.log('🔐 Testing NextAuth Integration...\n')

  try {
    // Test 1: Check NextAuth tables exist and are accessible
    console.log('1. Testing NextAuth tables...')
    
    const accountCount = await prisma.account.count()
    const sessionCount = await prisma.session.count() 
    const userCount = await prisma.user.count()

    console.log(`✅ Account table: ${accountCount} records`)
    console.log(`✅ Session table: ${sessionCount} records`)
    console.log(`✅ User table: ${userCount} records`)

    // Test 2: Test user operations (similar to what NextAuth does)
    console.log('\n2. Testing user operations...')
    
    // Create a test user (like OAuth would do)
    const testUser = await prisma.user.create({
      data: {
        email: `test-oauth-${Date.now()}@example.com`,
        name: 'Test OAuth User',
        emailVerified: new Date(),
        image: 'https://example.com/avatar.jpg'
      }
    })
    console.log(`✅ Created test user: ${testUser.id}`)

    // Create an account (like Google OAuth would do)
    const testAccount = await prisma.account.create({
      data: {
        userId: testUser.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: `google-${Date.now()}`,
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'email profile'
      }
    })
    console.log(`✅ Created OAuth account: ${testAccount.id}`)

    // Create a session (like NextAuth would do)
    const testSession = await prisma.session.create({
      data: {
        userId: testUser.id,
        sessionToken: `session-${Date.now()}`,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    })
    console.log(`✅ Created session: ${testSession.id}`)

    // Test 3: Test NextAuth adapter queries
    console.log('\n3. Testing NextAuth adapter queries...')
    
    // Test getUserByAccount (the one that was failing)
    const foundUser = await prisma.user.findFirst({
      where: {
        accounts: {
          some: {
            provider: 'google',
            providerAccountId: testAccount.providerAccountId
          }
        }
      }
    })
    
    if (foundUser) {
      console.log(`✅ getUserByAccount working: Found user ${foundUser.id}`)
    } else {
      console.log(`❌ getUserByAccount failed: No user found`)
    }

    // Test getSessionAndUser
    const sessionWithUser = await prisma.session.findUnique({
      where: { sessionToken: testSession.sessionToken },
      include: { user: true }
    })
    
    if (sessionWithUser) {
      console.log(`✅ getSessionAndUser working: Found session with user ${sessionWithUser.user.id}`)
    } else {
      console.log(`❌ getSessionAndUser failed: No session found`)
    }

    // Test 4: Clean up test data
    console.log('\n4. Cleaning up test data...')
    await prisma.session.delete({ where: { id: testSession.id } })
    await prisma.account.delete({ where: { id: testAccount.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
    console.log('✅ Test data cleaned up')

    console.log('\n🎉 All NextAuth tests passed! Authentication should work correctly.')

  } catch (error) {
    console.error('❌ NextAuth test failed:', error.message)
    console.error('\nThis suggests there may still be connection issues.')
    console.error('Try restarting your development server and testing again.')
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  testAuth()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test failed:', error)
      process.exit(1)
    })
}

module.exports = { testAuth }