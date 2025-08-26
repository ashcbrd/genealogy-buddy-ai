#!/usr/bin/env node

/**
 * Check Database Schema
 * 
 * This script checks what tables and columns exist in the database
 * to diagnose any schema issues.
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const prisma = new PrismaClient()

async function checkSchema() {
  console.log('🔍 Checking Database Schema...\n')

  try {
    // Check what tables exist
    console.log('1. Checking existing tables...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `

    console.log('Existing tables:')
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`)
    })
    console.log()

    // Check indexes
    console.log('2. Checking indexes...')
    const indexes = await prisma.$queryRaw`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `

    console.log('Existing indexes:')
    indexes.forEach(idx => {
      console.log(`   - ${idx.tablename}.${idx.indexname}`)
    })
    console.log()

    // Check if specific tables exist (using actual case)
    const expectedTables = [
      'User', 'Subscription', 'Usage', 'Document', 'FamilyTree', 
      'Individual', 'Analysis', 'Photo', 'ResearchChat',
      'VerificationToken', 'PasswordResetToken'
    ]

    console.log('3. Checking expected tables...')
    for (const tableName of expectedTables) {
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${tableName}"`)
        console.log(`✅ ${tableName}: ${result[0].count} records`)
      } catch (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
      }
    }

    console.log('\n4. Database information:')
    const dbInfo = await prisma.$queryRaw`SELECT version()`
    console.log(`Database: ${dbInfo[0].version}`)

    const dbSize = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size;
    `
    console.log(`Database size: ${dbSize[0].size}`)

  } catch (error) {
    console.error('Schema check failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  checkSchema()
}

module.exports = { checkSchema }