import { PrismaClient, type Prisma } from "@prisma/client";

/**
 * PrismaClient singleton for database connections
 * Prevents multiple instances in development with hot reloading
 */

// Extend the global object type to include prisma
declare global {
   
  var prisma: PrismaClient | undefined;
}

// Configuration options for Prisma Client
const getDatabaseUrl = () => {
  // Force reload environment variables to ensure we have the latest
  if (typeof window === "undefined") {
    try {
      const dotenv = require('dotenv');
      const path = require('path');
      dotenv.config({ path: path.join(process.cwd(), '.env') });
    } catch (error) {
      // dotenv might not be available in production, that's okay
    }
  }
  
  // In development, prefer DIRECT_URL to bypass pooler issues
  if (process.env.NODE_ENV === "development") {
    const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (url && process.env.NODE_ENV === "development") {
      console.log(`🔗 Using database URL: ${url.replace(/:[^:]*@/, ':***@')}`);
    }
    return url;
  }
  
  // In production, use DATABASE_URL (which should be the pooler URL)  
  return process.env.DATABASE_URL;
};

const prismaClientOptions: Prisma.PrismaClientOptions = {
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  errorFormat: process.env.NODE_ENV === "development" ? "pretty" : "minimal",
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  // Add connection pool and timeout settings for better reliability
  ...(process.env.NODE_ENV === "development" && {
    // Development-specific settings for better debugging
    log: ["query", "error", "warn", "info"],
  }),
};

// Create a single instance of PrismaClient with proper connection management
let prismaInstance: PrismaClient | null = null;

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient(prismaClientOptions);
  
  // Add connection event handlers for better debugging
  if (process.env.NODE_ENV === "development") {
    console.log(`🔗 Creating new Prisma client with URL: ${getDatabaseUrl()?.replace(/:[^:]*@/, ':***@')}`);
  }

  return client;
}

export const prisma = (() => {
  if (process.env.NODE_ENV === "production") {
    // In production, create a fresh instance each time
    return createPrismaClient();
  }

  // In development, use global singleton to prevent hot reload issues
  if (!globalThis.prisma) {
    globalThis.prisma = createPrismaClient();
  }
  
  return globalThis.prisma;
})();

/**
 * Enhanced database connection function with health checks and retries
 */
export async function connectDB(): Promise<void> {
  try {
    console.log("🔍 Attempting to connect to database...");
    
    // First try to connect
    await withRetry(async () => {
      await prisma.$connect();
      return true;
    }, 3, 2000);
    
    // Then perform a health check
    const health = await checkDatabaseHealth();
    
    if (health.status === "healthy") {
      console.log(`✅ Database connected successfully (latency: ${health.latency}ms)`);
    } else {
      throw new Error(`Database health check failed: ${health.error}`);
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    
    // In development, don't exit process to allow for debugging
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ Development mode: continuing without database connection");
      return;
    }
    
    process.exit(1);
  }
}

/**
 * Helper function to disconnect from database
 */
export async function disconnectDB() {
  await prisma.$disconnect();
  console.log("Database disconnected");
}

/**
 * Transaction helper for complex operations
 */
export async function withTransaction<T>(
  fn: (
    tx: Omit<
      PrismaClient,
      "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >
  ) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await fn(tx);
  });
}

/**
 * Helper for pagination
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: "asc" | "desc";
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    orderBy: params.orderBy
      ? { [params.orderBy]: params.order || "desc" }
      : undefined,
  };
}

/**
 * Helper to get pagination metadata
 */
export async function getPaginationMeta(
  model: { count: (args: { where: unknown }) => Promise<number> },
  where: unknown,
  page: number,
  limit: number
) {
  const total = await model.count({ where });
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
  };
}

/**
 * Enhanced retry helper for database operations with connection error handling
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error = new Error("Unknown error");

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      lastError = err as Error;

      // Don't retry on certain errors
      if (
        err.code === "P2002" || // Unique constraint violation
        err.code === "P2025" || // Record not found
        err.code === "P2003" || // Foreign key constraint
        err.code === "P2004" // Constraint failed
      ) {
        throw error;
      }

      // Retry on connection errors (P1001)
      const isConnectionError = 
        err.code === "P1001" || 
        err.message?.includes("Can't reach database server") ||
        err.message?.includes("connection") ||
        err.message?.includes("timeout");

      if (!isConnectionError && i === 0) {
        // If it's not a connection error, don't retry
        throw error;
      }

      // Wait before retrying with exponential backoff
      if (i < maxRetries - 1) {
        const retryDelay = delay * Math.pow(2, i);
        console.log(`Database connection failed, retrying in ${retryDelay}ms... (attempt ${i + 2}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError;
}

// Circuit breaker state for database health
let circuitBreakerState: "closed" | "open" | "half-open" = "closed";
let lastFailureTime = 0;
let failureCount = 0;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

/**
 * Enhanced database health check with circuit breaker pattern
 */
