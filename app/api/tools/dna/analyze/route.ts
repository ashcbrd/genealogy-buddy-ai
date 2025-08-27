import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeDNA } from "@/lib/claude";
import { checkUsageLimit, incrementUsage } from "@/lib/utils";
import { checkUnifiedAccess, recordUnifiedUsage, createUnifiedErrorResponse, createUnifiedSuccessResponse } from "@/lib/unified-access-control";
import { AnalysisType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Check unified access control (works for both anonymous and authenticated users)
    const accessResult = await checkUnifiedAccess(req, AnalysisType.DNA);
    if (!accessResult.hasAccess) {
      return createUnifiedErrorResponse(accessResult);
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Handle FormData from file upload
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: "No DNA file provided" },
        { status: 400 }
      );
    }

    // Read and parse the DNA file content
    const fileContent = await file.text();
    
    // For now, pass the raw file content as DNA data
    // TODO: Add proper DNA file parsing based on file type
    const dnaData = fileContent;
    const ethnicity = null;
    const regions = null;
    const matchData = null;

    if (!dnaData && !ethnicity && !regions) {
      return NextResponse.json(
        { error: "DNA data, ethnicity, or regions data is required" },
        { status: 400 }
      );
    }

    // Prepare DNA data for analysis
    const analysisData = {
      ethnicity: ethnicity || null,
      regions: regions || null,
      matches: matchData || null,
      rawData: dnaData || null,
    };

    // Analyze with Claude
    const result = await analyzeDNA(analysisData, userId);

    // Save analysis to database (only for authenticated users)
    let analysisId = null;
    if (userId) {
      const analysis = await prisma.analysis.create({
        data: {
          userId,
          type: "DNA",
          input: analysisData,
          result: result as any,
          confidence: (result as any).confidence || 0.8,
          suggestions: (result as any).suggestions || [],
          claudeTokensUsed: 0, // Will be updated by Claude usage tracking
        },
      });
      analysisId = analysis.id;
      
      // Legacy usage tracking for authenticated users
      await incrementUsage(userId, "DNA");
    }

    // Record unified usage (works for both anonymous and authenticated)
    await recordUnifiedUsage(accessResult.identity.identityId, AnalysisType.DNA);

    // Return unified response with usage info
    return await createUnifiedSuccessResponse({
      success: true,
      analysisId,
      analysis: result,
    }, accessResult);

  } catch (error) {
    console.error("DNA analysis error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Usage limit")) {
        return NextResponse.json(
          { error: "Usage limit exceeded" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to analyze DNA data" },
      { status: 500 }
    );
  }
}