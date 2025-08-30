import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_LIMITS } from "@/types";
import { AnalysisType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    const tier = subscription?.tier || "FREE";
    const limits = SUBSCRIPTION_LIMITS[tier];

    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get usage counts for each analysis type
    const usageCounts = await Promise.all([
      // Document analysis
      prisma.analysis.count({
        where: {
          userId,
          type: AnalysisType.DOCUMENT,
          createdAt: { gte: startOfMonth },
          deletedAt: null,
        },
      }),
      // DNA analysis
      prisma.analysis.count({
        where: {
          userId,
          type: AnalysisType.DNA,
          createdAt: { gte: startOfMonth },
          deletedAt: null,
        },
      }),
      // Photo analysis
      prisma.analysis.count({
        where: {
          userId,
          type: AnalysisType.PHOTO,
          createdAt: { gte: startOfMonth },
          deletedAt: null,
        },
      }),
      // Research chat count
      prisma.researchChat.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    const [documentsUsed, dnaUsed, photosUsed, researchUsed] = usageCounts;

    const usage = {
      documents: {
        used: documentsUsed,
        limit: limits.documents,
        unlimited: limits.documents === -1,
      },
      dna: {
        used: dnaUsed,
        limit: limits.dna,
        unlimited: limits.dna === -1,
      },
      photos: {
        used: photosUsed,
        limit: limits.photos,
        unlimited: limits.photos === -1,
      },
      research: {
        used: researchUsed,
        limit: limits.research,
        unlimited: limits.research === -1,
      },
    };

    // Calculate overall usage percentage
    const totalUsagePercentage = Object.values(usage).reduce((total, toolUsage) => {
      if (toolUsage.unlimited) return total;
      return total + (toolUsage.used / (toolUsage.limit || 1)) * 100;
    }, 0) / Object.values(usage).filter(u => !u.unlimited).length;

    return NextResponse.json({
      tier,
      limits,
      usage,
      totalUsagePercentage: Math.round(totalUsagePercentage || 0),
      periodStart: startOfMonth.toISOString(),
      periodEnd: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0).toISOString(),
    });

  } catch (error) {
    console.error("Usage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}