export async function checkDatabaseHealth(): Promise<{
  status: "healthy" | "unhealthy";
  latency: number;
  error?: string;
  circuitState?: string;
}> {
  const startTime = Date.now();

  // Check circuit breaker state
  if (circuitBreakerState === "open") {
    const timeSinceFailure = Date.now() - lastFailureTime;
    if (timeSinceFailure < CIRCUIT_BREAKER_TIMEOUT) {
      return {
        status: "unhealthy",
        latency: 0,
        error: "Circuit breaker is open",
        circuitState: circuitBreakerState,
      };
    } else {
      circuitBreakerState = "half-open";
    }
  }

  try {
    // Use withRetry for the health check
    await withRetry(async () => {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    }, 2, 1000);

    const latency = Date.now() - startTime;

    // Reset circuit breaker on success
    if (circuitBreakerState === "half-open") {
      circuitBreakerState = "closed";
      failureCount = 0;
    }

    return {
      status: "healthy",
      latency,
      circuitState: circuitBreakerState,
    };
  } catch (error: unknown) {
    const err = error as { message: string };
    const latency = Date.now() - startTime;

    // Update circuit breaker state
    failureCount++;
    lastFailureTime = Date.now();

    if (failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitBreakerState = "open";
    }

    return {
      status: "unhealthy",
      latency,
      error: err.message,
      circuitState: circuitBreakerState,
    };
  }
}

/**
 * Database operation wrapper with automatic retry and error handling
 */
export async function withDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName = "database operation"
): Promise<T> {
  try {
    return await withRetry(operation, 3, 1500);
  } catch (error) {
    const err = error as { code?: string; message?: string };
    console.error(`❌ ${operationName} failed:`, {
      code: err.code,
      message: err.message,
    });
    
    // Re-throw with enhanced error context
    if (PrismaErrors.isConnectionError(error)) {
      throw new Error(`Database connection failed during ${operationName}. Please check your connection and try again.`);
    }
    
    throw error;
  }
}

/**
 * Database statistics helper with enhanced error handling
 */
export async function getDatabaseStats() {
  return await withDatabaseOperation(async () => {
    const [
      userCount,
      documentCount,
      analysisCount,
      photoCount,
      subscriptionCount,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.document.count().catch(() => 0),
      prisma.analysis.count().catch(() => 0),
      prisma.photo.count().catch(() => 0),
      prisma.subscription.count({ where: { tier: { not: "FREE" } } }).catch(() => 0),
    ]);

    return {
      users: userCount,
      documents: documentCount,
      analyses: analysisCount,
      photos: photoCount,
      paidSubscriptions: subscriptionCount,
    };
  }, "database statistics retrieval");
}

/**
 * Batch operations helper
 */
export async function batchCreate<T>(
  model: { createMany: (args: { data: T[] }) => Promise<unknown> },
  data: T[],
  batchSize = 100
): Promise<void> {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await model.createMany({ data: batch });
  }
}

/**
 * Search helper with full-text search
 */
export async function searchRecords(
  model: { findMany: (args: { where?: unknown }) => Promise<unknown[]> },
  searchFields: string[],
  query: string,
  additionalWhere?: unknown
) {
  if (!query || query.trim() === "") {
    return await model.findMany({ where: additionalWhere });
  }

  const searchConditions = searchFields.map((field) => ({
    [field]: {
      contains: query,
      mode: "insensitive",
    },
  }));

  return await model.findMany({
    where: {
      AND: [additionalWhere || {}, { OR: searchConditions }],
    },
  });
}

/**
 * Upsert helper with better error handling
 */
export async function safeUpsert<T>(
  model: {
    upsert: (args: {
      where: unknown;
      create: T;
      update: Partial<T>;
    }) => Promise<T>;
    update: (args: { where: unknown; data: Partial<T> }) => Promise<T>;
  },
  where: unknown,
  create: T,
  update: Partial<T>
): Promise<T> {
  try {
    return await model.upsert({
      where,
      create,
      update,
    });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === "P2002") {
      // Unique constraint violation - try to update instead
      return await model.update({
        where,
        data: update,
      });
    }
    throw error;
  }
}

/**
 * Soft delete helpers (manual implementation since middleware is deprecated)
 */
type PrismaModel = {
  update: (args: { where: unknown; data: unknown }) => Promise<unknown>;
  updateMany: (args: {
    where: unknown;
    data: unknown;
  }) => Promise<{ count: number }>;
  findMany: (args?: {
    where?: unknown;
    [key: string]: unknown;
  }) => Promise<unknown[]>;
  findUnique: (args: {
    where: unknown;
    [key: string]: unknown;
  }) => Promise<unknown | null>;
  findFirst: (args?: {
    where?: unknown;
    [key: string]: unknown;
  }) => Promise<unknown | null>;
  count: (args?: { where?: unknown }) => Promise<number>;
};

