import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { SUBSCRIPTION_LIMITS } from "@/types";
import type { SubscriptionTier } from "@prisma/client";

export type ToolKey = "documents" | "dna" | "trees" | "research" | "photos";

export interface AccessControlResult {
  hasAccess: boolean;
  error?: string;
  errorCode?: string;
  currentUsage?: number;
  limit?: number;
  tier?: SubscriptionTier;
}

/**
 * Check if user has access to a specific tool based on their subscription
 * and current usage. This should be called at the start of each tool API endpoint.
 */
export async function checkToolAccess(
  request: NextRequest,
  toolKey: ToolKey
): Promise<AccessControlResult> {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.user) {
      return {
        hasAccess: false,
        error: "Authentication required",
        errorCode: "UNAUTHORIZED"
      };
    }

    // In a real implementation, you would fetch the user's subscription from the database
    // For now, we'll simulate this by checking if there's subscription data in session
    // or making a database call
    
    // Simulate fetching user subscription and usage data
    const userSubscription = await getUserSubscriptionData(session.user.email!);
    
    const tier = userSubscription?.tier || "FREE";
    const limits = SUBSCRIPTION_LIMITS[tier];
    const toolLimit = limits[toolKey];
    
    // Check if tool is available for this tier
    if (typeof toolLimit === "number" && toolLimit === 0) {
      return {
        hasAccess: false,
        error: `${getToolDisplayName(toolKey)} is not available in your ${tier} plan. Please upgrade to access this feature.`,
        errorCode: "UPGRADE_REQUIRED",
        tier
      };
    }
    
    // Check if tool has unlimited access
    if (typeof toolLimit === "number" && toolLimit === -1) {
      return {
        hasAccess: true,
        tier,
        limit: -1
      };
    }
    
    // Check usage limits
    const currentUsage = await getCurrentUsage(session.user.email!, toolKey);
    const limit = typeof toolLimit === "number" ? toolLimit : 0;
    
    if (currentUsage >= limit) {
      return {
        hasAccess: false,
        error: `You have reached your monthly limit of ${limit} ${getToolDisplayName(toolKey).toLowerCase()} analyses. Please upgrade your plan or wait until next month.`,
        errorCode: "LIMIT_EXCEEDED",
        currentUsage,
        limit,
        tier
      };
    }
    
    return {
      hasAccess: true,
      currentUsage,
      limit,
      tier
    };
    
  } catch (error) {
    console.error("Error checking tool access:", error);
    return {
      hasAccess: false,
      error: "Unable to verify access. Please try again.",
      errorCode: "SERVER_ERROR"
    };
  }
}

/**
 * Record usage of a tool after successful operation
 */
export async function recordToolUsage(
  userEmail: string,
  toolKey: ToolKey
): Promise<void> {
  try {
    // In a real implementation, this would increment usage in the database
    // For now, we'll just log it
    console.log(`Recording usage for ${userEmail}: ${toolKey}`);
    
    // TODO: Implement actual database recording
    // await prisma.analysis.create({
    //   data: {
    //     user: { connect: { email: userEmail } },
    //     type: toolKey.toUpperCase(),
    //     // ... other fields
    //   }
    // });
  } catch (error) {
    console.error("Error recording tool usage:", error);
    // Don't throw here - usage recording failure shouldn't break the main operation
  }
}

/**
 * Get user subscription data (simulated for now)
 */
async function getUserSubscriptionData(email: string): Promise<{ tier: SubscriptionTier } | null> {
  // TODO: Replace with actual database query
  // const subscription = await prisma.subscription.findFirst({
  //   where: { user: { email } },
  //   orderBy: { createdAt: 'desc' }
  // });
  
  // For now, return a simulated FREE tier
  return { tier: "FREE" };
}

/**
 * Get current usage for a tool this month (simulated for now)
 */
async function getCurrentUsage(email: string, toolKey: ToolKey): Promise<number> {
  // TODO: Replace with actual database query
  // const startOfMonth = new Date();
  // startOfMonth.setDate(1);
  // startOfMonth.setHours(0, 0, 0, 0);
  
  // const usage = await prisma.analysis.count({
  //   where: {
  //     user: { email },
  //     type: toolKey.toUpperCase(),
  //     createdAt: { gte: startOfMonth }
  //   }
  // });
  
  // For now, return simulated usage
  return 0;
}

/**
 * Get display name for tool
 */
function getToolDisplayName(toolKey: ToolKey): string {
  const names = {
    documents: "Document Analysis",
    dna: "DNA Analysis", 
    trees: "Tree Building",
    research: "Research Chat",
    photos: "Photo Analysis"
  };
  return names[toolKey];
}

/**
 * Create a standardized error response for API endpoints
 */
export function createAccessErrorResponse(result: AccessControlResult) {
  const status = result.errorCode === "UNAUTHORIZED" ? 401 : 
                result.errorCode === "UPGRADE_REQUIRED" ? 402 :
                result.errorCode === "LIMIT_EXCEEDED" ? 429 : 500;
                
  return new Response(
    JSON.stringify({
      error: result.error,
      errorCode: result.errorCode,
      currentUsage: result.currentUsage,
      limit: result.limit,
      tier: result.tier
    }),
    {
      status,
      headers: { "Content-Type": "application/json" }
    }
  );
}