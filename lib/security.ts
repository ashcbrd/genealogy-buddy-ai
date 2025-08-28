import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_LIMITS } from "@/types";
import { AnalysisType, SubscriptionTier } from "@prisma/client";

// Security configuration
const SECURITY_CONFIG = {
  RATE_LIMITS: {
    IP: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes per IP
    USER: { requests: 200, windowMs: 15 * 60 * 1000 }, // 200 requests per 15 minutes per user
    ENDPOINT: {
      '/api/tools/': { requests: 30, windowMs: 60 * 1000 }, // 30 tool requests per minute
      '/api/auth/': { requests: 10, windowMs: 60 * 1000 }, // 10 auth requests per minute
    }
  },
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp',
      'application/pdf', 'text/plain', 'text/csv'
    ],
    SCAN_TIMEOUT: 5000 // 5 seconds for virus scanning
  },
  ABUSE_DETECTION: {
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
    SUSPICIOUS_PATTERNS: {
      RAPID_REQUESTS: { threshold: 20, windowMs: 10 * 1000 }, // 20 requests in 10 seconds
      UNUSUAL_TIMING: { threshold: 100, windowMs: 1000 }, // More than 100 requests per second
    }
  }
};

export interface SecurityContext {
  userId?: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  timestamp: Date;
}

// Extract security context from request
export function getSecurityContext(req: NextRequest, session?: any): SecurityContext {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  
  return {
    userId: session?.user?.id,
    ipAddress: forwarded?.split(',')[0] || realIp || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    endpoint: req.nextUrl.pathname,
    method: req.method,
    timestamp: new Date()
  };
}

// Comprehensive audit logging
export async function logSecurityEvent(
  context: SecurityContext,
  action: string,
  options: {
    resource?: string;
    resourceId?: string;
    allowed?: boolean;
    reason?: string;
    metadata?: Record<string, any>;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } = {}
) {
  try {
    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: context.userId,
        action,
        resource: options.resource,
        resourceId: options.resourceId,
        allowed: options.allowed ?? true,
        reason: options.reason,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : null,
      }
    });

    // Create security alert for high-severity events
    if (options.severity && ['HIGH', 'CRITICAL'].includes(options.severity)) {
      await prisma.securityAlert.create({
        data: {
          userId: context.userId,
          type: action,
          severity: options.severity,
          message: options.reason || `Security event: ${action}`,
          metadata: {
            ...options.metadata,
            context: {
              endpoint: context.endpoint,
              method: context.method,
              ipAddress: context.ipAddress,
              timestamp: context.timestamp.toISOString()
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging failures shouldn't break the main flow
  }
}

// Atomic usage validation and increment
export async function validateAndIncrementUsage(
  userId: string,
  type: AnalysisType,
  context: SecurityContext
): Promise<{ allowed: boolean; reason?: string; currentUsage?: number; limit?: number }> {
  
  // Use database transaction for atomic operations
  return await prisma.$transaction(async (tx) => {
    // Get subscription with lock
    const subscription = await tx.subscription.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } }
    });

    const tier = subscription?.tier || SubscriptionTier.FREE;
    const limits = SUBSCRIPTION_LIMITS[tier];
    const toolKey = type.toLowerCase() as keyof typeof limits;
    const limit = limits[toolKey] as number;

    // Check if feature is available for this tier
    if (limit === 0) {
      await logSecurityEvent(context, 'USAGE_VALIDATION_FAILED', {
        resource: type,
        allowed: false,
        reason: `${type} analysis not available in ${tier} plan`,
        severity: 'MEDIUM'
      });
      return {
        allowed: false,
        reason: `${type.toLowerCase().replace('_', ' ')} analysis is not available in your plan. Please upgrade to access this feature.`,
        currentUsage: 0,
        limit: 0
      };
    }

    // Unlimited usage for this tier
    if (limit === -1) {
      return { allowed: true, currentUsage: -1, limit: -1 };
    }

    // Get current period usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const currentUsage = await tx.analysis.count({
      where: {
        userId,
        type,
        createdAt: { gte: startOfMonth },
        deletedAt: null,
      },
    });

    // Check if limit would be exceeded
    if (currentUsage >= limit) {
      await logSecurityEvent(context, 'USAGE_LIMIT_EXCEEDED', {
        resource: type,
        allowed: false,
        reason: `Monthly limit of ${limit} ${type} analyses exceeded`,
        metadata: { currentUsage, limit, tier },
        severity: 'MEDIUM'
      });
      return {
        allowed: false,
        reason: `You have reached your monthly limit of ${limit} ${type.toLowerCase().replace('_', ' ')} analyses. Please upgrade your plan or wait until next month.`,
        currentUsage,
        limit
      };
    }

    // Pre-increment usage counter to prevent race conditions
    await tx.usage.upsert({
      where: {
        userId_type_period: {
          userId,
          type,
          period: startOfMonth,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        userId,
        type,
        count: 1,
        period: startOfMonth,
      },
    });

    await logSecurityEvent(context, 'USAGE_VALIDATED', {
      resource: type,
      allowed: true,
      metadata: { currentUsage: currentUsage + 1, limit, tier }
    });

    return {
      allowed: true,
      currentUsage: currentUsage + 1,
      limit
    };
  });
}

