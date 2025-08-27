import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePresignedUrl, generateFilePath, validateFile, FILE_CONFIGS } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { filename, size, contentType, metadata } = await req.json();

    if (!filename || !size || !contentType) {
      return NextResponse.json(
        { error: "Filename, size, and content type are required" },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(
      { size, type: contentType },
      FILE_CONFIGS.photos.allowedTypes,
      FILE_CONFIGS.photos.maxSize
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate unique storage path
    const storagePath = generateFilePath(userId, "photos", filename);

    // Generate presigned URL for upload
    const uploadUrl = await generatePresignedUrl(storagePath, contentType);

    // Create photo record in database (pending upload)
    const photo = await prisma.photo.create({
      data: {
        userId,
        filename,
        storagePath,
        metadata: metadata || {},
      },
    });

    return NextResponse.json({
      success: true,
      photoId: photo.id,
      uploadUrl,
      storagePath,
    });

  } catch (error) {
    console.error("Photo upload preparation error:", error);
    return NextResponse.json(
      { error: "Failed to prepare photo upload" },
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
    const { photoId, metadata } = await req.json();

    if (!photoId) {
      return NextResponse.json(
        { error: "Photo ID is required" },
        { status: 400 }
      );
    }

    // Update photo status
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        userId,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    // Mark as uploaded successfully and update metadata
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        metadata: metadata ? { ...((photo.metadata as Record<string, unknown>) || {}), ...metadata } : photo.metadata,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Photo upload confirmed",
      photoId,
    });

  } catch (error) {
    console.error("Photo upload confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm photo upload" },
      { status: 500 }
    );
  }
}