import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeDNA } from "@/lib/claude";
import { validateApiSecurity, validateFileUpload } from "@/lib/security";
import { AnalysisType } from "@prisma/client";
import { type DNAAnalysisResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    // Comprehensive security validation
    const securityValidation = await validateApiSecurity(req, {
      requireAuth: true,
      checkRateLimit: true,
      logRequest: true,
      validateUsage: { type: AnalysisType.DNA }
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
    
    // Handle FormData from file upload
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: "No DNA file provided" },
        { status: 400 }
      );
    }

    // Validate file upload
    const fileValidation = await validateFileUpload(file, context);
    if (!fileValidation.allowed) {
      return NextResponse.json(
        { error: fileValidation.reason },
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

    // Save analysis to database
    const analysis = await prisma.analysis.create({
      data: {
        userId,
        type: AnalysisType.DNA,
        input: analysisData,
        result: JSON.parse(JSON.stringify(result)) as any,
        confidence: 0.8,
        suggestions: (result as any).suggestions || [],
        claudeTokensUsed: 0,
      },
    });

    // Usage tracking is handled by validateApiSecurity

    // Add usage info to response headers
    const response = NextResponse.json({
      success: true,
      analysisId: analysis.id,
      analysis: result,
    });
    
    if (securityValidation.usageValidation) {
      response.headers.set('X-Usage-Current', securityValidation.usageValidation.currentUsage.toString());
      response.headers.set('X-Usage-Limit', securityValidation.usageValidation.limit.toString());
      response.headers.set('X-Usage-Remaining', securityValidation.usageValidation.remaining.toString());
    }
    
    return response;

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