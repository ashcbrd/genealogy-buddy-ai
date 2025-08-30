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
  const bucket = 'files'; // Use consistent bucket name
  
  try {
    console.log(`Uploading file to ${bucket}/${path} with content type: ${contentType}`);
    
    // Upload the file to Supabase Storage
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

    if (!data?.path) {
      throw new Error('Upload succeeded but no path returned');
    }

    console.log('File uploaded successfully:', data.path);
    
    // Generate a signed URL for the uploaded file
    const signedUrl = await generateDownloadUrl(data.path, 3600);
    
    if (!signedUrl) {
      throw new Error('Failed to generate signed URL after upload');
    }
    
    return signedUrl;
  } catch (err) {
    console.error('Storage upload error:', err);
    throw err; // Re-throw instead of returning placeholder
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
  const bucket = 'files'; // Use consistent bucket name
  
  try {
    console.log(`Generating signed URL for: ${bucket}/${path}`);
    
    // Clean the path - remove leading slashes and normalize
    const cleanPath = path.replace(/^\/+/, '');

    // Try to create signed URL using the admin client
    const url = await createSignedUrl(bucket, cleanPath, expiresIn);
    
    if (url) {
      console.log(`✅ Successfully created signed URL for: ${cleanPath}`);
      return url;
    }
    
    console.warn(`Failed to generate signed URL for: ${cleanPath} - file may not exist`);
    return `placeholder://document-not-found/${cleanPath}`;
    
  } catch (err) {
    console.error(`Failed to generate download URL for ${path}:`, err);
    
    // If it's an "Object not found" error, return a placeholder
    if (err instanceof Error && err.message.includes('Object not found')) {
      console.warn(`File not found in storage: ${path} - returning placeholder URL`);
      return `placeholder://document-not-found/${path}`;
    }
    
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