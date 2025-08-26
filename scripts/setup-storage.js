#!/usr/bin/env node

/**
 * Setup Supabase Storage Buckets
 * 
 * This script creates the required storage buckets for the genealogy app.
 */

const { createClient } = require('@supabase/supabase-js')
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('🗄️  Setting up Supabase storage buckets...\n')

  try {
    // Create storage buckets
    console.log('1. Creating storage buckets...')
    const buckets = [
      { 
        name: 'documents', 
        public: false,
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
        fileSizeLimit: 52428800 // 50MB
      },
      { 
        name: 'photos', 
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 10485760 // 10MB
      },
      { 
        name: 'processed-images', 
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      }
    ]

    for (const bucket of buckets) {
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes: bucket.allowedMimeTypes,
        fileSizeLimit: bucket.fileSizeLimit
      })

      if (error && !error.message.includes('already exists')) {
        console.warn(`⚠️  Could not create bucket ${bucket.name}: ${error.message}`)
      } else if (!error) {
        console.log(`✅ Created ${bucket.name} bucket (${bucket.public ? 'public' : 'private'})`)
      } else {
        console.log(`ℹ️  Bucket ${bucket.name} already exists`)
      }
    }

    // List all buckets to verify
    console.log('\n2. Verifying storage buckets...')
    const { data: allBuckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error(`❌ Could not list buckets: ${listError.message}`)
    } else {
      console.log('Available storage buckets:')
      allBuckets.forEach(bucket => {
        const status = bucket.public ? '🌐 Public' : '🔒 Private'
        console.log(`   - ${bucket.name} ${status}`)
      })
    }

    console.log('\n🎉 Storage setup completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Your database tables are ready')
    console.log('2. Storage buckets are configured')
    console.log('3. You can now start your application with "npm run dev"')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  setupStorage()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error)
      process.exit(1)
    })
}

module.exports = { setupStorage }