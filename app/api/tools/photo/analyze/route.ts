import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzePhoto } from "@/lib/claude";
import { AnalysisType, SubscriptionTier } from "@prisma/client";
import { SUBSCRIPTION_LIMITS, type PhotoAnalysisResult } from "@/types";

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
    
    if (limits.photos === 0) {
      return NextResponse.json(
        { error: "Photo analysis is not available in your plan. Please upgrade to access this feature." },
        { status: 402 }
      );
    }
    
    // Check current usage if not unlimited
    if (limits.photos !== -1) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const currentUsage = await prisma.analysis.count({
        where: {
          userId,
          type: AnalysisType.PHOTO,
          createdAt: { gte: startOfMonth },
          deletedAt: null,
        },
      });
      
      if (currentUsage >= limits.photos) {
        return NextResponse.json(
          { error: `You have reached your monthly limit of ${limits.photos} photo analyses. Please upgrade your plan or wait until next month.` },
          { status: 429 }
        );
      }
    }
    const { photoId, photoDescription, imageData, mimeType, fileName, additionalContext } = await req.json();

    if (!photoId && !photoDescription && !imageData) {
      return NextResponse.json(
        { error: "Photo ID, description, or image data is required" },
        { status: 400 }
      );
    }

    let photo = null;
    let imageAnalysisData = null;

    // Handle direct image upload (new flow)
    if (imageData) {
      imageAnalysisData = {
        imageData,
        mimeType: mimeType || 'image/jpeg',
        fileName: fileName || 'uploaded_photo.jpg',
        additionalContext
      };
    }
    // Handle saved photo from database (existing flow)
    else if (photoId) {
      photo = await prisma.photo.findFirst({
        where: {
          id: photoId,
          userId,
          deletedAt: null,
        },
      });

      if (!photo) {
        return NextResponse.json(
          { error: "Photo not found" },
          { status: 404 }
        );
      }

      // For saved photos, we'll use text description (legacy support)
      const analysisDescription = photo.metadata ? 
        `Photo: ${photo.filename}. ${JSON.stringify(photo.metadata)}` :
        `Photo: ${photo.filename}`;
      
      imageAnalysisData = {
        textDescription: additionalContext ? 
          `${analysisDescription}\n\nAdditional context: ${additionalContext}` : 
          analysisDescription
      };
    }
    // Handle text-only description (legacy support)  
    else if (photoDescription) {
      const analysisDescription = additionalContext ? 
        `${photoDescription}\n\nAdditional context: ${additionalContext}` : 
        photoDescription;
      
      imageAnalysisData = {
        textDescription: analysisDescription
      };
    }

    // Ensure we have analysis data
    if (!imageAnalysisData) {
      return NextResponse.json(
        { error: "Unable to process photo analysis request" },
        { status: 400 }
      );
    }

    // Analyze with Claude (now supports both image and text)
    const result = await analyzePhoto(imageAnalysisData, userId);

    // Save analysis to database
    const analysis = await prisma.analysis.create({
      data: {
        userId,
        type: AnalysisType.PHOTO,
        input: {
          photoId,
          description: imageAnalysisData.textDescription || imageAnalysisData.fileName || 'Image analysis',
          additionalContext: imageAnalysisData.additionalContext,
        },
        result: JSON.parse(JSON.stringify(result)) as any,
        confidence: (result as any).dateEstimate?.confidence || 0.7,
        suggestions: (result as any).suggestions || [],
        claudeTokensUsed: 0,
      },
    });

    // Update photo with analysis results if photo exists
    if (photo) {
      await prisma.photo.update({
        where: { id: photo.id },
        data: {
          story: (result as PhotoAnalysisResult).story || null,
          historicalContext: (result as PhotoAnalysisResult).historicalContext || null,
          dateSuggestion: (result as PhotoAnalysisResult).dateEstimate?.period || null,
          metadata: {
            ...((photo.metadata as Record<string, unknown>) || {}),
            lastAnalyzed: new Date().toISOString(),
            analysisId: analysis.id,
          },
        },
      });
    }

    // Record usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    await prisma.usage.upsert({
      where: {
        userId_type_period: {
          userId,
          type: AnalysisType.PHOTO,
          period: startOfMonth,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        userId,
        type: AnalysisType.PHOTO,
        count: 1,
        period: startOfMonth,
      },
    });

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      analysis: result,
      photoUpdated: !!photo,
    });

  } catch (error) {
    console.error("Photo analysis error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Usage limit")) {
        return NextResponse.json(
          { error: "Usage limit exceeded" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to analyze photo" },
      { status: 500 }
    );
  }
}