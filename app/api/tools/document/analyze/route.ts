import { NextRequest, NextResponse } from "next/server";
import { analyzeDocumentWithImage } from "@/lib/claude";
import { prisma } from "@/lib/prisma";
import { validateApiSecurity, validateFileUpload } from "@/lib/security";
import { AnalysisType } from "@prisma/client";
import type {
  DocumentAnalysisResult,
  JsonObject,
  JsonArray,
  JsonValue,
} from "@/types";

export async function POST(req: NextRequest) {
  try {
    // Comprehensive security validation
    const securityValidation = await validateApiSecurity(req, {
      requireAuth: true,
      checkRateLimit: true,
      logRequest: true,
      validateUsage: { type: AnalysisType.DOCUMENT }
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentId = formData.get("documentId") as string | null;

    if (!file && !documentId) {
      return NextResponse.json(
        { error: "No file or document ID provided" },
        { status: 400 }
      );
    }

    // Validate file upload if file is provided
    if (file) {
      const fileValidation = await validateFileUpload(file, context);
      if (!fileValidation.allowed) {
        return NextResponse.json(
          { error: fileValidation.reason },
          { status: 400 }
        );
      }
    }

    let analysis: DocumentAnalysisResult;
    let createdDocumentId: string | null = documentId;

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

      // Create document record first
      const savedDocument = await prisma.document.create({
        data: {
          userId,
          filename: file.name,
          storagePath: `documents/${userId}/${Date.now()}-${file.name}`, // Temporary path - would need actual storage
          mimeType: file.type,
          size: file.size,
          ocrText: null, // Could extract OCR text later if needed
        },
      });
      
      createdDocumentId = savedDocument.id;

      // Analyze document with Claude
      analysis = await analyzeDocumentWithImage(buffer, userId);
    } else if (documentId) {
      // Get OCR text from existing document
      const document = await prisma.document.findFirst({
        where: { id: documentId, userId },
      });
      if (!document) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      // For existing documents, fall back to text-based analysis
      const { analyzeDocument } = await import("@/lib/claude");
      analysis = await analyzeDocument(document.ocrText ?? "", userId);
    } else {
      return NextResponse.json(
        { error: "No file or document ID provided" },
        { status: 400 }
      );
    }

    // Save analysis to database with document link
    const inputJson: JsonObject = { 
      imageAnalysis: !!file,
      filename: file?.name || "existing document"
    };
    const resultJson = JSON.parse(JSON.stringify(analysis)) as JsonObject;
    const suggestionsJson: JsonArray = analysis.suggestions;

    const savedAnalysis = await prisma.analysis.create({
      data: {
        userId,
        type: AnalysisType.DOCUMENT,
        documentId: createdDocumentId,
        input: inputJson,
        result: resultJson,
        confidence: analysis.names[0]?.confidence ?? 0.5,
        suggestions: suggestionsJson,
      },
    });

    // Usage tracking is handled by validateApiSecurity

    // Add usage info to response headers
    const response = NextResponse.json({
      analysis,
      analysisId: savedAnalysis.id,
      documentId: createdDocumentId,
    });
    
    if (securityValidation.usageValidation) {
      response.headers.set('X-Usage-Current', securityValidation.usageValidation.currentUsage.toString());
      response.headers.set('X-Usage-Limit', securityValidation.usageValidation.limit.toString());
      response.headers.set('X-Usage-Remaining', securityValidation.usageValidation.remaining.toString());
    }
    
    return response;
  } catch (error) {
    console.error("Document analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze document" },
      { status: 500 }
    );
  }
}
