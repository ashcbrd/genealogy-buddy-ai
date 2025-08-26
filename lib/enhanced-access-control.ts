import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getOrCreateIdentity, 
  checkUsageLimits, 
  recordUsage,
  type IdentityResult,
  type UsageCheck
} from "./identity-manager";
import { AnalysisType } from "@prisma/client";

export interface EnhancedAccessResult {
  hasAccess: boolean;
  identity: IdentityResult;
  usage: UsageCheck;
  errorCode?: string;
  upgradeMessage?: string;
}

/**
 * Enhanced access control that works for both anonymous and authenticated users
 * Uses server-side persistent usage tracking instead of client-side sessions
 */
export async function checkEnhancedAccess(
  request: NextRequest,
  analysisType: AnalysisType
): Promise<EnhancedAccessResult> {
  try {
    // 1. Get authenticated session if exists
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // 2. Get or create identity (anonymous or user)
    const identity = await getOrCreateIdentity(request, userId);

    // 3. Check usage limits using server-side data
    const usage = await checkUsageLimits(
      identity.identityId,
      analysisType,
      identity.isAnonymous
    );

    // 4. Generate appropriate response
    if (!usage.hasAccess) {
      return {
        hasAccess: false,
        identity,
        usage,
        errorCode: identity.isAnonymous ? "SIGNUP_REQUIRED" : "UPGRADE_REQUIRED",
        upgradeMessage: identity.isAnonymous 
          ? "Sign up for free to continue using this feature with the same limits."
          : "Upgrade your subscription for higher monthly limits.",
      };
    }

    return {
      hasAccess: true,
      identity,
      usage,
    };

  } catch (error) {
    console.error("Enhanced access control error:", error);
    throw error;
  }
}

/**
 * Record usage after successful operation
 */
export async function recordEnhancedUsage(
  identityId: string,
  analysisType: AnalysisType
): Promise<void> {
  await recordUsage(identityId, analysisType);
}

/**
 * Create standardized error response
 */
export function createEnhancedErrorResponse(result: EnhancedAccessResult) {
  const status = result.errorCode === "SIGNUP_REQUIRED" ? 401 :
                result.errorCode === "UPGRADE_REQUIRED" ? 402 : 429;

  return new Response(
    JSON.stringify({
      error: result.usage.errorMessage || "Access denied",
      errorCode: result.errorCode,
      usage: {
        current: result.usage.currentUsage,
        limit: result.usage.limit,
        remaining: result.usage.remaining,
        isAtLimit: result.usage.isAtLimit,
      },
      identity: {
        type: result.identity.type,
        isAnonymous: result.identity.isAnonymous,
      },
      upgradeMessage: result.upgradeMessage,
    }),
    {
      status,
      headers: { 
        "Content-Type": "application/json",
        // Set cookie for anonymous users
        ...(result.identity.isAnonymous && {
          "Set-Cookie": createAnonCookie(result.identity.identityId)
        })
      }
    }
  );
}

/**
 * Create anonymous identity cookie
 */
function createAnonCookie(anonKey: string): string {
  return `genealogy_anon_id=${anonKey}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}`;
}

/**
 * Rate limiting check (simplified - implement Redis in production)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  identityId: string,
  windowMs = 60 * 60 * 1000, // 1 hour
  maxRequests = 20
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const key = `rate_${identityId}`;
  
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true };
  }
  
  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((existing.resetTime - now) / 1000),
    };
  }
  
  existing.count++;
  return { allowed: true };
}