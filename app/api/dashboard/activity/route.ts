import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Get recent analyses
    const recentAnalyses = await prisma.analysis.findMany({
      where: { 
        userId,
        deletedAt: null,
      },
      include: {
        document: {
          select: {
            filename: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get recent documents
    const recentDocuments = await prisma.document.findMany({
      where: { 
        userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get recent family tree updates
    const recentTrees = await prisma.familyTree.findMany({
      where: { 
        userId,
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    // Get recent photos
    const recentPhotos = await prisma.photo.findMany({
      where: { 
        userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Combine and format activities
    const activities = [
      ...recentAnalyses.map(analysis => ({
        id: analysis.id,
        type: 'analysis',
        title: `${analysis.type} Analysis`,
        description: analysis.document?.filename || 'Analysis completed',
        timestamp: analysis.createdAt,
        metadata: {
          analysisType: analysis.type,
          confidence: analysis.confidence,
        },
      })),
      ...recentDocuments.map(doc => ({
        id: doc.id,
        type: 'document',
        title: 'Document Uploaded',
        description: doc.filename,
        timestamp: doc.createdAt,
        metadata: {
          size: doc.size,
          mimeType: doc.mimeType,
        },
      })),
      ...recentTrees.map(tree => ({
        id: tree.id,
        type: 'tree',
        title: 'Family Tree Updated',
        description: tree.name,
        timestamp: tree.updatedAt,
        metadata: {},
      })),
      ...recentPhotos.map(photo => ({
        id: photo.id,
        type: 'photo',
        title: 'Photo Uploaded',
        description: photo.filename,
        timestamp: photo.createdAt,
        metadata: {},
      })),
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

    return NextResponse.json({ activities });

  } catch (error) {
    console.error("Dashboard activity error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity data" },
      { status: 500 }
    );
  }
}