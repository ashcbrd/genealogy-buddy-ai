import { z } from "zod";

/**
 * Centralized validation schemas for the application
 * Uses Zod for runtime type checking and validation
 */

// Common validation patterns
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes");

const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number");

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.acceptTerms === true, {
    message: "You must accept the terms and conditions",
    path: ["acceptTerms"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Profile schemas
export const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatar: z.string().url("Please enter a valid URL").optional(),
  preferences: z
    .object({
      newsletter: z.boolean().optional(),
      notifications: z.boolean().optional(),
      marketing: z.boolean().optional(),
      theme: z.enum(["light", "dark", "system"]).optional(),
    })
    .optional(),
});

// File upload schemas
export const fileUploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  size: z.number().positive("File size must be positive"),
  contentType: z.string().min(1, "Content type is required"),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const documentUploadSchema = fileUploadSchema.extend({
  contentType: z
    .string()
    .refine(
      (type) =>
        [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/tiff",
          "image/bmp",
          "image/gif",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(type),
      "Invalid file type for document upload"
    ),
  size: z.number().max(50 * 1024 * 1024, "Document size must be less than 50MB"),
});

export const photoUploadSchema = fileUploadSchema.extend({
  contentType: z
    .string()
    .refine(
      (type) =>
        [
          "image/jpeg",
          "image/png",
          "image/tiff",
          "image/bmp",
          "image/gif",
          "image/webp",
        ].includes(type),
      "Invalid file type for photo upload"
    ),
  size: z.number().max(20 * 1024 * 1024, "Photo size must be less than 20MB"),
});

// Family tree schemas
export const individualSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().max(100, "First name must be less than 100 characters").optional(),
  lastName: z.string().max(100, "Last name must be less than 100 characters").optional(),
  birthDate: z.union([z.string().datetime(), z.date()]).optional().nullable(),
  deathDate: z.union([z.string().datetime(), z.date()]).optional().nullable(),
  birthPlace: z.string().max(200, "Birth place must be less than 200 characters").optional(),
  deathPlace: z.string().max(200, "Death place must be less than 200 characters").optional(),
  fatherId: z.string().optional(),
  motherId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  aiGenerated: z.boolean().optional(),
});

export const familyTreeSaveSchema = z.object({
  treeId: z.string().optional(),
  name: z.string().min(1, "Tree name is required").max(100, "Tree name must be less than 100 characters"),
  individuals: z.array(individualSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const familyTreeExportSchema = z.object({
  treeId: z.string().min(1, "Tree ID is required"),
  format: z.enum(["gedcom", "json"]).optional(),
});

// Analysis schemas
export const documentAnalysisSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  text: z.string().optional(),
  additionalContext: z.string().max(1000, "Additional context must be less than 1000 characters").optional(),
});

export const dnaAnalysisSchema = z.object({
  dnaData: z.record(z.string(), z.unknown()).optional(),
  ethnicity: z.record(z.string(), z.unknown()).optional(),
  regions: z.array(z.string()).optional(),
  matchData: z.array(z.record(z.string(), z.unknown())).optional(),
});

export const photoAnalysisSchema = z.object({
  photoId: z.string().optional(),
  photoDescription: z.string().optional(),
  additionalContext: z.string().max(1000, "Additional context must be less than 1000 characters").optional(),
}).refine((data) => data.photoId || data.photoDescription, {
  message: "Either photo ID or photo description is required",
});

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "Message content is required").max(10000, "Message too long"),
});

export const researchChatSchema = z.object({
  messages: z.array(chatMessageSchema),
  context: z.record(z.string(), z.unknown()).optional(),
});

// Subscription schemas
export const subscriptionUpgradeSchema = z.object({
  tier: z.enum(["EXPLORER", "RESEARCHER", "PROFESSIONAL"]),
});

// Contact/Support schemas
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
  type: z.enum(["support", "billing", "feature", "bug", "other"]).optional(),
});

export const adminEmailSchema = z.object({
  to: emailSchema,
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  content: z.string().min(1, "Content is required").max(10000, "Content must be less than 10000 characters"),
});

// Search and pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").optional(),
  limit: z.coerce.number().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").optional(),
  search: z.string().max(200, "Search term must be less than 200 characters").optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const searchSchema = paginationSchema.extend({
  search: z.string().min(1, "Search term is required").max(200, "Search term must be less than 200 characters"),
});

// Utility validation functions
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const result = passwordSchema.safeParse(password);
  return {
    valid: result.success,
    errors: result.success ? [] : result.error.issues.map(e => e.message),
  };
}

export function validateFileType(
  contentType: string,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(contentType)) {
    return {
      valid: false,
      error: `File type ${contentType} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }
  return { valid: true };
}

export function validateFileSize(size: number, maxSize: number): { valid: boolean; error?: string } {
  if (size > maxSize) {
    return {
      valid: false,
      error: `File size ${size} bytes exceeds maximum allowed size of ${maxSize} bytes`,
    };
  }
  return { valid: true };
}

// Type exports for TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type FamilyTreeSaveInput = z.infer<typeof familyTreeSaveSchema>;
export type DocumentAnalysisInput = z.infer<typeof documentAnalysisSchema>;
export type DNAAnalysisInput = z.infer<typeof dnaAnalysisSchema>;
export type PhotoAnalysisInput = z.infer<typeof photoAnalysisSchema>;
export type ResearchChatInput = z.infer<typeof researchChatSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;