// Rate limiting implementation
export async function checkRateLimit(
  identifier: string,
  type: 'ip' | 'user' | 'endpoint',
  endpoint?: string
): Promise<{ allowed: boolean; resetAt?: Date; remaining?: number }> {
  
  const config = type === 'endpoint' && endpoint ? 
    (SECURITY_CONFIG.RATE_LIMITS.ENDPOINT as any)[endpoint] :
    SECURITY_CONFIG.RATE_LIMITS[type.toUpperCase() as 'IP' | 'USER'];

  if (!config) {
    return { allowed: true };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    const rateLimit = await prisma.rateLimit.findUnique({
      where: {
        identifier_type_endpoint: {
          identifier,
          type,
          endpoint: endpoint || ''
        }
      }
    });

    // No existing rate limit record
    if (!rateLimit) {
      await prisma.rateLimit.create({
        data: {
          identifier,
          type,
          endpoint,
          count: 1,
          resetAt: new Date(now.getTime() + config.windowMs)
        }
      });
      return { allowed: true, remaining: config.requests - 1 };
    }

    // Rate limit expired, reset
    if (rateLimit.resetAt <= now) {
      await prisma.rateLimit.update({
        where: { id: rateLimit.id },
        data: {
          count: 1,
          resetAt: new Date(now.getTime() + config.windowMs)
        }
      });
      return { allowed: true, remaining: config.requests - 1 };
    }

    // Check if limit exceeded
    if (rateLimit.count >= config.requests) {
      return {
        allowed: false,
        resetAt: rateLimit.resetAt,
        remaining: 0
      };
    }

    // Increment counter
    await prisma.rateLimit.update({
      where: { id: rateLimit.id },
      data: { count: { increment: 1 } }
    });

    return {
      allowed: true,
      remaining: config.requests - (rateLimit.count + 1)
    };

  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if rate limiting fails
    return { allowed: true };
  }
}

// Comprehensive security validation for API endpoints
export async function validateApiSecurity(
  req: NextRequest,
  options: {
    requireAuth?: boolean;
    checkRateLimit?: boolean;
    logRequest?: boolean;
    validateUsage?: { type: AnalysisType };
  } = {}
): Promise<{
  allowed: boolean;
  session?: any;
  context: SecurityContext;
  error?: {
    status: number;
    message: string;
    code?: string;
  };
  usageValidation?: {
    currentUsage: number;
    limit: number;
    remaining: number;
  };
}> {

  // Get session if required
  let session = null;
  if (options.requireAuth) {
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        allowed: false,
        context: getSecurityContext(req),
        error: {
          status: 401,
          message: "Authentication required. Please log in to use this feature.",
          code: "UNAUTHORIZED"
        }
      };
    }
  }

  const context = getSecurityContext(req, session);

  // Log request if required
  if (options.logRequest) {
    await logSecurityEvent(context, 'API_REQUEST', {
      resource: context.endpoint,
      metadata: {
        method: context.method,
        hasAuth: !!session
      }
    });
  }

  // Rate limiting
  if (options.checkRateLimit) {
    // Check IP-based rate limiting
    const ipLimit = await checkRateLimit(context.ipAddress, 'ip');
    if (!ipLimit.allowed) {
      await logSecurityEvent(context, 'RATE_LIMIT_EXCEEDED', {
        resource: 'IP_RATE_LIMIT',
        allowed: false,
        reason: 'IP rate limit exceeded',
        severity: 'MEDIUM'
      });
      return {
        allowed: false,
        context,
        error: {
          status: 429,
          message: "Too many requests. Please slow down and try again later.",
          code: "RATE_LIMIT_EXCEEDED"
        }
      };
    }

    // Check user-based rate limiting if authenticated
    if (session?.user?.id) {
      const userLimit = await checkRateLimit(session.user.id, 'user');
      if (!userLimit.allowed) {
        await logSecurityEvent(context, 'RATE_LIMIT_EXCEEDED', {
          resource: 'USER_RATE_LIMIT',
          allowed: false,
          reason: 'User rate limit exceeded',
          severity: 'HIGH'
        });
        return {
          allowed: false,
          context,
          error: {
            status: 429,
            message: "You have exceeded your request limit. Please wait before trying again.",
            code: "USER_RATE_LIMIT_EXCEEDED"
          }
        };
      }
    }

    // Check endpoint-specific rate limiting
    const endpointLimit = await checkRateLimit(
      session?.user?.id || context.ipAddress,
      'endpoint',
      context.endpoint
    );
    if (!endpointLimit.allowed) {
      await logSecurityEvent(context, 'RATE_LIMIT_EXCEEDED', {
        resource: 'ENDPOINT_RATE_LIMIT',
        allowed: false,
        reason: 'Endpoint rate limit exceeded',
        severity: 'HIGH'
      });
      return {
        allowed: false,
        context,
        error: {
          status: 429,
          message: "This endpoint is temporarily rate limited. Please try again later.",
          code: "ENDPOINT_RATE_LIMIT_EXCEEDED"
        }
      };
    }
  }

  // Usage validation
  let usageValidation;
  if (options.validateUsage && session?.user?.id) {
    const validation = await validateAndIncrementUsage(
      session.user.id,
      options.validateUsage.type,
      context
    );

    if (!validation.allowed) {
      return {
        allowed: false,
        session,
        context,
        error: {
          status: validation.limit === 0 ? 402 : 429,
          message: validation.reason || "Usage limit exceeded",
          code: validation.limit === 0 ? "FEATURE_NOT_AVAILABLE" : "USAGE_LIMIT_EXCEEDED"
        }
      };
    }

    usageValidation = {
      currentUsage: validation.currentUsage || 0,
      limit: validation.limit || 0,
      remaining: Math.max(0, (validation.limit || 0) - (validation.currentUsage || 0))
    };
  }

  return {
    allowed: true,
    session,
    context,
    usageValidation
  };
}

