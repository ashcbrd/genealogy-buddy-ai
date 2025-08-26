#!/usr/bin/env node

/**
 * Migration Script: Local PostgreSQL -> Supabase
 * 
 * This script helps migrate data from your local PostgreSQL database
 * to Supabase while preserving all existing data and relationships.
 */

const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Prisma with the OLD database URL for migration
const oldDatabaseUrl = process.env.OLD_DATABASE_URL || 'postgresql://user:password@localhost:5432/genealogyai'

async function migrateData() {
  console.log('🔄 Starting data migration to Supabase...\n')

  let sourcePrisma, targetPrisma

  try {
    // Connect to source database (old local database)
    console.log('1. Connecting to source database...')
    sourcePrisma = new PrismaClient({
      datasources: {
        db: {
          url: oldDatabaseUrl
        }
      }
    })
    await sourcePrisma.$connect()
    console.log('✅ Connected to source database\n')

    // Connect to target database (Supabase)
    console.log('2. Connecting to Supabase...')
    targetPrisma = new PrismaClient()
    await targetPrisma.$connect()
    console.log('✅ Connected to Supabase\n')

    // Get counts from source
    console.log('3. Analyzing source data...')
    const sourceCounts = await getDataCounts(sourcePrisma)
    console.log('Source database contains:')
    Object.entries(sourceCounts).forEach(([table, count]) => {
      console.log(`   - ${table}: ${count} records`)
    })
    console.log()

    // Migrate data in order (respecting foreign key constraints)
    const migrationSteps = [
      { name: 'Users', migrate: () => migrateUsers(sourcePrisma, targetPrisma) },
      { name: 'Subscriptions', migrate: () => migrateSubscriptions(sourcePrisma, targetPrisma) },
      { name: 'Documents', migrate: () => migrateDocuments(sourcePrisma, targetPrisma) },
      { name: 'Family Trees', migrate: () => migrateFamilyTrees(sourcePrisma, targetPrisma) },
      { name: 'Individuals', migrate: () => migrateIndividuals(sourcePrisma, targetPrisma) },
      { name: 'Photos', migrate: () => migratePhotos(sourcePrisma, targetPrisma) },
      { name: 'Analyses', migrate: () => migrateAnalyses(sourcePrisma, targetPrisma) },
      { name: 'Research Chats', migrate: () => migrateResearchChats(sourcePrisma, targetPrisma) },
      { name: 'Usage Records', migrate: () => migrateUsage(sourcePrisma, targetPrisma) },
      { name: 'Tokens', migrate: () => migrateTokens(sourcePrisma, targetPrisma) }
    ]

    for (const step of migrationSteps) {
      console.log(`4.${migrationSteps.indexOf(step) + 1} Migrating ${step.name}...`)
      const result = await step.migrate()
      console.log(`✅ Migrated ${result.count} ${step.name.toLowerCase()}`)
    }

    // Verify migration
    console.log('\n5. Verifying migration...')
    const targetCounts = await getDataCounts(targetPrisma)
    console.log('Target database contains:')
    Object.entries(targetCounts).forEach(([table, count]) => {
      const sourceCount = sourceCounts[table] || 0
      const status = count >= sourceCount ? '✅' : '⚠️'
      console.log(`   ${status} ${table}: ${count} records (source: ${sourceCount})`)
    })

    console.log('\n🎉 Migration completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Update your DATABASE_URL in .env to point to Supabase')
    console.log('2. Test your application thoroughly')
    console.log('3. Set up monitoring and backups in Supabase dashboard')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('\nRollback instructions:')
    console.log('1. Keep your old database running')
    console.log('2. Revert DATABASE_URL in .env to your old database')
    console.log('3. Contact support if you need help with data recovery')
  } finally {
    if (sourcePrisma) await sourcePrisma.$disconnect()
    if (targetPrisma) await targetPrisma.$disconnect()
  }
}

async function getDataCounts(prisma) {
  const [
    users, subscriptions, documents, familyTrees, individuals,
    photos, analyses, researchChats, usage, verificationTokens, passwordResetTokens
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count(),
    prisma.document.count(),
    prisma.familyTree.count(),
    prisma.individual.count(),
    prisma.photo.count(),
    prisma.analysis.count(),
    prisma.researchChat.count(),
    prisma.usage.count(),
    prisma.verificationToken.count(),
    prisma.passwordResetToken.count()
  ])

  return {
    users,
    subscriptions,
    documents,
    familyTrees,
    individuals,
    photos,
    analyses,
    researchChats,
    usage,
    verificationTokens,
    passwordResetTokens
  }
}

