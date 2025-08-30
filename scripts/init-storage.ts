#!/usr/bin/env tsx

/**
 * Initialize Supabase Storage Buckets
 * 
 * This script ensures the required storage buckets exist with proper configuration.
 * Run this after setting up your Supabase project.
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

import { supabaseAdmin } from '../lib/supabase';

async function initializeStorageBuckets() {
  console.log('🔧 Initializing Supabase storage buckets...');

  try {
    // Check if 'files' bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return;
    }

    const existingBuckets = buckets?.map(b => b.name) || [];
    console.log('📋 Existing buckets:', existingBuckets);

    if (!existingBuckets.includes('files')) {
      console.log('🪣 Creating "files" bucket...');
      
      const { data: bucketData, error: createError } = await supabaseAdmin.storage.createBucket('files', {
        public: false, // Private bucket - files accessed via signed URLs
        allowedMimeTypes: [
          // Images
          'image/jpeg',
          'image/png', 
          'image/gif',
          'image/tiff',
          'image/bmp',
          'image/webp',
          // Documents
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB
      });

      if (createError) {
        console.error('❌ Failed to create files bucket:', createError.message);
        return;
      }

      console.log('✅ Files bucket created successfully');
    } else {
      console.log('✅ Files bucket already exists');
    }

    // Test upload and signed URL generation
    console.log('🧪 Testing storage functionality...');
    
    const testPath = 'test/test-file.txt';
    const testContent = 'This is a test file for storage verification';
    
    // Upload test file
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('files')
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError.message);
      return;
    }

    console.log('✅ Test file uploaded successfully');

    // Generate signed URL
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from('files')
      .createSignedUrl(testPath, 60);

    if (urlError) {
      console.error('❌ Signed URL generation failed:', urlError.message);
      return;
    }

    console.log('✅ Signed URL generated successfully:', urlData.signedUrl);

    // Clean up test file
    const { error: deleteError } = await supabaseAdmin.storage
      .from('files')
      .remove([testPath]);

    if (deleteError) {
      console.warn('⚠️ Failed to clean up test file:', deleteError.message);
    } else {
      console.log('✅ Test file cleaned up');
    }

    console.log('🎉 Storage initialization completed successfully!');
    
  } catch (error) {
    console.error('💥 Storage initialization failed:', error);
  }
}

// Run the initialization
if (require.main === module) {
  initializeStorageBuckets().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export { initializeStorageBuckets };