/**
 * Application constants and configuration
 * Centralized place for all app-wide constants, limits, and settings
 */

// Application metadata
export const APP_CONFIG = {
  name: "GenealogyAI",
  description: "AI-powered genealogy research and family tree building",
  version: "1.0.0",
  author: "GenealogyAI Team",
  support: {
    email: process.env.SUPPORT_EMAIL || "support@genealogyai.com",
    url: process.env.SUPPORT_URL || "https://genealogyai.com/support",
  },
  website: process.env.WEBSITE_URL || "https://genealogyai.com",
} as const;

// Environment configuration
export const ENV = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: process.env.PORT || 3000,
  baseUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
} as const;

// Database configuration
export const DATABASE_CONFIG = {
  maxConnections: 20,
  connectionTimeout: 30000, // 30 seconds
  queryTimeout: 60000, // 1 minute
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

// Authentication configuration
export const AUTH_CONFIG = {
  sessionMaxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  verificationTokenExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  resetTokenExpiry: 60 * 60 * 1000, // 1 hour in milliseconds
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordMinLength: 8,
  passwordRequirements: {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  },
} as const;

// File upload limits and configuration
export const FILE_CONFIG = {
  maxFileSize: {
    document: 50 * 1024 * 1024, // 50MB
    photo: 20 * 1024 * 1024, // 20MB
    avatar: 5 * 1024 * 1024, // 5MB
  },
  allowedTypes: {
    documents: [
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
    photos: [
      "image/jpeg",
      "image/png",
      "image/tiff",
      "image/bmp",
      "image/gif",
      "image/webp",
    ],
    avatars: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ],
  },
  supabase: {
    bucket: "files",
    presignedUrlExpiry: 3600, // 1 hour
  },
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // requests per window
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // login attempts per window
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // uploads per window
  },
  analysis: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // analyses per window for free users
  },
} as const;

// Subscription tiers and limits
export const SUBSCRIPTION_TIERS = ["FREE", "EXPLORER", "RESEARCHER", "PROFESSIONAL"] as const;

export const SUBSCRIPTION_FEATURES = {
  FREE: {
    price: 0,
    popular: false,
    features: [
      "5 document analyses per month",
      "2 photo analyses per month",
      "Basic family tree building",
      "Email support",
    ],
    limits: {
      document: 5,
      photo: 2,
      familytree: 3,
      research: 10,
      dna: 0,
    },
  },
  EXPLORER: {
    price: 1900, // $19.00 in cents
    popular: true,
    features: [
      "50 document analyses per month",
      "25 photo analyses per month",
      "Advanced family tree features",
      "DNA analysis (3 per month)",
      "Priority email support",
      "Export to GEDCOM",
    ],
    limits: {
      document: 50,
      photo: 25,
      familytree: -1, // unlimited
      research: 100,
      dna: 3,
    },
  },
  RESEARCHER: {
    price: 3900, // $39.00 in cents
    popular: false,
    features: [
      "200 document analyses per month",
      "100 photo analyses per month",
      "Unlimited family trees",
      "DNA analysis (10 per month)",
      "Research copilot unlimited",
      "Priority support",
      "Advanced exports",
      "Collaboration features",
    ],
    limits: {
      document: 200,
      photo: 100,
      familytree: -1, // unlimited
      research: -1, // unlimited
      dna: 10,
    },
  },
  PROFESSIONAL: {
    price: 7900, // $79.00 in cents
    popular: false,
    features: [
      "Unlimited document analyses",
      "Unlimited photo analyses",
      "Unlimited family trees",
      "Unlimited DNA analysis",
      "Unlimited research copilot",
      "White-label options",
      "API access",
      "Dedicated support",
      "Custom integrations",
    ],
    limits: {
      document: -1, // unlimited
      photo: -1, // unlimited
      familytree: -1, // unlimited
      research: -1, // unlimited
      dna: -1, // unlimited
    },
  },
} as const;

// Analysis types and configuration
export const ANALYSIS_TYPES = ["DOCUMENT", "DNA", "PHOTO", "RESEARCH"] as const;

export const ANALYSIS_CONFIG = {
  maxRetries: 3,
  timeout: 60000, // 1 minute
  confidenceThreshold: 0.7,
  batchSize: 10,
} as const;

