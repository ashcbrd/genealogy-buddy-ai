import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_LIMITS } from "@/types";
import type { SubscriptionTier } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const currentMonth = new Date(new Date().setDate(1));

    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    const tier: SubscriptionTier = (subscription?.tier ??
      "FREE") as SubscriptionTier;
    const limits = SUBSCRIPTION_LIMITS[tier];

    // Usage for the current month
    const usage = await prisma.usage.findMany({
      where: {
        userId,
        period: currentMonth,
      },
    });

    type UsageRecord = (typeof usage)[number];

    // Lifetime analysis counts
    const analyses = await prisma.analysis.groupBy({
      by: ["type"],
      where: { userId },
      _count: { _all: true },
    });

    type AnalysisGroup = (typeof analyses)[number];

    const docsCount =
      analyses.find((a: AnalysisGroup) => a.type === "DOCUMENT")?._count._all ??
      0;
    const dnaCount =
      analyses.find((a: AnalysisGroup) => a.type === "DNA")?._count._all ?? 0;

    const stats = {
      documentsAnalyzed: docsCount,
      treesBuilt: await prisma.familyTree.count({ where: { userId } }),
      dnaAnalyses: dnaCount,
      photosEnhanced: await prisma.photo.count({ where: { userId } }),
    };

    const usageData = {
      documents: {
        used: usage.find((u: UsageRecord) => u.type === "DOCUMENT")?.count ?? 0,
        limit: limits.documents,
      },
      trees: {
        used:
          usage.find((u: UsageRecord) => u.type === "FAMILY_TREE")?.count ?? 0,
        limit: limits.trees,
      },
      dna: {
        used: usage.find((u: UsageRecord) => u.type === "DNA")?.count ?? 0,
        limit: limits.dna,
      },
      photos: {
        used: usage.find((u: UsageRecord) => u.type === "PHOTO")?.count ?? 0,
        limit: limits.photos,
      },
      research: {
        used: usage.find((u: UsageRecord) => u.type === "RESEARCH")?.count ?? 0,
        limit: limits.research,
      },
    };

    return NextResponse.json({
      stats,
      usage: usageData,
      subscription: {
        tier,
        limits,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
