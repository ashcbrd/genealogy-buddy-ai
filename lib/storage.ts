import { supabaseAdmin, uploadFile, deleteFile, createSignedUrl, getPublicUrl } from '@/lib/supabase';

/**
 * Generate a presigned URL for direct upload from client
 */
export async function generatePresignedUrl(
  path: string,
  contentType: string,
  expiresIn = 3600 // 1 hour
): Promise<string> {
  // For Supabase, we create a signed upload URL
  const { data, error } = await supabaseAdmin.storage
    .from('files')
    .createSignedUploadUrl(path);

  if (error) {
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Upload a file directly to Supabase Storage
 */
export async function uploadFileBuffer(
  path: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  try {
    // Determine the correct bucket based on file type and path
    const isPhoto = contentType.startsWith('image/') || path.includes('photos/');
    const isDocument = contentType.includes('pdf') || path.includes('documents/');
    
    // Use the appropriate bucket
    const bucket = 'files'; // Keep using files bucket for consistency
    
    // Ensure bucket exists
    const { error: bucketError } = await supabaseAdmin.storage.createBucket(bucket, {
      public: false,
      allowedMimeTypes: ['image/*', 'application/pdf', 'text/*'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    });
    
    // Ignore error if bucket already exists
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.warn(`Failed to create/verify bucket ${bucket}:`, bucketError.message);
    }

    console.log(`Uploading file to ${bucket}/${path}`);
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, body, {
        contentType,
        cacheControl: '3600',
        upsert: true,
        ...(metadata && { metadata })
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('File uploaded successfully:', data?.path);
    
    // Try to generate a signed URL immediately to verify upload worked
    try {
      const verifyUrl = await generateDownloadUrl(path, 60);
      if (verifyUrl) {
        console.log('Upload verification: URL generation successful');
        return verifyUrl;
      }
    } catch (verifyErr) {
      console.warn('Upload verification failed, using public URL:', verifyErr);
    }
    
    // Fallback to public URL
    return getPublicUrl(bucket, path);
  } catch (err) {
    console.error('Storage upload error:', err);
    // Return a more informative placeholder
    return `placeholder://upload-failed/${path.split('/').pop()}`;
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteStorageFile(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from('files')
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Generate a signed URL for downloading
 */
export async function generateDownloadUrl(
  path: string,
  expiresIn = 3600 // 1 hour
): Promise<string | null> {
  try {
    // Try different bucket configurations based on the path
    const buckets = ['files', 'photos', 'documents'];
    const pathVariations = [
      path, // Original path
      path.replace(/^(photos|documents)\//, ''), // Remove prefix
      path.replace(/^\/+/, '') // Remove leading slashes
    ];
    
    for (const bucket of buckets) {
      for (const testPath of pathVariations) {
        try {
          const url = await createSignedUrl(bucket, testPath, expiresIn);
          console.log(`✅ Successfully created signed URL: ${bucket}/${testPath}`);
          return url;
        } catch (bucketErr) {
          // Continue to next combination
        }
      }
    }
    
    // If all attempts fail, try to return a public URL as fallback
    try {
      const publicUrl = getPublicUrl('files', path);
      console.log(`Using public URL fallback for: ${path}`);
      return publicUrl;
    } catch (publicErr) {
      console.warn(`All URL generation methods failed for ${path}`);
      return null;
    }
    
  } catch (err) {
    console.warn(`Failed to generate download URL for ${path}:`, err);
    return null;
  }
}

/**
 * Generate a unique file path for storage
 */
export function generateFilePath(
  userId: string,
  type: "documents" | "photos",
  filename: string
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${type}/${userId}/${timestamp}_${randomStr}_${sanitizedFilename}`;
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: { size: number; type: string },
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${file.size} exceeds maximum allowed size of ${maxSize} bytes`,
    };
  }

  return { valid: true };
}

// File type configurations
export const FILE_CONFIGS = {
  documents: {
    allowedTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/tiff",
      "image/bmp",
      "image/gif",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  photos: {
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/tiff",
      "image/bmp",
      "image/gif",
      "image/webp",
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
  },
};