// Claude AI configuration
export const CLAUDE_CONFIG = {
  model: "claude-sonnet-4-20250514",
  maxTokens: {
    document: 2000,
    dna: 2500,
    photo: 2000,
    tree: 3000,
    research: 1500,
  },
  temperature: {
    document: 0.3,
    dna: 0.4,
    photo: 0.7,
    tree: 0.5,
    research: 0.6,
  },
  timeout: 60000, // 1 minute
  maxRetries: 3,
} as const;

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "noreply@genealogyai.com",
  replyTo: process.env.EMAIL_REPLY_TO || "support@genealogyai.com",
  templates: {
    verification: "email-verification",
    welcome: "welcome",
    passwordReset: "password-reset",
    notification: "notification",
    receipt: "payment-receipt",
  },
  rateLimit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // emails per hour per recipient
  },
} as const;

// Stripe configuration
export const STRIPE_CONFIG = {
  currency: "usd",
  paymentMethods: ["card"],
  webhookEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
  priceIds: {
    EXPLORER: process.env.STRIPE_EXPLORER_PRICE_ID,
    RESEARCHER: process.env.STRIPE_RESEARCHER_PRICE_ID,
    PROFESSIONAL: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
  },
} as const;

// Pagination defaults
export const PAGINATION_CONFIG = {
  defaultLimit: 10,
  maxLimit: 100,
  defaultPage: 1,
} as const;

// Search configuration
export const SEARCH_CONFIG = {
  minQueryLength: 2,
  maxQueryLength: 200,
  resultsPerPage: 20,
  maxResults: 1000,
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  ttl: {
    short: 5 * 60, // 5 minutes
    medium: 30 * 60, // 30 minutes
    long: 60 * 60, // 1 hour
    day: 24 * 60 * 60, // 24 hours
  },
  keys: {
    user: "user:",
    subscription: "subscription:",
    usage: "usage:",
    analysis: "analysis:",
  },
} as const;

// Logging configuration
export const LOG_CONFIG = {
  level: process.env.LOG_LEVEL || "info",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  datePattern: "YYYY-MM-DD",
  format: "json",
} as const;

// Security configuration
export const SECURITY_CONFIG = {
  encryption: {
    algorithm: "aes-256-gcm",
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  },
  headers: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", "https://js.stripe.com"],
      },
    },
  },
} as const;

// Error codes and messages
export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: "AUTH_001",
  AUTH_ACCOUNT_LOCKED: "AUTH_002",
  AUTH_EMAIL_NOT_VERIFIED: "AUTH_003",
  AUTH_TOKEN_EXPIRED: "AUTH_004",
  AUTH_TOKEN_INVALID: "AUTH_005",

  // Authorization errors
  AUTHZ_INSUFFICIENT_PERMISSIONS: "AUTHZ_001",
  AUTHZ_SUBSCRIPTION_REQUIRED: "AUTHZ_002",
  AUTHZ_USAGE_LIMIT_EXCEEDED: "AUTHZ_003",

  // Validation errors
  VALIDATION_INVALID_INPUT: "VAL_001",
  VALIDATION_REQUIRED_FIELD: "VAL_002",
  VALIDATION_INVALID_FORMAT: "VAL_003",

  // File upload errors
  FILE_TOO_LARGE: "FILE_001",
  FILE_INVALID_TYPE: "FILE_002",
  FILE_UPLOAD_FAILED: "FILE_003",

  // Analysis errors
  ANALYSIS_FAILED: "ANALYSIS_001",
  ANALYSIS_TIMEOUT: "ANALYSIS_002",
  ANALYSIS_QUOTA_EXCEEDED: "ANALYSIS_003",

  // Database errors
  DB_CONNECTION_FAILED: "DB_001",
  DB_QUERY_FAILED: "DB_002",
  DB_RECORD_NOT_FOUND: "DB_003",
  DB_DUPLICATE_ENTRY: "DB_004",

  // External service errors
  EXTERNAL_SERVICE_UNAVAILABLE: "EXT_001",
  EXTERNAL_SERVICE_TIMEOUT: "EXT_002",
  EXTERNAL_SERVICE_RATE_LIMITED: "EXT_003",
} as const;

// Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Regular expressions for validation
export const REGEX_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  phone: /^\+?[1-9]\d{1,14}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  date: /^\d{4}-\d{2}-\d{2}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  enableAnalytics: process.env.ENABLE_ANALYTICS === "true",
  enableCaching: process.env.ENABLE_CACHING === "true",
  enableRateLimit: process.env.ENABLE_RATE_LIMIT === "true",
  enableLogging: process.env.ENABLE_LOGGING !== "false",
  enableMetrics: process.env.ENABLE_METRICS === "true",
  betaFeatures: process.env.ENABLE_BETA_FEATURES === "true",
} as const;

// Export type definitions
export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[number];
export type AnalysisType = typeof ANALYSIS_TYPES[number];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];