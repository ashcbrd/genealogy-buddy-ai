import * as crypto from "crypto";
import { SECURITY_CONFIG } from "./constants";

/**
 * Security utilities for encryption, hashing, token generation, and data sanitization
 */

// Encryption configuration
const ALGORITHM = SECURITY_CONFIG.encryption.algorithm;
const KEY_LENGTH = SECURITY_CONFIG.encryption.keyLength;
const IV_LENGTH = SECURITY_CONFIG.encryption.ivLength;
const TAG_LENGTH = SECURITY_CONFIG.encryption.tagLength;

/**
 * Generate a cryptographically secure random key
 */
export function generateSecureKey(length: number = KEY_LENGTH): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a URL-safe token
 */
export function generateUrlSafeToken(length: number = 32): string {
  return crypto
    .randomBytes(Math.ceil(length * 3 / 4))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length);
}

/**
 * Generate a numeric OTP
 */
export function generateOTP(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

/**
 * Hash a password using bcrypt-style approach with crypto.scrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string, key?: string): { encrypted: string; key: string } {
  const encryptionKey = key ? Buffer.from(key, 'hex') : crypto.randomBytes(KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipher(ALGORITHM, encryptionKey);
  cipher.setAAD(Buffer.alloc(0)); // Additional authenticated data (empty for simplicity)
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV, auth tag, and encrypted data
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
  
  return {
    encrypted: combined.toString('hex'),
    key: encryptionKey.toString('hex')
  };
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string, key: string): string {
  const combined = Buffer.from(encryptedData, 'hex');
  const encryptionKey = Buffer.from(key, 'hex');
  
  // Extract IV, auth tag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
  
  const decipher = crypto.createDecipher(ALGORITHM, encryptionKey);
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.alloc(0));
  
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Create HMAC signature for data integrity
 */
export function createHMAC(data: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHMAC(data: string, signature: string, secret: string): boolean {
  const expectedSignature = createHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Hash data using SHA-256
 */
export function hashData(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  return generateSecureToken(48);
}

/**
 * Create a secure cookie with proper flags
 */
export function createSecureCookieOptions(isProduction: boolean = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  };
}

/**
 * Rate limiting using sliding window
 */
export class SlidingWindowRateLimit {
  private windows = new Map<string, number[]>();

  constructor(
    private maxRequests: number,
    private windowSizeMs: number
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const window = this.windows.get(key) || [];
    
    // Remove old requests outside the window
    const cutoff = now - this.windowSizeMs;
    const validRequests = window.filter(timestamp => timestamp > cutoff);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.windows.set(key, validRequests);
    
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowSizeMs;
    
    for (const [key, window] of Array.from(this.windows.entries())) {
      const validRequests = window.filter(timestamp => timestamp > cutoff);
      
      if (validRequests.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, validRequests);
      }
    }
  }
}

/**
 * Simple in-memory cache with TTL
 */
export class TTLCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();

  constructor(private defaultTTL: number = 300000) {} // 5 minutes default

  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Generate Content Security Policy header value
 */
export function generateCSP(options: {
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  frameSrc?: string[];
  reportUri?: string;
}): string {
  const {
    scriptSrc = ["'self'"],
    styleSrc = ["'self'", "'unsafe-inline'"],
    imgSrc = ["'self'", "data:", "https:"],
    connectSrc = ["'self'"],
    fontSrc = ["'self'"],
    frameSrc = ["'self'"],
    reportUri,
  } = options;

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${styleSrc.join(' ')}`,
    `img-src ${imgSrc.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    `font-src ${fontSrc.join(' ')}`,
    `frame-src ${frameSrc.join(' ')}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];

  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  return directives.join('; ');
}

/**
 * Validate file upload security
 */
export function validateFileUpload(
  file: {
    name: string;
    type: string;
    size: number;
  },
  options: {
    allowedTypes: string[];
    maxSize: number;
    allowedExtensions?: string[];
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check file type
  if (!options.allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Check file size
  if (file.size > options.maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${options.maxSize} bytes`);
  }

  // Check file extension if specified
  if (options.allowedExtensions) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !options.allowedExtensions.includes(extension)) {
      errors.push(`File extension .${extension} is not allowed`);
    }
  }

  // Check for potentially dangerous filenames
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    errors.push('Invalid filename');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure nonce for CSP
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  );
}

/**
 * Generate a password reset token with expiry
 */
export function generatePasswordResetToken(): {
  token: string;
  hashedToken: string;
  expiresAt: Date;
} {
  const token = generateUrlSafeToken(32);
  const hashedToken = hashData(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return {
    token,
    hashedToken,
    expiresAt,
  };
}

/**
 * Generate an email verification token
 */
export function generateEmailVerificationToken(): {
  token: string;
  hashedToken: string;
  expiresAt: Date;
} {
  const token = generateUrlSafeToken(32);
  const hashedToken = hashData(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    token,
    hashedToken,
    expiresAt,
  };
}

// Export singleton instances for common use cases
export const sessionCache = new TTLCache<any>(30 * 60 * 1000); // 30 minutes
export const rateLimitCache = new TTLCache<number>(60 * 60 * 1000); // 1 hour

// Cleanup intervals
setInterval(() => {
  sessionCache.cleanup();
  rateLimitCache.cleanup();
}, 5 * 60 * 1000); // Cleanup every 5 minutes