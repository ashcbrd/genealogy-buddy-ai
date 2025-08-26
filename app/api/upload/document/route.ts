import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePresignedUrl, generateFileKey, validateFile, FILE_CONFIGS } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { filename, size, contentType } = await req.json();

    if (!filename || !size || !contentType) {
      return NextResponse.json(
        { error: "Filename, size, and content type are required" },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(
      { size, type: contentType },
      FILE_CONFIGS.documents.allowedTypes,
      FILE_CONFIGS.documents.maxSize
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate unique S3 key
    const s3Key = generateFileKey(userId, "documents", filename);

    // Generate presigned URL for upload
    const uploadUrl = await generatePresignedUrl(s3Key, contentType);

    // Create document record in database (pending upload)
    const document = await prisma.document.create({
      data: {
        userId,
        filename,
        s3Key,
        mimeType: contentType,
        size,
      },
    });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      uploadUrl,
      s3Key,
    });

  } catch (error) {
    console.error("Document upload preparation error:", error);
    return NextResponse.json(
      { error: "Failed to prepare document upload" },
      { status: 500 }
    );
  }
}

// Confirm upload completion
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Update document status
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Mark as uploaded successfully
    await prisma.document.update({
      where: { id: documentId },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document upload confirmed",
      documentId,
    });

  } catch (error) {
    console.error("Document upload confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm document upload" },
      { status: 500 }
    );
  }
}