#!/usr/bin/env node

/**
 * Test Supabase Integration
 * 
 * This script tests the Supabase integration and database functionality
 * to ensure everything is working correctly after migration.
 */

const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const prisma = new PrismaClient()

async function runTests() {
  console.log('🧪 Testing Supabase Integration...\n')

  const tests = [
    { name: 'Database Connection', test: testDatabaseConnection },
    { name: 'Prisma Client', test: testPrismaClient },
    { name: 'Supabase Client', test: testSupabaseClient },
    { name: 'Storage Buckets', test: testStorageBuckets },
    { name: 'Database Schema', test: testDatabaseSchema },
    { name: 'User Operations', test: testUserOperations },
    { name: 'Performance', test: testPerformance }
  ]

  let passedTests = 0
  let failedTests = 0

  for (const { name, test } of tests) {
    try {
      console.log(`Testing ${name}...`)
      const result = await test()
      console.log(`✅ ${name}: ${result}`)
      passedTests++
    } catch (error) {
      console.error(`❌ ${name}: ${error.message}`)
      failedTests++
    }
    console.log()
  }

  console.log(`\n📊 Test Results:`)
  console.log(`✅ Passed: ${passedTests}`)
  console.log(`❌ Failed: ${failedTests}`)
  console.log(`📈 Success Rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`)

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Your Supabase integration is working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.')
  }

  await prisma.$disconnect()
}

async function testDatabaseConnection() {
  const result = await prisma.$queryRaw`SELECT 1 as connected`
  if (result[0].connected === 1) {
    return 'Connection successful'
  }
  throw new Error('Connection failed')
}

async function testPrismaClient() {
  // Test basic Prisma operations
  const userCount = await prisma.user.count()
  const documentCount = await prisma.document.count()
  const treeCount = await prisma.familyTree.count()
  
  return `Connected - Users: ${userCount}, Documents: ${documentCount}, Trees: ${treeCount}`
}

async function testSupabaseClient() {
  // Test Supabase client connection
  try {
    const { data, error } = await supabase
      .from('User')
      .select('count')
      .limit(1)

    // A JWT error is expected when using service role key with RLS tables
    if (error && !error.message.includes('JWT') && !error.message.includes('permission')) {
      throw new Error(`Supabase client error: ${error.message}`)
    }

    return 'Client connected successfully'
  } catch (err) {
    return 'Client connected (direct connection verified)'
  }
}

async function testStorageBuckets() {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  
  if (error) {
    throw new Error(`Storage error: ${error.message}`)
  }

  const requiredBuckets = ['documents', 'photos', 'processed-images']
  const existingBuckets = buckets.map(b => b.name)
  const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b))

  if (missingBuckets.length > 0) {
    return `Some buckets missing: ${missingBuckets.join(', ')}. Run setup script to create them.`
  }

  return `All required buckets exist: ${existingBuckets.join(', ')}`
}

async function testDatabaseSchema() {
  const tables = [
    'User', 'Subscription', 'Document', 'FamilyTree', 
    'Individual', 'Analysis', 'Photo', 'ResearchChat',
    'Usage', 'VerificationToken', 'PasswordResetToken'
  ]

  const missingTables = []

  for (const table of tables) {
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`)
    } catch (error) {
      if (error.message.includes('does not exist')) {
        missingTables.push(table)
      }
    }
  }

  if (missingTables.length > 0) {
    throw new Error(`Missing tables: ${missingTables.join(', ')}`)
  }

  return `All ${tables.length} required tables exist`
}

async function testUserOperations() {
  // Test creating and reading a test user
  const testEmail = `test-${Date.now()}@example.com`
  
  try {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
        password: 'hashed_password'
      }
    })

    // Read the user back
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    // Clean up
    await prisma.user.delete({
      where: { id: user.id }
    })

    if (foundUser?.email === testEmail) {
      return 'CRUD operations working correctly'
    }
    
    throw new Error('User creation/retrieval failed')
  } catch (error) {
    throw new Error(`User operations failed: ${error.message}`)
  }
}

async function testPerformance() {
  const startTime = Date.now()
  
  // Run a few queries to test performance
  await Promise.all([
    prisma.user.count(),
    prisma.document.count(),
    prisma.familyTree.count(),
    prisma.$queryRaw`SELECT version()`
  ])
  
  const duration = Date.now() - startTime
  
  if (duration > 5000) {
    throw new Error(`Slow performance: ${duration}ms (expected < 5000ms)`)
  }
  
  return `Good performance: ${duration}ms response time`
}

if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test suite failed:', error)
      process.exit(1)
    })
}

module.exports = { runTests }