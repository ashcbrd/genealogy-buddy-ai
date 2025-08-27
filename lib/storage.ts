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
  const { data, error } = await supabaseAdmin.storage
    .from('files')
    .upload(path, body, {
      contentType,
      cacheControl: '3600',
      upsert: true,
      ...(metadata && { metadata })
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return getPublicUrl('files', path);
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
): Promise<string> {
  return await createSignedUrl('files', path, expiresIn);
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