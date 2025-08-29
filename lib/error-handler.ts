import { NextRequest, NextResponse } from 'next/server';
import { logSecurityEvent, getSecurityContext } from './security';

export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: Record<string, any>;
  userId?: string;
  endpoint?: string;
}

export class SecurityError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, any>;

  constructor(message: string, code: string, status: number, details?: Record<string, any>) {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, any>;

  constructor(message: string, details?: Record<string, any>) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

export class UsageLimitError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, any>;

  constructor(message: string, details?: Record<string, any>) {
    super(message);
    this.name = 'UsageLimitError';
    this.code = 'USAGE_LIMIT_EXCEEDED';
    this.status = 429;
    this.details = details;
  }
}

export class RateLimitError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly resetAt?: Date;

  constructor(message: string, resetAt?: Date) {
    super(message);
    this.name = 'RateLimitError';
    this.code = 'RATE_LIMIT_EXCEEDED';
    this.status = 429;
    this.resetAt = resetAt;
  }
}

interface ErrorHandlerOptions {
  toolType: 'dna' | 'document' | 'photo' | 'research' | 'translation';
  operation?: string;
  status?: number;
  error: any;
}

interface FileRejectionError {
  code: 'file-too-large' | 'file-invalid-type' | string;
  message: string;
}

export function getToolErrorMessage({ toolType, operation, status, error }: ErrorHandlerOptions): string {
  // Handle HTTP status codes first - these take priority and should be final
  if (status === 413) {
    const sizeLimit = toolType === 'dna' ? '50MB' : '10MB';
    return `File is too large (over ${sizeLimit}). Please reduce the file size by compressing or splitting the file.`;
  }
  
  if (status === 415) {
    const formats = getAcceptedFormats(toolType);
    return `Unsupported file format. Please upload a file in one of these formats: ${formats}.`;
  }
  
  if (status === 429) {
    // Usage limits are handled by the UsageInfo component and button disabling
    // So we should not show separate 429 error messages to avoid duplicates
    // Return a generic message that won't be shown if buttons are properly disabled
    return 'Operation failed due to usage limits. Please check your usage status.';
  }
  
  if (status === 401 || status === 403) {
    const toolName = getToolDisplayName(toolType);
    const featureText = operation ? ` ${operation}` : '';
    return `Authentication required. Please sign in and ensure your subscription includes ${toolName}${featureText} features.`;
  }
  
  if (status && status >= 500) {
    const operationText = operation ? ` during ${operation}` : '';
    return `Server error occurred${operationText}. Our technical team has been notified. Please try again in a few minutes.`;
  }
  
  if (status === 400) {
    return getToolSpecificBadRequestMessage(toolType, operation);
  }
  
  // Handle common error patterns only if no status code was provided
  if (error?.message?.toLowerCase()?.includes('network') || error?.message?.includes('fetch')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  
  if (error?.message?.toLowerCase()?.includes('timeout')) {
    const operationText = operation ? ` for ${operation}` : '';
    return `Request timed out${operationText}. Please try again or contact support if the issue persists.`;
  }
  
  // Handle tool-specific errors as final fallback
  return getToolSpecificErrorMessage(toolType, operation, error);
}

function getToolDisplayName(toolType: 'dna' | 'document' | 'photo' | 'research' | 'translation'): string {
  switch (toolType) {
    case 'dna': return 'DNA analysis';
    case 'document': return 'document analysis';
    case 'photo': return 'photo analysis';
    case 'research': return 'AI research assistance';
    case 'translation': return 'ancient records translation';
    default: return 'this feature';
  }
}

export function getFileRejectionMessage(toolType: 'dna' | 'document' | 'photo', rejectionError: FileRejectionError): string {
  const sizeLimit = toolType === 'dna' ? '50MB' : '10MB';
  const formats = getAcceptedFormats(toolType);
  
  if (rejectionError.code === 'file-too-large') {
    const compressionTip = toolType === 'dna' 
      ? 'Try compressing the file or contact your DNA provider for a smaller format.'
      : 'Please compress the image or reduce the resolution while maintaining quality.';
    return `File is too large (over ${sizeLimit}). ${compressionTip}`;
  }
  
  if (rejectionError.code === 'file-invalid-type') {
    const tip = getFormatTip(toolType);
    return `Invalid file type. Please upload a file in one of these formats: ${formats}. ${tip}`;
  }
  
  return rejectionError.message;
}

function getAcceptedFormats(toolType: 'dna' | 'document' | 'photo' | 'research' | 'translation'): string {
  switch (toolType) {
    case 'dna':
      return 'TXT, CSV, or ZIP from 23andMe, AncestryDNA, or MyHeritage';
    case 'document':
      return 'PNG, JPG, GIF, TIFF, WebP, or PDF';
    case 'photo':
      return 'JPG, JPEG, PNG, WebP, BMP, or GIF';
    case 'research':
      return 'text input';
    case 'translation':
      return 'PNG, JPG, GIF, TIFF, WebP, PDF, or text input';
    default:
      return 'supported formats';
  }
}

function getFormatTip(toolType: 'dna' | 'document' | 'photo' | 'research' | 'translation'): string {
  switch (toolType) {
    case 'dna':
      return 'Ensure the file is from a recognized DNA testing provider.';
    case 'document':
      return 'For best results, use high-resolution scans (300+ DPI) with clear text.';
    case 'photo':
      return 'Historical photos work best when scanned at high quality with visible details.';
    case 'research':
      return 'Provide detailed research questions for best results.';
    case 'translation':
      return 'For best results, use clear historical documents with visible text. Multiple languages supported.';
    default:
      return '';
  }
}

function getToolSpecificBadRequestMessage(toolType: 'dna' | 'document' | 'photo' | 'research' | 'translation', operation?: string): string {
  switch (toolType) {
    case 'dna':
      return 'Invalid DNA file format. Please ensure the file contains valid genetic data from a recognized provider.';
    case 'document':
      return 'Unable to process this document. Please ensure the image is clear and readable with genealogical content.';
    case 'photo':
      return 'Unable to process this photo. Please ensure the image shows people or historical content suitable for analysis.';
    case 'research':
      return 'Unable to process your question. Please rephrase with specific genealogy topics or research goals.';
    case 'translation':
      if (operation === 'translation and analysis') {
        return 'Unable to translate this record. Please ensure the document contains readable text or upload a clearer image.';
      }
      return 'Invalid request data. Please provide either a clear image or text input for translation.';
    default:
      return 'Unable to process your request. Please check your input and try again.';
  }
}

function getToolSpecificErrorMessage(toolType: 'dna' | 'document' | 'photo' | 'research' | 'translation', operation?: string, error?: any): string {
  const errorMsg = error?.message?.toLowerCase() || '';
  
  // Handle parsing/processing errors
  if (errorMsg.includes('parse') || errorMsg.includes('corrupt') || errorMsg.includes('damaged')) {
    switch (toolType) {
      case 'dna':
        return 'Unable to read DNA file. Please ensure it\'s a valid, unmodified file from your DNA provider.';
      case 'document':
        return 'Document appears corrupted. Please try re-scanning or re-saving the document.';
      case 'photo':
        return 'Photo file appears corrupted. Please try re-saving the image and upload again.';
      default:
        return 'File appears corrupted. Please try uploading again.';
    }
  }
  
  // Handle specific tool errors
  if (toolType === 'research' && (errorMsg.includes('content') || errorMsg.includes('inappropriate'))) {
    return 'Please ensure your question is related to genealogy research, family history, or historical records.';
  }
  
  if (toolType === 'photo' && (errorMsg.includes('vision') || errorMsg.includes('image processing'))) {
    return 'Unable to analyze photo content. Please ensure the image is clear with adequate lighting and visible details.';
  }
  
  if (toolType === 'document' && errorMsg.includes('ocr')) {
    return 'Unable to read text from document. Please ensure high image quality with good contrast and clear text.';
  }
  
  if (toolType === 'translation') {
    if (operation === 'translation and analysis' && errorMsg.includes('language')) {
      return 'Unable to detect or translate the language. Please specify the source language or provide clearer text.';
    }
    if (operation === 'translation and analysis' && errorMsg.includes('ocr')) {
      return 'Unable to read text from image. Please provide a clearer, higher-resolution image.';
    }
    if (errorMsg.includes('format') || errorMsg.includes('unsupported')) {
      return 'Unsupported document format. Please provide text input or upload an image (PNG, JPG, PDF).';
    }
  }
  
  // Return the original error message if it exists and is meaningful, otherwise provide a generic fallback
  if (error?.message && !errorMsg.includes('failed') && !errorMsg.includes('error')) {
    return error.message;
  }
  
  // Fallback messages - keep these concise and avoid duplication
  const toolName = getToolDisplayName(toolType);
  const operationText = operation ? ` ${operation}` : '';
  
  return `${toolName.charAt(0).toUpperCase() + toolName.slice(1)}${operationText} failed. Please try again or contact support if the issue persists.`;
}

// Comprehensive error handler for API endpoints
export async function handleApiError(
  error: Error,
  req: NextRequest,
  session?: any
): Promise<NextResponse> {
  
  const context = getSecurityContext(req, session);
  
  // Handle specific error types
  if (error instanceof SecurityError) {
    await logSecurityEvent(context, 'API_SECURITY_ERROR', {
      resource: context.endpoint,
      allowed: false,
      reason: error.message,
      metadata: { 
        errorCode: error.code,
        details: error.details 
      },
      severity: 'HIGH'
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && { details: error.details })
      },
      { 
        status: error.status,
        headers: getSecurityHeaders()
      }
    );
  }

  if (error instanceof ValidationError) {
    await logSecurityEvent(context, 'API_VALIDATION_ERROR', {
      resource: context.endpoint,
      allowed: false,
      reason: error.message,
      metadata: { details: error.details },
      severity: 'MEDIUM'
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && { details: error.details })
      },
      { 
        status: error.status,
        headers: getSecurityHeaders()
      }
    );
  }

  if (error instanceof UsageLimitError) {
    await logSecurityEvent(context, 'API_USAGE_LIMIT_ERROR', {
      resource: context.endpoint,
      allowed: false,
      reason: error.message,
      metadata: { details: error.details },
      severity: 'MEDIUM'
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && { details: error.details })
      },
      { 
        status: error.status,
        headers: getSecurityHeaders()
      }
    );
  }

  if (error instanceof RateLimitError) {
    const headers = getSecurityHeaders();
    if (error.resetAt) {
      headers.set('Retry-After', Math.ceil((error.resetAt.getTime() - Date.now()) / 1000).toString());
      headers.set('X-RateLimit-Reset', error.resetAt.toISOString());
    }

    await logSecurityEvent(context, 'API_RATE_LIMIT_ERROR', {
      resource: context.endpoint,
      allowed: false,
      reason: error.message,
      metadata: { resetAt: error.resetAt?.toISOString() },
      severity: 'HIGH'
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code
      },
      { 
        status: error.status,
        headers
      }
    );
  }

  // Handle database errors
  if (error.message.includes('Prisma') || error.message.includes('Database')) {
    await logSecurityEvent(context, 'API_DATABASE_ERROR', {
      resource: context.endpoint,
      allowed: false,
      reason: 'Database operation failed',
      metadata: { 
        originalError: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      severity: 'HIGH'
    });

    return NextResponse.json(
      {
        error: 'A database error occurred. Please try again later.',
        code: 'DATABASE_ERROR'
      },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    );
  }

  // Handle timeout errors
  if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
    await logSecurityEvent(context, 'API_TIMEOUT_ERROR', {
      resource: context.endpoint,
      allowed: false,
      reason: 'Request timeout',
      metadata: { originalError: error.message },
      severity: 'MEDIUM'
    });

    return NextResponse.json(
      {
        error: 'Request timed out. Please try again.',
        code: 'TIMEOUT_ERROR'
      },
      { 
        status: 408,
        headers: getSecurityHeaders()
      }
    );
  }

  // Handle generic errors
  await logSecurityEvent(context, 'API_INTERNAL_ERROR', {
    resource: context.endpoint,
    allowed: false,
    reason: 'Internal server error',
    metadata: { 
      errorMessage: error.message,
      errorName: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    severity: 'CRITICAL'
  });

  // Log full error for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }

  return NextResponse.json(
    {
      error: 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { 
        debug: {
          message: error.message,
          stack: error.stack
        }
      })
    },
    { 
      status: 500,
      headers: getSecurityHeaders()
    }
  );
}

