import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const chatId = resolvedParams.id;

    // Fetch the specific chat with error handling
    let chat: any = null;
    
    try {
      chat = await prisma.researchChat.findFirst({
        where: {
          id: chatId,
          userId: session.user.id,
        },
        select: {
          id: true,
          title: true,
          messages: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (fieldError) {
      // If title field doesn't exist, fetch without it
      console.warn("Title field not available, fetching chat without title");
      chat = await prisma.researchChat.findFirst({
        where: {
          id: chatId,
          userId: session.user.id,
        },
        select: {
          id: true,
          messages: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    // Process messages to ensure they have proper format
    const messages = Array.isArray(chat.messages) ? chat.messages as any[] : [];
    
    const processedMessages = messages.map((msg, index) => ({
      id: msg.id || `msg-${index}`,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : chat.createdAt,
    }));

    // Generate title if missing
    const firstUserMessage = messages.find(msg => msg.role === "user");
    let title = chat.title || "";
    if (!title && firstUserMessage) {
      title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "");
    }

    return NextResponse.json({
      id: chat.id,
      title: title || "Research Chat",
      messages: processedMessages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    });

  } catch (error) {
    console.error("Chat fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const chatId = resolvedParams.id;
    const { title } = await req.json();

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

    // Update the chat title
    const updatedChat = await prisma.researchChat.update({
      where: { id: chatId },
      data: { title },
    });

    return NextResponse.json({ 
      id: updatedChat.id,
      title: updatedChat.title,
    });

  } catch (error) {
    console.error("Chat update error:", error);
    return NextResponse.json(
      { error: "Failed to update chat" },
      { status: 500 }
    );
  }
}