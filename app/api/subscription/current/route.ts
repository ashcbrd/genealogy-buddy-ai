import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_LIMITS } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
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
      // Create free subscription if doesn't exist
      const newSubscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
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
        userId: session.user.id,
        period: currentMonth,
      },
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