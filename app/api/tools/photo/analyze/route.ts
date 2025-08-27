import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzePhoto } from "@/lib/claude";
import { checkUsageLimit, incrementUsage } from "@/lib/utils";
import { checkUnifiedAccess, recordUnifiedUsage, createUnifiedErrorResponse, createUnifiedSuccessResponse } from "@/lib/unified-access-control";
import { AnalysisType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Check unified access control (works for both anonymous and authenticated users)
    const accessResult = await checkUnifiedAccess(req, AnalysisType.PHOTO);
    if (!accessResult.hasAccess) {
      return createUnifiedErrorResponse(accessResult);
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
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
    else if (photoId && userId) {
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
    } else if (photoId && !userId) {
      return NextResponse.json(
        { error: "Saved photos are not available for anonymous users. Please sign in or provide image data directly." },
        { status: 403 }
      );
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

    // Save analysis to database (only for authenticated users)
    let analysisId = null;
    if (userId) {
      const analysis = await prisma.analysis.create({
        data: {
          userId,
          type: "PHOTO",
          input: {
            photoId,
            description: imageAnalysisData.textDescription || imageAnalysisData.fileName || 'Image analysis',
            additionalContext: imageAnalysisData.additionalContext,
          },
          result: result as any,
          confidence: (result as any).confidence || 0.7,
          suggestions: (result as any).suggestions || [],
          claudeTokensUsed: 0, // Will be updated by Claude usage tracking
        },
      });
      analysisId = analysis.id;

      // Update photo with analysis results if photo exists
      if (photo) {
        await prisma.photo.update({
          where: { id: photo.id },
          data: {
            story: (result as any).story || null,
            historicalContext: (result as any).historicalContext || null,
            dateSuggestion: (result as any).dateSuggestion || null,
            metadata: {
              ...((photo.metadata as Record<string, unknown>) || {}),
              lastAnalyzed: new Date().toISOString(),
              analysisId: analysisId,
            },
          },
        });
      }

      // Legacy usage tracking for authenticated users
      await incrementUsage(userId, "PHOTO");
    }

    // Record unified usage (works for both anonymous and authenticated)
    await recordUnifiedUsage(accessResult.identity.identityId, AnalysisType.PHOTO);

    // Return unified response with usage info
    return await createUnifiedSuccessResponse({
      success: true,
      analysisId,
      analysis: result,
      photoUpdated: !!photo,
    }, accessResult);

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