import { NextRequest, NextResponse } from "next/server";
import { validateApiSecurity, logSecurityEvent } from "@/lib/security";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_LIMITS } from "@/types";

export async function GET(req: NextRequest) {
  try {
    // Security validation with logging
    const securityValidation = await validateApiSecurity(req, {
      requireAuth: true,
      checkRateLimit: true,
      logRequest: true
    });

    if (!securityValidation.allowed) {
      return NextResponse.json(
        { 
          error: securityValidation.error?.message || "Access denied",
          code: securityValidation.error?.code
        },
        { status: securityValidation.error?.status || 403 }
      );
    }

    const { session, context } = securityValidation;
    const userId = session!.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    if (!subscription) {
      // Log subscription creation for security monitoring
      await logSecurityEvent(context, 'SUBSCRIPTION_AUTO_CREATED', {
        resource: 'SUBSCRIPTION',
        allowed: true,
        reason: 'Auto-creating FREE subscription for new user',
        metadata: { tier: 'FREE', userId }
      });
      
      // Create free subscription if doesn't exist
      const newSubscription = await prisma.subscription.create({
        data: {
          userId,
          tier: "FREE",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
      });
      
      return NextResponse.json({
        ...newSubscription,
        limits: SUBSCRIPTION_LIMITS.FREE,
        isActive: true,
      });
    }

    // Get usage for current month
    const currentMonth = new Date(new Date().setDate(1));
    currentMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.usage.findMany({
      where: {
        userId,
        period: currentMonth,
      },
    });
    
    // Log subscription access for monitoring
    await logSecurityEvent(context, 'SUBSCRIPTION_ACCESSED', {
      resource: 'SUBSCRIPTION',
      allowed: true,
      metadata: { 
        tier: subscription.tier, 
        isActive: subscription.tier === "FREE" || (subscription.currentPeriodEnd && subscription.currentPeriodEnd > new Date()),
        usageCount: usage.length
      }
    });

    // Format usage data
    const usageStats = usage.reduce((acc, curr) => {
      acc[curr.type.toLowerCase()] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    const isActive = subscription.tier === "FREE" || 
                    (subscription.currentPeriodEnd && 
                     subscription.currentPeriodEnd > new Date());

    return NextResponse.json({
      ...subscription,
      limits: SUBSCRIPTION_LIMITS[subscription.tier],
      usage: usageStats,
      isActive,
    });

  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}