// File upload validation
export async function validateFileUpload(
  file: File,
  context: SecurityContext
): Promise<{ allowed: boolean; reason?: string }> {

  // Check file size
  if (file.size > SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE) {
    await logSecurityEvent(context, 'FILE_UPLOAD_REJECTED', {
      resource: 'FILE_VALIDATION',
      allowed: false,
      reason: 'File size exceeds limit',
      metadata: { fileSize: file.size, maxSize: SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE },
      severity: 'MEDIUM'
    });
    return {
      allowed: false,
      reason: `File size exceeds the maximum limit of ${SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
    await logSecurityEvent(context, 'FILE_UPLOAD_REJECTED', {
      resource: 'FILE_VALIDATION',
      allowed: false,
      reason: 'File type not allowed',
      metadata: { fileType: file.type },
      severity: 'MEDIUM'
    });
    return {
      allowed: false,
      reason: `File type ${file.type} is not allowed. Please upload a supported file format.`
    };
  }

  // Basic file content validation (check for malicious patterns)
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Check for suspicious file headers or content
    const suspiciousPatterns = [
      Buffer.from([0x4D, 0x5A]), // PE executable
      Buffer.from('<?php'), // PHP script
      Buffer.from('<script'), // JavaScript
      Buffer.from('javascript:'), // JavaScript URL
    ];

    for (const pattern of suspiciousPatterns) {
      if (buffer.indexOf(pattern) !== -1) {
        await logSecurityEvent(context, 'MALICIOUS_FILE_DETECTED', {
          resource: 'FILE_VALIDATION',
          allowed: false,
          reason: 'Suspicious file content detected',
          metadata: { fileName: file.name, fileType: file.type },
          severity: 'CRITICAL'
        });
        return {
          allowed: false,
          reason: 'File contains suspicious content and cannot be uploaded'
        };
      }
    }
  } catch (error) {
    console.error('File validation error:', error);
    return {
      allowed: false,
      reason: 'File validation failed. Please try again.'
    };
  }

  return { allowed: true };
}

// Cleanup expired rate limits and old audit logs
export async function cleanupSecurityData() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  try {
    // Clean up expired rate limits
    await prisma.rateLimit.deleteMany({
      where: {
        resetAt: { lt: now }
      }
    });

    // Clean up old audit logs (keep for 30 days)
    await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    });

    console.log('Security data cleanup completed');
  } catch (error) {
    console.error('Security data cleanup failed:', error);
  }
}

// Abuse detection
export async function detectAbusePatterns(
  userId?: string,
  ipAddress?: string
): Promise<{ detected: boolean; patterns: string[]; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> {
  
  const patterns: string[] = [];
  let maxSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));

  try {
    // Check for rapid API requests
    if (userId || ipAddress) {
      const identifier = userId || ipAddress!;
      const recentRequests = await prisma.auditLog.count({
        where: {
          AND: [
            { createdAt: { gte: oneHourAgo } },
            userId ? { userId } : { ipAddress }
          ]
        }
      });

      if (recentRequests > 500) {
        patterns.push('EXCESSIVE_API_USAGE');
        maxSeverity = 'HIGH';
      } else if (recentRequests > 200) {
        patterns.push('HIGH_API_USAGE');
        maxSeverity = 'MEDIUM';
      }
    }

    // Check for repeated failures
    if (userId || ipAddress) {
      const failedAttempts = await prisma.auditLog.count({
        where: {
          AND: [
            { createdAt: { gte: oneHourAgo } },
            { allowed: false },
            userId ? { userId } : { ipAddress }
          ]
        }
      });

      if (failedAttempts > 20) {
        patterns.push('REPEATED_FAILURES');
        maxSeverity = 'CRITICAL';
      } else if (failedAttempts > 10) {
        patterns.push('MULTIPLE_FAILURES');
        maxSeverity = 'HIGH';
      }
    }

  } catch (error) {
    console.error('Abuse detection failed:', error);
  }

  return {
    detected: patterns.length > 0,
    patterns,
    severity: maxSeverity
  };
}

export { SECURITY_CONFIG };