import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDownloadUrl } from "@/lib/storage";

// GET - List user's translation history
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
      type: 'TRANSLATION',
      deletedAt: null,
    };

    // If search is provided, search in the result JSON for original or translated text
    if (search) {
      whereClause.OR = [
        {
          result: {
            path: ['originalText'],
            string_contains: search,
          },
        },
        {
          result: {
            path: ['translatedText'],
            string_contains: search,
          },
        },
      ];
    }

    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.analysis.count({ where: whereClause }),
    ]);

    // Transform analyses to translation records with viewUrl generation
    const translationsWithUrls = await Promise.all(
      analyses.map(async (analysis) => {
        const result = analysis.result as any;
        const input = analysis.input as any;
        
        let viewUrl: string | null = null;
        let filename: string | undefined = undefined;
        
        // Check if this translation involved an image
        const hasImageData = input?.imageData && input.imageData !== "[Image provided]";
        const type: 'image' | 'text' = hasImageData ? 'image' : 'text';
        
        // For image translations, try to generate a view URL if we have a stored path
        // Note: The current API doesn't store image files, but we prepare for future enhancement
        if (type === 'image') {
          filename = `translation_${analysis.id}.jpg`;
          // Try to generate URL from hypothetical storage path
          try {
            const storagePath = `translations/${userId}/${analysis.id}`;
            viewUrl = await generateDownloadUrl(storagePath);
          } catch (error) {
            console.warn(`Could not generate URL for translation ${analysis.id}:`, error);
            viewUrl = null;
          }
        }
        
        return {
          id: analysis.id,
          originalText: result?.originalText || '',
          translatedText: result?.translatedText || '',
          sourceLanguage: result?.sourceLanguage || 'auto',
          targetLanguage: result?.targetLanguage || 'en',
          confidence: result?.confidence || 0,
          type,
          filename,
          viewUrl,
          createdAt: analysis.createdAt.toISOString(),
          analysis: {
            id: analysis.id,
            type: analysis.type,
            confidence: analysis.confidence || 0,
            result: result,
            suggestions: analysis.suggestions || [],
            createdAt: analysis.createdAt.toISOString(),
          },
        };
      })
    );

    return NextResponse.json({
      translations: translationsWithUrls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Translations list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch translations" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a translation
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const translationId = searchParams.get('id');

    if (!translationId) {
      return NextResponse.json(
        { error: "Translation ID is required" },
        { status: 400 }
      );
    }

    // Get translation analysis record
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: translationId,
        userId,
        type: 'TRANSLATION',
        deletedAt: null,
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Translation not found" },
        { status: 404 }
      );
    }

    // Soft delete in database
    await prisma.analysis.update({
      where: { id: translationId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Translation deleted successfully",
    });

  } catch (error) {
    console.error("Translation deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete translation" },
      { status: 500 }
    );
  }
}