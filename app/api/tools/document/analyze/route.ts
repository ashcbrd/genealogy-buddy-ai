import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeDocumentWithImage } from "@/lib/claude";
import { prisma } from "@/lib/prisma";
import { AnalysisType } from "@prisma/client";
import { 
  checkEnhancedAccess, 
  recordEnhancedUsage, 
  createEnhancedErrorResponse 
} from "@/lib/enhanced-access-control";
import type {
  DocumentAnalysisResult,
  JsonObject,
  JsonArray,
  JsonValue,
} from "@/types";

const DOC = "DOCUMENT";

export async function POST(req: NextRequest) {
  try {
    // Enhanced server-side access control with persistent usage tracking
    const accessResult = await checkEnhancedAccess(req, AnalysisType.DOCUMENT);
    if (!accessResult.hasAccess) {
      return createEnhancedErrorResponse(accessResult);
    }

    const session = await getServerSession(authOptions);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentId = formData.get("documentId") as string | null;

    if (!file && !documentId) {
      return NextResponse.json(
        { error: "No file or document ID provided" },
        { status: 400 }
      );
    }

    let analysis: DocumentAnalysisResult;

    if (file) {
      // Basic guard: handle common image types
      const isImage =
        !!file.type &&
        (file.type.startsWith("image/") ||
          [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/tiff",
            "image/bmp",
          ].includes(file.type));

      if (!isImage) {
        return NextResponse.json(
          { error: "Unsupported file type. Please upload an image." },
          { status: 415 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Analyze document with Claude (OCR + analysis in one step)
      analysis = await analyzeDocumentWithImage(buffer, session?.user?.id);
    } else if (documentId && session?.user?.id) {
      // Get OCR text from existing document (only for authenticated users)
      const document = await prisma.document.findFirst({
        where: { id: documentId, userId: session.user.id },
      });
      if (!document) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      // For existing documents, fall back to text-based analysis
      const { analyzeDocument } = await import("@/lib/claude");
      analysis = await analyzeDocument(document.ocrText ?? "", session.user.id);
    } else if (documentId && accessResult.identity.isAnonymous) {
      // Anonymous users cannot access saved documents
      return NextResponse.json(
        { error: "Saved documents are not available for anonymous users. Please sign in or upload a file directly." },
        { status: 403 }
      );
    } else {
      return NextResponse.json(
        { error: "No file or document ID provided" },
        { status: 400 }
      );
    }

    let savedAnalysis = null;

    // Save analysis to database only for authenticated users
    if (session?.user?.id && !accessResult.identity.isAnonymous) {
      // Prepare JSON payloads using local JSON types (compatible with Prisma Json columns)
      const inputJson: JsonObject = { imageAnalysis: true };
      const resultJson = JSON.parse(JSON.stringify(analysis)) as any;
      const suggestionsJson: JsonArray = analysis.suggestions;

      savedAnalysis = await prisma.analysis.create({
        data: {
          userId: session.user.id,
          type: AnalysisType.DOCUMENT,
          documentId: documentId ?? undefined,
          input: inputJson,
          result: resultJson,
          confidence: analysis.names[0]?.confidence ?? 0.5,
          suggestions: suggestionsJson,
        },
      });
    }

    // Record usage in server-side identity system
    await recordEnhancedUsage(accessResult.identity.identityId, AnalysisType.DOCUMENT);

    // Get updated usage info after recording
    const updatedUsage = accessResult.usage;
    updatedUsage.currentUsage += 1;
    updatedUsage.remaining = Math.max(0, updatedUsage.remaining - 1);

    return NextResponse.json({
      analysis,
      analysisId: savedAnalysis?.id,
      identity: {
        type: accessResult.identity.type,
        isAnonymous: accessResult.identity.isAnonymous,
      },
      usage: {
        current: updatedUsage.currentUsage,
        limit: updatedUsage.limit,
        remaining: updatedUsage.remaining,
        isAtLimit: updatedUsage.isAtLimit,
      },
      upgradeMessage: accessResult.upgradeMessage,
    });
  } catch (error) {
    console.error("Document analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze document" },
      { status: 500 }
    );
  }
}
