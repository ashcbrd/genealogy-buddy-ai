import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile, generateDownloadUrl } from "@/lib/s3";

// GET - List user's photos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search');

    const whereClause: any = {
      userId,
      deletedAt: null,
    };

    if (search) {
      whereClause.filename = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.photo.count({ where: whereClause }),
    ]);

    // Generate signed URLs for viewing
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        try {
          const viewUrl = await generateDownloadUrl(photo.s3Key);
          return { ...photo, viewUrl };
        } catch (error) {
          console.warn(`Failed to generate URL for photo ${photo.id}:`, error);
          return { ...photo, viewUrl: null };
        }
      })
    );

    return NextResponse.json({
      photos: photosWithUrls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Photos list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a photo
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get('id');

    if (!photoId) {
      return NextResponse.json(
        { error: "Photo ID is required" },
        { status: 400 }
      );
    }

    // Get photo
    const photo = await prisma.photo.findFirst({
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

    // Soft delete in database
    await prisma.photo.update({
      where: { id: photoId },
      data: { deletedAt: new Date() },
    });

    // Delete from S3 (optional - could be done in background job)
    try {
      await deleteFile(photo.s3Key);
      if (photo.s3EnhancedKey) {
        await deleteFile(photo.s3EnhancedKey);
      }
    } catch (s3Error) {
      console.warn("Failed to delete file from S3:", s3Error);
      // Continue - database record is marked as deleted
    }

    return NextResponse.json({
      success: true,
      message: "Photo deleted successfully",
    });

  } catch (error) {
    console.error("Photo deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}