// Security headers for all responses
export function getSecurityHeaders(): Headers {
  const headers = new Headers();

  // Security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vercel.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://api.anthropic.com wss://vercel.live; " +
    "media-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );

  // Rate limiting info
  headers.set('X-RateLimit-Policy', 'IP: 100/15min, User: 200/15min, Endpoint: 30/min');

  return headers;
}

// Wrapper for API endpoints with comprehensive error handling
export function withErrorHandler(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const response = await handler(req, ...args);
      
      // Add security headers to successful responses
      const securityHeaders = getSecurityHeaders();
      securityHeaders.forEach((value, key) => {
        if (!response.headers.has(key)) {
          response.headers.set(key, value);
        }
      });
      
      return response;
    } catch (error) {
      return handleApiError(error as Error, req);
    }
  };
}

// Input sanitization utilities
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could be used for injection
    .replace(/javascript:/gi, '') // Remove javascript: urls
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

export function sanitizeEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();
  
  if (!emailRegex.test(sanitized)) {
    throw new ValidationError('Invalid email format');
  }
  
  return sanitized;
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.\-_]/g, '') // Only allow alphanumeric, dots, hyphens, underscores
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .substring(0, 255); // Limit length
}

// Request validation utilities
export function validateContentType(req: NextRequest, allowedTypes: string[]): void {
  const contentType = req.headers.get('content-type');
  
  if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
    throw new ValidationError(
      `Invalid content type. Allowed types: ${allowedTypes.join(', ')}`,
      { contentType, allowedTypes }
    );
  }
}

export function validateRequestSize(req: NextRequest, maxSize: number): void {
  const contentLength = req.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    throw new ValidationError(
      `Request size exceeds maximum allowed size of ${maxSize} bytes`,
      { contentLength: parseInt(contentLength), maxSize }
    );
  }
}

// Response utilities
export function createSuccessResponse(
  data: any,
  metadata?: Record<string, any>
): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...metadata
  });
  
  // Add security headers
  const securityHeaders = getSecurityHeaders();
  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export function createErrorResponse(
  message: string,
  code: string,
  status: number,
  details?: Record<string, any>
): NextResponse {
  const response = NextResponse.json(
    {
      error: message,
      code,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && details && { details })
    },
    { status }
  );
  
  // Add security headers
  const securityHeaders = getSecurityHeaders();
  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  return response;
}