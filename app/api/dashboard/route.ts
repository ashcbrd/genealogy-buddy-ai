import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_LIMITS, type AnalysisType } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tier = user.subscription?.tier || "FREE";
    const limits = SUBSCRIPTION_LIMITS[tier];

    // Get current month usage
    const currentMonth = new Date(new Date().setDate(1));
    currentMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.usage.findMany({
      where: {
        userId,
        period: currentMonth,
      },
    });

    // Format usage stats
    const usageStats = usage.reduce((acc, curr) => {
      const toolKey = curr.type.toLowerCase().replace('_', '');
      acc[toolKey] = {
        used: curr.count,
        limit: limits[curr.type.toLowerCase() as keyof typeof limits] || 0,
        remaining: Math.max(0, (limits[curr.type.toLowerCase() as keyof typeof limits] as number || 0) - curr.count),
      };
      return acc;
    }, {} as Record<string, { used: number; limit: number | boolean; remaining: number }>);

    // Add missing tools with zero usage
    const toolTypes: AnalysisType[] = ['DOCUMENT', 'DNA', 'PHOTO', 'RESEARCH'];
    toolTypes.forEach(type => {
      const toolKey = type.toLowerCase().replace('_', '');
      if (!usageStats[toolKey]) {
        const limit = limits[type.toLowerCase() as keyof typeof limits] as number || 0;
        usageStats[toolKey] = {
          used: 0,
          limit,
          remaining: limit === -1 ? -1 : limit,
        };
      }
    });

    // Get recent documents count
    const documentCount = await prisma.document.count({
      where: { 
        userId,
        deletedAt: null,
      },
    });

    // Get translations count (disabled - TRANSLATION type removed)
    const translationCount = 0;

    // Get photos count
    const photoCount = await prisma.photo.count({
      where: { 
        userId,
        deletedAt: null,
      },
    });

    // Get analyses count
    const analysisCount = await prisma.analysis.count({
      where: { 
        userId,
        deletedAt: null,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        subscription: tier,
      },
      usage: usageStats,
      counts: {
        documents: documentCount,
        translations: translationCount,
        photos: photoCount,
        analyses: analysisCount,
      },
      subscription: {
        tier,
        limits,
        isActive: user.subscription?.currentPeriodEnd ? 
                 user.subscription.currentPeriodEnd > new Date() : 
                 tier === "FREE",
      },
    });

  } catch (error) {
    console.error("Dashboard data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}