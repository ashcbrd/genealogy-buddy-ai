/**
 * Database middleware for handling connection issues across API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { withDatabaseOperation, checkDatabaseHealth } from "./prisma";

// Global database health state
let lastHealthCheck = 0;
let lastHealthStatus: "healthy" | "unhealthy" = "healthy";
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

/**
 * Check database health with caching to avoid excessive checks
 */
async function getCachedHealthStatus() {
  const now = Date.now();
  
  if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
    const health = await checkDatabaseHealth();
    lastHealthStatus = health.status;
    lastHealthCheck = now;
    
    if (process.env.NODE_ENV === "development") {
      console.log(`🏥 Database health check: ${health.status} (${health.latency}ms)`);
    }
  }
  
  return lastHealthStatus;
}

/**
 * Middleware to handle database operations in API routes
 */
export function withDatabaseMiddleware(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // Check database health before processing request
      const healthStatus = await getCachedHealthStatus();
      
      if (healthStatus === "unhealthy") {
        console.warn("⚠️ Database unhealthy, but continuing with request...");
        // Don't block the request, just log the warning
      }

      // Execute the API handler
      const response = await handler(req, ...args);
      
      return response;
    } catch (error) {
      console.error("❌ Database middleware error:", error);
      
      // Check if it's a database-related error
      const err = error as { code?: string; message?: string };
      const isDatabaseError = 
        err.code?.startsWith('P') || 
        err.message?.toLowerCase().includes('database') ||
        err.message?.toLowerCase().includes('prisma') ||
        err.message?.toLowerCase().includes('connection');

      if (isDatabaseError) {
        return NextResponse.json(
          {
            error: "Database temporarily unavailable. Please try again in a moment.",
            code: "DATABASE_UNAVAILABLE",
            retry: true,
          },
          { status: 503 }
        );
      }

      // Re-throw non-database errors
      throw error;
    }
  };
}

/**
 * Wrapper for database operations with enhanced error handling
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallbackValue?: T,
  operationName = "database operation"
): Promise<T | null> {
  try {
    return await withDatabaseOperation(operation, operationName);
  } catch (error) {
    console.error(`❌ Safe database operation failed: ${operationName}`, error);
    
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    
    return null;
  }
}

/**
 * Database status endpoint helper
 */
export async function getDatabaseStatus() {
  const health = await checkDatabaseHealth();
  
  return {
    status: health.status,
    latency: health.latency,
    timestamp: new Date().toISOString(),
    circuitState: health.circuitState,
    ...(health.error && { error: health.error }),
  };
}

/**
 * Initialize database connection on server start
 */
export async function initializeDatabase() {
  try {
    console.log("🚀 Initializing database connection...");
    
    const health = await checkDatabaseHealth();
    
    if (health.status === "healthy") {
      console.log(`✅ Database initialization successful (${health.latency}ms)`);
    } else {
      console.warn(`⚠️ Database initialization completed with warnings: ${health.error}`);
    }
    
    return health;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    
    // In development, don't fail the server start
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ Development mode: server will continue without database");
      return { status: "unhealthy" as const, latency: 0, error: "Initialization failed" };
    }
    
    throw error;
  }
}