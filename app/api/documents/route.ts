import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteStorageFile, generateDownloadUrl } from "@/lib/storage";

// GET - List user's documents
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

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        include: {
          analysis: {
            select: {
              id: true,
              type: true,
              confidence: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.document.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Documents list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a document
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Soft delete in database
    await prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    // Delete from storage (optional - could be done in background job)
    try {
      await deleteStorageFile(document.storagePath);
    } catch (storageError) {
      console.warn("Failed to delete file from storage:", storageError);
      // Continue - database record is marked as deleted
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });

  } catch (error) {
    console.error("Document deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}