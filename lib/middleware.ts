import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { logger, createRequestContext } from "./logger";
import { RATE_LIMITS, HTTP_STATUS } from "./constants";

/**
 * Middleware utilities for request processing, authentication, rate limiting, etc.
 */

export interface MiddlewareContext {
  req: NextRequest;
  userId?: string;
  sessionToken?: string;
  ip?: string;
  userAgent?: string;
  startTime: number;
}

export type MiddlewareFunction = (
  context: MiddlewareContext
) => Promise<NextResponse>;

/**
 * Create middleware context from request
 */
export function createMiddlewareContext(req: NextRequest): MiddlewareContext {
  return {
    req,
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    userAgent: req.headers.get("user-agent") || "unknown",
    startTime: Date.now(),
  };
}

/**
 * Authentication middleware - checks for valid session
 */
export async function withAuth(
  handler: (context: MiddlewareContext) => Promise<NextResponse>,
  options: { required?: boolean } = {}
): Promise<MiddlewareFunction> {
  return async (context: MiddlewareContext): Promise<NextResponse> => {
    try {
      // Get session token
      const token = await getToken({
        req: context.req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token && options.required) {
        logger.warn("Authentication required but no valid session found", {
          path: context.req.nextUrl.pathname,
          ip: context.ip,
          userAgent: context.userAgent,
        });

        return NextResponse.json(
          { error: "Authentication required" },
          { status: HTTP_STATUS.UNAUTHORIZED }
        );
      }

      // Add user info to context
      if (token) {
        context.userId = token.sub as string;
        context.sessionToken = token.jti as string;
      }

      return handler(context);
    } catch (error) {
      logger.error("Authentication middleware error", error as Error, {
        path: context.req.nextUrl.pathname,
        ip: context.ip,
      });

      return NextResponse.json(
        { error: "Authentication failed" },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
  };
}

/**
 * Rate limiting middleware
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  isRateLimited(
    key: string,
    windowMs: number,
    maxRequests: number
  ): { limited: boolean; resetTime: number } {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now >= record.resetTime) {
      // New window or expired
      this.requests.set(key, { count: 1, resetTime: now + windowMs });
      return { limited: false, resetTime: now + windowMs };
    }

    if (record.count >= maxRequests) {
      return { limited: true, resetTime: record.resetTime };
    }

    // Increment count
    record.count++;
    this.requests.set(key, record);

    return { limited: false, resetTime: record.resetTime };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of Array.from(this.requests.entries())) {
      if (now >= record.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  getRequestCount(key: string): number {
    return this.requests.get(key)?.count || 0;
  }
}

const rateLimiter = new RateLimiter();

// Cleanup expired entries every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

export async function withRateLimit(
  handler: (context: MiddlewareContext) => Promise<NextResponse>,
  options: {
    windowMs?: number;
    max?: number;
    keyGenerator?: (context: MiddlewareContext) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  } = {}
): Promise<MiddlewareFunction> {
  return async (context: MiddlewareContext): Promise<NextResponse> => {
    const {
      windowMs = RATE_LIMITS.api.windowMs,
      max = RATE_LIMITS.api.max,
      keyGenerator = (ctx) => ctx.ip || "anonymous",
    } = options;

    const key = keyGenerator(context);
    const { limited, resetTime } = rateLimiter.isRateLimited(key, windowMs, max);

    if (limited) {
      logger.warn("Rate limit exceeded", {
        key,
        path: context.req.nextUrl.pathname,
        ip: context.ip,
        userAgent: context.userAgent,
        resetTime: new Date(resetTime).toISOString(),
      });

      return NextResponse.json(
        {
          error: "Too many requests",
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
        {
          status: HTTP_STATUS.TOO_MANY_REQUESTS,
          headers: {
            "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": max.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(resetTime).toISOString(),
          },
        }
      );
    }

    const response = await handler(context);

    // Add rate limit headers
    const remainingRequests = Math.max(0, max - rateLimiter.getRequestCount(key));
    response.headers.set("X-RateLimit-Limit", max.toString());
    response.headers.set("X-RateLimit-Remaining", remainingRequests.toString());
    response.headers.set("X-RateLimit-Reset", new Date(resetTime).toISOString());

    return response;
  };
}

/**
 * CORS middleware
 */
export async function withCors(
  handler: (context: MiddlewareContext) => Promise<NextResponse>,
  options: {
    origin?: string | string[] | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
  } = {}
): Promise<MiddlewareFunction> {
  return async (context: MiddlewareContext): Promise<NextResponse> => {
    const {
      origin = "*",
      methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders = ["Content-Type", "Authorization", "X-Requested-With"],
      credentials = true,
    } = options;

    // Handle preflight requests
    if (context.req.method === "OPTIONS") {
      const response = new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT });
      
      // Set CORS headers
      if (typeof origin === "string") {
        response.headers.set("Access-Control-Allow-Origin", origin);
      } else if (Array.isArray(origin)) {
        const requestOrigin = context.req.headers.get("origin");
        if (requestOrigin && origin.includes(requestOrigin)) {
          response.headers.set("Access-Control-Allow-Origin", requestOrigin);
        }
      } else if (origin === true) {
        response.headers.set("Access-Control-Allow-Origin", "*");
      }

      response.headers.set("Access-Control-Allow-Methods", methods.join(", "));
      response.headers.set("Access-Control-Allow-Headers", allowedHeaders.join(", "));
      
      if (credentials) {
        response.headers.set("Access-Control-Allow-Credentials", "true");
      }

      return response;
    }

    const response = await handler(context);

    // Set CORS headers for actual requests
    if (typeof origin === "string") {
      response.headers.set("Access-Control-Allow-Origin", origin);
    } else if (Array.isArray(origin)) {
      const requestOrigin = context.req.headers.get("origin");
      if (requestOrigin && origin.includes(requestOrigin)) {
        response.headers.set("Access-Control-Allow-Origin", requestOrigin);
      }
    }

    if (credentials) {
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
  };
}

/**
 * Request logging middleware
 */
export async function withLogging(
  handler: (context: MiddlewareContext) => Promise<NextResponse>
): Promise<MiddlewareFunction> {
  return async (context: MiddlewareContext): Promise<NextResponse> => {
    const { req, startTime, userId, ip, userAgent } = context;
    
    // Log request
    logger.apiRequest(req.method, req.nextUrl.pathname, {
      userId,
      ip,
      userAgent,
      query: req.nextUrl.searchParams.toString(),
    });

    try {
      const response = await handler(context);
      const duration = Date.now() - startTime;

      // Log response
      logger.apiResponse(
        req.method,
        req.nextUrl.pathname,
        response.status,
        duration,
        {
          userId,
          ip,
          userAgent,
        }
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error("Request handler error", error as Error, {
        userId,
        ip,
        userAgent,
        path: req.nextUrl.pathname,
        method: req.method,
        duration,
      });

      throw error;
    }
  };
}

/**
 * Error handling middleware
 */
export async function withErrorHandling(
  handler: (context: MiddlewareContext) => Promise<NextResponse>
): Promise<MiddlewareFunction> {
  return async (context: MiddlewareContext): Promise<NextResponse> => {
    try {
      return await handler(context);
    } catch (error) {
      const err = error as Error;
      
      logger.error("Unhandled error in middleware", err, {
        path: context.req.nextUrl.pathname,
        method: context.req.method,
        userId: context.userId,
        ip: context.ip,
      });

      // Return appropriate error response based on error type
      if (err.name === "ValidationError") {
        return NextResponse.json(
          { error: "Invalid input", details: err.message },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }

      if (err.name === "UnauthorizedError") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: HTTP_STATUS.UNAUTHORIZED }
        );
      }

      if (err.name === "ForbiddenError") {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: HTTP_STATUS.FORBIDDEN }
        );
      }

      if (err.name === "NotFoundError") {
        return NextResponse.json(
          { error: "Not found" },
          { status: HTTP_STATUS.NOT_FOUND }
        );
      }

      // Generic server error
      return NextResponse.json(
        { error: "Internal server error" },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
  };
}

/**
 * Security headers middleware
 */
export async function withSecurityHeaders(
  handler: (context: MiddlewareContext) => Promise<NextResponse>
): Promise<MiddlewareFunction> {
  return async (context: MiddlewareContext): Promise<NextResponse> => {
    const response = await handler(context);

    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    // Add CSP header
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.stripe.com",
      "frame-src 'self' https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    response.headers.set("Content-Security-Policy", csp);

    return response;
  };
}

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(
  ...middlewares: Array<(handler: MiddlewareFunction) => MiddlewareFunction>
): (handler: MiddlewareFunction) => MiddlewareFunction {
  return (handler: MiddlewareFunction) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

/**
 * Helper to create an API handler with common middleware
 */
export async function createApiHandler(
  handler: (context: MiddlewareContext) => Promise<NextResponse>,
  options: {
    auth?: { required?: boolean };
    rateLimit?: { windowMs?: number; max?: number };
    cors?: boolean;
    logging?: boolean;
    errorHandling?: boolean;
    securityHeaders?: boolean;
  } = {}
): Promise<MiddlewareFunction> {
  const {
    auth,
    rateLimit,
    cors = false,
    logging = true,
    errorHandling = true,
    securityHeaders = true,
  } = options;

  let middlewareChain: MiddlewareFunction = handler;

  // Apply middleware in reverse order (last applied is executed first)
  if (securityHeaders) {
    middlewareChain = await withSecurityHeaders(middlewareChain);
  }

  if (errorHandling) {
    middlewareChain = await withErrorHandling(middlewareChain);
  }

  if (logging) {
    middlewareChain = await withLogging(middlewareChain);
  }

  if (cors) {
    middlewareChain = await withCors(middlewareChain);
  }

  if (rateLimit) {
    middlewareChain = await withRateLimit(middlewareChain, rateLimit);
  }

  if (auth) {
    middlewareChain = await withAuth(middlewareChain, auth);
  }

  return middlewareChain;
}

// Export custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}