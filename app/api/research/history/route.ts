import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build where clause for search (handle missing title field gracefully)
    const whereClause: any = {
      userId: session.user.id,
    };

    if (search) {
      whereClause.OR = [
        { messages: { path: "$", string_contains: search } }
      ];
      // Only add title search if the field exists (after migration)
      try {
        whereClause.OR.push({ title: { contains: search, mode: "insensitive" } });
      } catch (e) {
        // Title field may not exist yet
        console.warn("Title field not available yet, searching messages only");
      }
    }

    // Get total count for pagination with error handling
    let total = 0;
    let chats: any[] = [];
    
    try {
      total = await prisma.researchChat.count({
        where: whereClause,
      });

      // Fetch chat history with graceful field handling
      try {
        chats = await prisma.researchChat.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            messages: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          skip,
          take: limit,
        });
      } catch (fieldError) {
        // If title field doesn't exist, fetch without it
        console.warn("Title field not available, fetching without title");
        chats = await prisma.researchChat.findMany({
          where: whereClause,
          select: {
            id: true,
            messages: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          skip,
          take: limit,
        });
      }
    } catch (dbError) {
      console.error("Database error in chat history:", dbError);
      
      // Return empty state with helpful message
      return NextResponse.json({
        chats: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        error: "Database temporarily unavailable. Please ensure your database is running and migrations are complete.",
      });
    }

    // Process chats to add auto-generated titles and preview
    const processedChats = chats.map(chat => {
      const messages = Array.isArray(chat.messages) ? chat.messages as any[] : [];
      const firstUserMessage = messages.find(msg => msg.role === "user");
      
      // Auto-generate title from first user message if no title exists
      // Handle both missing field and null/empty title
      let title = (chat as any).title || "";
      if (!title && firstUserMessage) {
        title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "");
      }

      // Create preview from first exchange
      let preview = "";
      if (firstUserMessage) {
        preview = firstUserMessage.content.slice(0, 100) + (firstUserMessage.content.length > 100 ? "..." : "");
      }

      return {
        id: chat.id,
        title: title || "Research Chat",
        preview,
        messageCount: messages.length,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      chats: processedChats,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error("Chat history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const chatId = url.searchParams.get("id");

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    // Verify the chat belongs to the user
    const chat = await prisma.researchChat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    // Delete the chat
    await prisma.researchChat.delete({
      where: { id: chatId },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Chat deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}