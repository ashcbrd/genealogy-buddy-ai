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
import { checkRateLimit } from "./enhanced-access-control";

export interface UnifiedAccessResult {
  hasAccess: boolean;
  identity: IdentityResult;
  usage: UsageCheck;
  isFreeTier: boolean;
  errorCode?: string;
  upgradeMessage?: string;
}

/**
 * Unified access control that works for both anonymous and authenticated users
 * Replaces the old guest-specific and user-specific access controls
 */
export async function checkUnifiedAccess(
  request: NextRequest,
  analysisType: AnalysisType
): Promise<UnifiedAccessResult> {
  try {
    // 1. Get authenticated session if exists
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // 2. Get or create identity (anonymous or user)
    const identity = await getOrCreateIdentity(request, userId);

    // 3. Determine if this is free tier (anonymous OR authenticated free user)
    const isAnonymous = !userId;
    const isFreeTier = true; // TODO: Implement subscription tier logic when user schema is updated

    // 4. Check rate limiting to prevent abuse
    const rateLimitCheck = await checkRateLimit(identity.identityId);
    if (!rateLimitCheck.allowed) {
      return {
        hasAccess: false,
        identity,
        usage: {
          hasAccess: false,
          currentUsage: 0,
          limit: 0,
          remaining: 0,
          isAtLimit: true,
          errorMessage: `Rate limit exceeded. Please try again in ${rateLimitCheck.retryAfter} seconds.`
        },
        isFreeTier,
        errorCode: "RATE_LIMITED",
        upgradeMessage: isAnonymous 
          ? "Sign up for free to get the same limits with better stability."
          : "Upgrade your plan for higher limits and priority processing.",
      };
    }

    // 5. Check usage limits using server-side data
    const usage = await checkUsageLimits(
      identity.identityId,
      analysisType,
      isAnonymous
    );

    // 6. Generate appropriate response
    if (!usage.hasAccess) {
      return {
        hasAccess: false,
        identity,
        usage,
        isFreeTier,
        errorCode: isAnonymous ? "SIGNUP_REQUIRED" : "UPGRADE_REQUIRED",
        upgradeMessage: isAnonymous 
          ? "Sign up for free to continue using this feature with the same limits."
          : "Upgrade your subscription for higher monthly limits.",
      };
    }

    return {
      hasAccess: true,
      identity,
      usage,
      isFreeTier,
    };

  } catch (error) {
    console.error("Unified access control error:", error);
    throw error;
  }
}

/**
 * Record usage after successful operation
 */
export async function recordUnifiedUsage(
  identityId: string,
  analysisType: AnalysisType
): Promise<void> {
  await recordUsage(identityId, analysisType);
}

/**
 * Create standardized error response with anonymous identity cookie
 */
export function createUnifiedErrorResponse(result: UnifiedAccessResult) {
  const status = result.errorCode === "SIGNUP_REQUIRED" ? 401 :
                result.errorCode === "UPGRADE_REQUIRED" ? 402 : 429;

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  // Set anonymous identity cookie for anonymous users
  if (result.identity.isAnonymous && result.identity.type === 'ANONYMOUS') {
    // Get the anonKey from database - this would need to be passed or fetched
    // For now, we'll set it in the success response instead
  }

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
      isFreeTier: result.isFreeTier,
      upgradeMessage: result.upgradeMessage,
    }),
    {
      status,
      headers
    }
  );
}

/**
 * Create success response with usage info and anonymous cookie if needed
 */
export async function createUnifiedSuccessResponse(
  data: Record<string, unknown>, 
  result: UnifiedAccessResult
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  // Set anonymous identity cookie for anonymous users
  if (result.identity.isAnonymous) {
    // TODO: Implement cookie setting when identity schema is added
    // For now, skip cookie setting
  }

  return new Response(
    JSON.stringify({
      ...data,
      usage: {
        current: result.usage.currentUsage + 1, // After recording usage
        limit: result.usage.limit,
        remaining: result.usage.remaining - 1,
        isAtLimit: result.usage.currentUsage + 1 >= result.usage.limit
      },
      identity: {
        type: result.identity.type,
        isAnonymous: result.identity.isAnonymous,
      },
      isFreeTier: result.isFreeTier,
    }),
    {
      status: 200,
      headers
    }
  );
}

/**
 * Create anonymous identity cookie
 */
function createAnonCookie(anonKey: string): string {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  const secure = process.env.NODE_ENV === 'production';
  return `genealogy_anon_id=${anonKey}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly; ${secure ? 'Secure' : ''}`;
}

/**
 * Simple predicate for checking if user/session is free tier
 * Use this in UI components and client-side logic
 */
export function isFreeTier(user: { subscription?: { tier?: string } } | null): boolean {
  if (!user) return true; // Anonymous users are always free tier
  return !user.subscription || user.subscription.tier === 'FREE';
}