export const softDelete = {
  // Soft delete a single record
  async deleteOne(model: PrismaModel, where: unknown) {
    return await model.update({
      where,
      data: { deletedAt: new Date() },
    });
  },

  // Soft delete multiple records
  async deleteMany(model: PrismaModel, where: unknown) {
    return await model.updateMany({
      where,
      data: { deletedAt: new Date() },
    });
  },

  // Find records excluding soft deleted
  async findMany(
    model: PrismaModel,
    args?: { where?: Record<string, unknown>; [key: string]: unknown }
  ) {
    const where = args?.where || {};
    return await model.findMany({
      ...args,
      where: {
        ...where,
        deletedAt: null,
      },
    });
  },

  // Find single record excluding soft deleted
  async findUnique(
    model: PrismaModel,
    args: { where: unknown; [key: string]: unknown }
  ) {
    const record = (await model.findUnique(args)) as {
      deletedAt?: Date | null;
    } | null;
    if (record?.deletedAt) return null;
    return record;
  },

  // Find first record excluding soft deleted
  async findFirst(
    model: PrismaModel,
    args?: { where?: Record<string, unknown>; [key: string]: unknown }
  ) {
    const where = args?.where || {};
    return await model.findFirst({
      ...args,
      where: {
        ...where,
        deletedAt: null,
      },
    });
  },

  // Count records excluding soft deleted
  async count(model: PrismaModel, where?: Record<string, unknown>) {
    return await model.count({
      where: {
        ...(where || {}),
        deletedAt: null,
      },
    });
  },

  // Restore a soft deleted record
  async restore(model: PrismaModel, where: unknown) {
    return await model.update({
      where,
      data: { deletedAt: null },
    });
  },
};

/**
 * Cleanup old records helper
 */
export async function cleanupOldRecords(
  model: {
    deleteMany: (args: { where: unknown }) => Promise<{ count: number }>;
  },
  dateField: string,
  daysToKeep: number
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await model.deleteMany({
    where: {
      [dateField]: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Helper to get user with subscription
 */
export async function getUserWithSubscription(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
    },
  });
}

/**
 * Helper to get user's current usage
 */
export async function getUserUsage(userId: string, type?: string) {
  const currentMonth = new Date(new Date().setDate(1));
  currentMonth.setHours(0, 0, 0, 0);

  const where: Record<string, unknown> = {
    userId,
    period: currentMonth,
  };

  if (type) {
    where.type = type;
  }

  return await prisma.usage.findMany({ where });
}

/**
 * Export database helpers for use in seed scripts
 */
export const db = {
  prisma,
  connect: connectDB,
  disconnect: disconnectDB,
  withTransaction,
  withRetry,
  withDatabaseOperation,
  checkHealth: checkDatabaseHealth,
  getStats: getDatabaseStats,
  batchCreate,
  searchRecords,
  safeUpsert,
  cleanupOldRecords,
  getPaginationParams,
  getPaginationMeta,
  softDelete,
  getUserWithSubscription,
  getUserUsage,
};

// Handle cleanup on app termination - but don't be too aggressive
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    try {
      await prisma.$disconnect();
      console.log("Database disconnected on app termination");
    } catch (error) {
      console.error("Error during database disconnect:", error);
    }
  });
}

// Export types for use in other files
export type { PrismaClient } from "@prisma/client";
export { Prisma } from "@prisma/client";

// Export error handling utilities
type PrismaError = {
  code?: string;
  message?: string;
  meta?: {
    target?: string[];
  };
};

export const PrismaErrors = {
  isUniqueConstraintError: (error: unknown): error is PrismaError => {
    const err = error as PrismaError;
    return err?.code === "P2002";
  },
  isNotFoundError: (error: unknown): error is PrismaError => {
    const err = error as PrismaError;
    return err?.code === "P2025";
  },
  isForeignKeyError: (error: unknown): error is PrismaError => {
    const err = error as PrismaError;
    return err?.code === "P2003";
  },
  isConnectionError: (error: unknown): error is PrismaError => {
    const err = error as PrismaError;
    return (
      err?.code === "P1001" || err?.code === "P1002" || err?.code === "P1017"
    );
  },

  getErrorMessage: (error: unknown): string => {
    if (PrismaErrors.isUniqueConstraintError(error)) {
      const field = error.meta?.target?.[0];
      return field
        ? `A record with this ${field} already exists`
        : "A record with these values already exists";
    }

    if (PrismaErrors.isNotFoundError(error)) {
      return "The requested record was not found";
    }

    if (PrismaErrors.isForeignKeyError(error)) {
      return "This operation would violate a relationship constraint";
    }

    if (PrismaErrors.isConnectionError(error)) {
      return "Unable to connect to the database. Please try again later.";
    }

    const err = error as { message?: string };
    return err.message || "An unexpected database error occurred";
  },
};

export default prisma;