// Migration functions for each table
async function migrateUsers(source, target) {
  const users = await source.user.findMany()
  let count = 0
  
  for (const user of users) {
    try {
      await target.user.upsert({
        where: { id: user.id },
        create: user,
        update: user
      })
      count++
    } catch (error) {
      if (!error.message.includes('unique')) {
        console.warn(`⚠️  Failed to migrate user ${user.id}: ${error.message}`)
      }
    }
  }
  
  return { count }
}

async function migrateSubscriptions(source, target) {
  const subscriptions = await source.subscription.findMany()
  let count = 0
  
  for (const subscription of subscriptions) {
    try {
      await target.subscription.upsert({
        where: { id: subscription.id },
        create: subscription,
        update: subscription
      })
      count++
    } catch (error) {
      console.warn(`⚠️  Failed to migrate subscription ${subscription.id}: ${error.message}`)
    }
  }
  
  return { count }
}

async function migrateDocuments(source, target) {
  const documents = await source.document.findMany()
  let count = 0
  
  for (const doc of documents) {
    try {
      await target.document.upsert({
        where: { id: doc.id },
        create: doc,
        update: doc
      })
      count++
    } catch (error) {
      console.warn(`⚠️  Failed to migrate document ${doc.id}: ${error.message}`)
    }
  }
  
  return { count }
}

async function migrateFamilyTrees(source, target) {
  const trees = await source.familyTree.findMany()
  let count = 0
  
  for (const tree of trees) {
    try {
      await target.familyTree.upsert({
        where: { id: tree.id },
        create: tree,
        update: tree
      })
      count++
    } catch (error) {
      console.warn(`⚠️  Failed to migrate family tree ${tree.id}: ${error.message}`)
    }
  }
  
  return { count }
}

async function migrateIndividuals(source, target) {
  const individuals = await source.individual.findMany()
  let count = 0
  
  for (const individual of individuals) {
    try {
      await target.individual.upsert({
        where: { id: individual.id },
        create: individual,
        update: individual
      })
      count++
    } catch (error) {
      console.warn(`⚠️  Failed to migrate individual ${individual.id}: ${error.message}`)
    }
  }
  
  return { count }
}

async function migratePhotos(source, target) {
  const photos = await source.photo.findMany()
  let count = 0
  
  for (const photo of photos) {
    try {
      await target.photo.upsert({
        where: { id: photo.id },
        create: photo,
        update: photo
      })
      count++
    } catch (error) {
      console.warn(`⚠️  Failed to migrate photo ${photo.id}: ${error.message}`)
    }
  }
  
  return { count }
}

async function migrateAnalyses(source, target) {
  const analyses = await source.analysis.findMany()
  let count = 0
  
  for (const analysis of analyses) {
    try {
      await target.analysis.upsert({
        where: { id: analysis.id },
        create: analysis,
        update: analysis
      })
      count++
    } catch (error) {
      console.warn(`⚠️  Failed to migrate analysis ${analysis.id}: ${error.message}`)
    }
  }
  
  return { count }
}

async function migrateResearchChats(source, target) {
  const chats = await source.researchChat.findMany()
  let count = 0
  
  for (const chat of chats) {
    try {
      await target.researchChat.upsert({
        where: { id: chat.id },
        create: chat,
        update: chat
      })
      count++
    } catch (error) {
      console.warn(`⚠️  Failed to migrate research chat ${chat.id}: ${error.message}`)
    }
  }
  
  return { count }
}

async function migrateUsage(source, target) {
  const usage = await source.usage.findMany()
  let count = 0
  
  for (const record of usage) {
    try {
      await target.usage.upsert({
        where: { id: record.id },
        create: record,
        update: record
      })
      count++
    } catch (error) {
      console.warn(`⚠️  Failed to migrate usage record ${record.id}: ${error.message}`)
    }
  }
  
  return { count }
}

async function migrateTokens(source, target) {
  const [verificationTokens, passwordResetTokens] = await Promise.all([
    source.verificationToken.findMany(),
    source.passwordResetToken.findMany()
  ])
  
  let count = 0
  
  // Migrate verification tokens
  for (const token of verificationTokens) {
    try {
      await target.verificationToken.upsert({
        where: { id: token.id },
        create: token,
        update: token
      })
      count++
    } catch (error) {
      console.warn(`⚠️  Failed to migrate verification token: ${error.message}`)
    }
  }
  
  // Migrate password reset tokens
  for (const token of passwordResetTokens) {
    try {
      await target.passwordResetToken.upsert({
        where: { id: token.id },
        create: token,
        update: token
      })
      count++
    } catch (error) {
      console.warn(`⚠️  Failed to migrate password reset token: ${error.message}`)
    }
  }
  
  return { count }
}

if (require.main === module) {
  migrateData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

module.exports = { migrateData }