#!/usr/bin/env node

/**
 * Supabase Setup Script for Genealogy AI
 * 
 * This script helps set up the Supabase database with the required
 * tables, RLS policies, and initial data.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database for Genealogy AI...\n')

  try {
    // Check connection
    console.log('1. Testing Supabase connection...')
    const { data, error } = await supabase.from('_prisma_migrations').select('*').limit(1)
    if (error && !error.message.includes('relation "_prisma_migrations" does not exist')) {
      throw error
    }
    console.log('✅ Connection successful\n')

    // Enable required extensions
    console.log('2. Enabling required PostgreSQL extensions...')
    const extensions = [
      'uuid-ossp',
      'pgcrypto'
    ]

    for (const extension of extensions) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `CREATE EXTENSION IF NOT EXISTS "${extension}";`
      })
      if (error) {
        console.warn(`⚠️  Could not enable ${extension}: ${error.message}`)
      } else {
        console.log(`✅ Enabled ${extension}`)
      }
    }
    console.log()

    // Create storage buckets
    console.log('3. Creating storage buckets...')
    const buckets = [
      { name: 'documents', public: false },
      { name: 'photos', public: false },
      { name: 'processed-images', public: true }
    ]

    for (const bucket of buckets) {
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes: bucket.name === 'photos' || bucket.name === 'processed-images' 
          ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
          : ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
        fileSizeLimit: bucket.name === 'photos' ? 10485760 : 52428800 // 10MB for photos, 50MB for documents
      })

      if (error && !error.message.includes('already exists')) {
        console.warn(`⚠️  Could not create bucket ${bucket.name}: ${error.message}`)
      } else if (!error) {
        console.log(`✅ Created ${bucket.name} bucket`)
      } else {
        console.log(`ℹ️  Bucket ${bucket.name} already exists`)
      }
    }
    console.log()

    console.log('4. Next steps:')
    console.log('   - Update your .env file with the correct Supabase credentials')
    console.log('   - Run "npm run db:push" to sync your Prisma schema')
    console.log('   - Run "npm run db:seed" to add initial data (optional)')
    console.log()
    console.log('🎉 Supabase setup completed successfully!')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Create RLS policies helper function
async function createRLSPolicies() {
  console.log('5. Creating Row Level Security policies...')
  
  const policies = [
    {
      table: 'users',
      policy: 'Users can view their own profile',
      sql: `
        CREATE POLICY "Users can view their own profile" ON public.users
        FOR SELECT USING (auth.uid()::text = id);
      `
    },
    {
      table: 'users', 
      policy: 'Users can update their own profile',
      sql: `
        CREATE POLICY "Users can update their own profile" ON public.users
        FOR UPDATE USING (auth.uid()::text = id);
      `
    },
    {
      table: 'documents',
      policy: 'Users can view their own documents',
      sql: `
        CREATE POLICY "Users can view their own documents" ON public.documents
        FOR ALL USING (auth.uid()::text = "userId");
      `
    },
    {
      table: 'photos',
      policy: 'Users can manage their own photos',
      sql: `
        CREATE POLICY "Users can manage their own photos" ON public.photos
        FOR ALL USING (auth.uid()::text = "userId");
      `
    },
    {
      table: 'family_trees',
      policy: 'Users can manage their own family trees',
      sql: `
        CREATE POLICY "Users can manage their own family trees" ON public.family_trees
        FOR ALL USING (auth.uid()::text = "userId");
      `
    }
  ]

  for (const { table, policy, sql } of policies) {
    try {
      // Enable RLS first
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
      })

      // Create policy
      await supabase.rpc('exec_sql', { sql })
      console.log(`✅ Created policy: ${policy}`)
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.warn(`⚠️  Could not create policy for ${table}: ${error.message}`)
      }
    }
  }
}

if (require.main === module) {
  setupDatabase().then(() => {
    process.exit(0)
  }).catch((error) => {
    console.error('Setup failed:', error)
    process.exit(1)
  })
}

module.exports = { setupDatabase, createRLSPolicies }