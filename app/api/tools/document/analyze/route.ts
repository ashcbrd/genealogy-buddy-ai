import { NextRequest, NextResponse } from "next/server";
import { analyzeDocumentWithImage } from "@/lib/claude";
import { prisma } from "@/lib/prisma";
import { validateApiSecurity, validateFileUpload } from "@/lib/security";
import { uploadFileBuffer, generateFilePath } from "@/lib/storage";
import { AnalysisType } from "@prisma/client";
import type {
  DocumentAnalysisResult,
  JsonObject,
  JsonArray,
  JsonValue,
} from "@/types";
import { SUBSCRIPTION_LIMITS } from "@/types";

export async function POST(req: NextRequest) {
  try {
    console.log("🔍 Document analyze endpoint called");
    
    // Comprehensive security validation
    const securityValidation = await validateApiSecurity(req, {
      requireAuth: true,
      checkRateLimit: true,
      logRequest: true,
      validateUsage: { type: AnalysisType.DOCUMENT }
    });

    if (!securityValidation.allowed) {
      console.error("❌ Security validation failed:", securityValidation.error);
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
    console.log("✅ Security validation passed for user:", userId);

    let formData: FormData;
    try {
      formData = await req.formData();
      console.log("📋 FormData parsed successfully");
    } catch (formDataError) {
      console.error("❌ Failed to parse FormData:", formDataError);
      return NextResponse.json(
        { error: "Invalid request format. Please ensure you're uploading a file correctly." },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File | null;
    const documentId = formData.get("documentId") as string | null;
    
    // Translation options (only available for EXPLORER tier and above)
    const enableTranslation = formData.get("enableTranslation") === "true";
    const targetLanguage = formData.get("targetLanguage") as string | null;
    const sourceLanguage = formData.get("sourceLanguage") as string | null;
    
    console.log("📁 Request data:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      documentId: documentId,
      enableTranslation: enableTranslation,
      targetLanguage: targetLanguage,
      sourceLanguage: sourceLanguage
    });

    if (!file && !documentId) {
      console.error("❌ No file or document ID provided");
      return NextResponse.json(
        { error: "No file or document ID provided. Please select a file to analyze." },
        { status: 400 }
      );
    }

    // Check translation access - only available for EXPLORER tier and above
    if (enableTranslation) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });
      const tier = subscription?.tier || 'FREE';
      const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS];
      
      if (!limits?.translationEnabled) {
        console.error("❌ Translation not available for tier:", tier);
        return NextResponse.json(
          { error: "Translation feature is available in Explorer plan and above. Please upgrade to access translation." },
          { status: 402 }
        );
      }
      
      if (!targetLanguage) {
        return NextResponse.json(
          { error: "Target language is required for translation." },
          { status: 400 }
        );
      }
    }

    // Validate file upload if file is provided
    if (file) {
      console.log("🔍 Validating file upload...");
      const fileValidation = await validateFileUpload(file, context);
      if (!fileValidation.allowed) {
        console.error("❌ File validation failed:", fileValidation.reason);
        return NextResponse.json(
          { error: fileValidation.reason || "File validation failed" },
          { status: 400 }
        );
      }
      console.log("✅ File validation passed");
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
        console.error("❌ Unsupported file type:", file.type);
        return NextResponse.json(
          { error: "Unsupported file type. Please upload an image (PNG, JPG, JPEG, GIF, BMP, TIFF, WEBP)." },
          { status: 415 }
        );
      }

      console.log("🔄 Converting file to buffer...");
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log("📊 Buffer created, size:", buffer.length, "bytes");

      // Generate unique storage path
      const storagePath = generateFilePath(userId, "documents", file.name);
      console.log("📁 Generated storage path:", storagePath);

      // Create document record first
      const savedDocument = await prisma.document.create({
        data: {
          userId,
          filename: file.name,
          storagePath: storagePath,
          mimeType: file.type,
          size: file.size,
          ocrText: null, // Could extract OCR text later if needed
        },
      });
      
      createdDocumentId = savedDocument.id;
      console.log("💾 Document record created:", savedDocument.id);

      // Upload file to Supabase storage
      console.log("☁️ Uploading file to storage...");
      try {
        const fileUrl = await uploadFileBuffer(storagePath, buffer, file.type, {
          originalName: file.name,
          userId: userId,
          uploadType: 'document-analysis'
        });
        console.log("✅ File uploaded successfully:", fileUrl);
      } catch (uploadError) {
        // If upload fails, delete the document record
        await prisma.document.delete({ where: { id: savedDocument.id } });
        throw new Error(`File upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      }

      // Analyze document with Claude
      console.log("🧠 Starting Claude analysis...");
      analysis = await analyzeDocumentWithImage(buffer, userId, {
        enableTranslation,
        targetLanguage: targetLanguage || undefined,
        sourceLanguage: sourceLanguage || undefined,
      });
      console.log("✅ Claude analysis completed:", {
        namesFound: analysis.names?.length || 0,
        datesFound: analysis.dates?.length || 0,
        placesFound: analysis.places?.length || 0,
        eventsFound: analysis.events?.length || 0,
        hasDocumentType: !!analysis.documentType,
        hasSummary: !!analysis.summary,
        hasTranslation: !!analysis.translation
      });
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
      analysis = await analyzeDocument(document.ocrText ?? "", userId, {
        enableTranslation,
        targetLanguage: targetLanguage || undefined,
        sourceLanguage: sourceLanguage || undefined,
      });
    } else {
      return NextResponse.json(
        { error: "No file or document ID provided" },
        { status: 400 }
      );
    }

    // Save analysis to database with document link
    const inputJson: JsonObject = { 
      imageAnalysis: !!file,
      filename: file?.name || "existing document",
      enableTranslation,
      targetLanguage: targetLanguage || null,
      sourceLanguage: sourceLanguage || null,
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
    console.error("💥 Document analysis error:", error);
    
    // Provide more specific error messages based on the error type
    let errorMessage = "Failed to analyze document";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes("Failed to parse FormData")) {
        errorMessage = "Invalid file upload format. Please try uploading the file again.";
        statusCode = 400;
      } else if (error.message.includes("File size") || error.message.includes("too large")) {
        errorMessage = "File is too large. Please upload a file smaller than 10MB.";
        statusCode = 400;
      } else if (error.message.includes("Claude") || error.message.includes("API")) {
        errorMessage = "AI analysis service is temporarily unavailable. Please try again in a few moments.";
        statusCode = 503;
      } else if (error.message.includes("database") || error.message.includes("prisma")) {
        errorMessage = "Database error. Please try again.";
        statusCode = 500;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: statusCode }
    );
  }
}
