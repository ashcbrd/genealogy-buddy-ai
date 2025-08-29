import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnalysisType, SubscriptionTier } from "@prisma/client";
import { SUBSCRIPTION_LIMITS } from "@/types";
import type { AnalyzeRecordRequest, TranslationResult } from "@/types";
import { translateAndAnalyzeRecord } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to use this feature." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Check usage limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    
    const tier = subscription?.tier || SubscriptionTier.FREE;
    const limits = SUBSCRIPTION_LIMITS[tier];
    
    if (limits.translations === 0) {
      return NextResponse.json(
        { error: "Ancient Records Translation is not available in your plan. Please upgrade to access this feature." },
        { status: 402 }
      );
    }
    
    // Check current usage if not unlimited
    if (limits.translations !== -1) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const currentUsage = await prisma.analysis.count({
        where: {
          userId,
          type: AnalysisType.TRANSLATION,
          createdAt: { gte: startOfMonth },
          deletedAt: null,
        },
      });
      
      if (currentUsage >= limits.translations) {
        return NextResponse.json(
          { error: `You have reached your monthly limit of ${limits.translations} translations. Please upgrade your plan or wait until next month.` },
          { status: 429 }
        );
      }
    }

    const requestData = (await req.json()) as AnalyzeRecordRequest;
    const { imageData, textInput, targetLanguage, sourceLanguage, extractFacts, contextualHelp } = requestData;

    console.log(`[Ancient Records Translation] User: ${userId}, Target Language: ${targetLanguage}, Extract Facts: ${extractFacts}`);

    // Validate input
    if (!imageData && !textInput) {
      return NextResponse.json(
        { error: "Either image data or text input is required." },
        { status: 400 }
      );
    }

    if (!targetLanguage) {
      return NextResponse.json(
        { error: "Target language is required." },
        { status: 400 }
      );
    }

    // Call Claude translation service
    const translationResult: TranslationResult = await translateAndAnalyzeRecord(
      {
        imageData,
        textInput,
        targetLanguage,
        sourceLanguage,
        extractFacts,
        contextualHelp,
      },
      userId
    );

    console.log(`[Ancient Records Translation] Translation completed with confidence: ${translationResult.confidence}`);

    // Record analysis in the database
    const analysisData = {
      imageData: imageData ? "[Image provided]" : undefined,
      textInput,
      targetLanguage,
      sourceLanguage,
      extractFacts,
      contextualHelp,
    };

    const analysis = await prisma.analysis.create({
      data: {
        userId,
        type: AnalysisType.TRANSLATION,
        input: JSON.parse(JSON.stringify(analysisData)) as any,
        result: JSON.parse(JSON.stringify(translationResult)) as any,
        confidence: translationResult.confidence,
        suggestions: translationResult.suggestions || [],
        claudeTokensUsed: 0,
      },
    });

    // Record usage for real-time tracking
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    await prisma.usage.upsert({
      where: {
        userId_type_period: {
          userId,
          type: AnalysisType.TRANSLATION,
          period: startOfMonth,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        userId,
        type: AnalysisType.TRANSLATION,
        count: 1,
        period: startOfMonth,
      },
    });

    return NextResponse.json({
      translation: translationResult,
      analysisId: analysis.id,
    });
  } catch (error) {
    console.error("Ancient Records Translation error:", error);
    
    // Provide more detailed error messages
    let errorMessage = "Failed to translate and analyze record";
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = "Claude AI service rate limit exceeded. Please try again in a moment.";
        statusCode = 429;
      } else if (error.message.includes('authentication') || error.message.includes('401')) {
        errorMessage = "AI service authentication error. Please try again.";
        statusCode = 503;
      } else if (error.message.includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
        statusCode = 504;
      } else if (error.message.includes('Image too large')) {
        errorMessage = error.message;
        statusCode = 400;
      } else {
        errorMessage = `Translation failed: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}