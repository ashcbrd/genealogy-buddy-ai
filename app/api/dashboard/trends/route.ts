import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const months = Math.min(parseInt(searchParams.get('months') || '6'), 12);

    // Calculate date range for trend analysis
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Get usage trends over time
    const usageTrends = await prisma.usage.findMany({
      where: {
        userId,
        period: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        period: 'asc',
      },
    });

    // Group by month and tool type
    const trendData = usageTrends.reduce((acc, usage) => {
      const monthKey = usage.period.toISOString().substring(0, 7); // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = {};
      }
      acc[monthKey][usage.type.toLowerCase()] = usage.count;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Fill in missing months with zeros
    const trends = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const monthKey = current.toISOString().substring(0, 7);
      const monthData = trendData[monthKey] || {};
      
      trends.push({
        month: monthKey,
        document: monthData.document || 0,
        dna: monthData.dna || 0,
        photo: monthData.photo || 0,
        familytree: monthData.family_tree || 0,
        research: monthData.research || 0,
        total: Object.values(monthData).reduce((sum, val) => sum + val, 0),
      });

      current.setMonth(current.getMonth() + 1);
    }

    // Calculate growth metrics
    const currentMonth = trends[trends.length - 1];
    const previousMonth = trends[trends.length - 2];
    
    const growth = currentMonth && previousMonth ? {
      total: currentMonth.total - previousMonth.total,
      percentage: previousMonth.total > 0 ? 
        ((currentMonth.total - previousMonth.total) / previousMonth.total * 100) : 0,
    } : { total: 0, percentage: 0 };

    // Get top tools by usage
    const totalUsage = trends.reduce((acc, month) => {
      acc.document += month.document;
      acc.dna += month.dna;
      acc.photo += month.photo;
      acc.familytree += month.familytree;
      acc.research += month.research;
      return acc;
    }, { document: 0, dna: 0, photo: 0, familytree: 0, research: 0 });

    const topTools = Object.entries(totalUsage)
      .map(([tool, usage]) => ({ tool, usage }))
      .sort((a, b) => b.usage - a.usage);

    return NextResponse.json({
      trends,
      growth,
      topTools,
      summary: {
        totalUsage: Object.values(totalUsage).reduce((sum, val) => sum + val, 0),
        averageMonthly: trends.length > 0 ? 
          Object.values(totalUsage).reduce((sum, val) => sum + val, 0) / trends.length : 0,
        mostActiveMonth: trends.reduce((max, month) => 
          month.total > max.total ? month : max, trends[0]),
      },
    });

  } catch (error) {
    console.error("Dashboard trends error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trends data" },
      { status: 500 }
    );
  }
}