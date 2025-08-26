import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

/**
 * Generate a presigned URL for direct upload from client
 */
export async function generatePresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 3600 // 1 hour
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Upload a file directly to S3
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  });

  await s3Client.send(command);
  
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a presigned URL for downloading
 */
export async function generateDownloadUrl(
  key: string,
  expiresIn = 3600 // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a unique file key for S3
 */
export function generateFileKey(
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

export { s3Client, BUCKET_NAME };