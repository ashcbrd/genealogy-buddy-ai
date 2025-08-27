import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { researchChat } from "@/lib/claude";
import { checkUsageLimit, incrementUsage } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { checkUnifiedAccess, recordUnifiedUsage, createUnifiedErrorResponse, createUnifiedSuccessResponse } from "@/lib/unified-access-control";
import { AnalysisType } from "@prisma/client";
import type { ResearchChatRequest, ChatMessage } from "@/types";
import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Check unified access control (works for both anonymous and authenticated users)
    const accessResult = await checkUnifiedAccess(req, AnalysisType.RESEARCH);
    if (!accessResult.hasAccess) {
      return createUnifiedErrorResponse(accessResult);
    }

    const session = await getServerSession(authOptions);

    const requestBody = await req.json();
    
    // Handle both message formats for backward compatibility
    let messages: ChatMessage[];
    
    if ('messages' in requestBody) {
      // New format: array of messages for multi-turn chat
      messages = requestBody.messages as ChatMessage[];
    } else if ('query' in requestBody) {
      // Current format: single query string
      messages = [{
        role: "user",
        content: requestBody.query as string
      }];
    } else {
      return NextResponse.json(
        { error: "Either 'messages' array or 'query' string is required" },
        { status: 400 }
      );
    }

    // Validate messages array
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages cannot be empty" },
        { status: 400 }
      );
    }

    const response = await researchChat(messages, session?.user?.id);

    // Save chat only for authenticated users
    if (session?.user?.id) {
      const messagesJson = JSON.parse(
        JSON.stringify(messages)
      ) as unknown as Prisma.InputJsonValue;

      await prisma.researchChat.create({
        data: {
          userId: session.user.id,
          messages: messagesJson,
        },
      });

      // Legacy usage tracking for authenticated users
      await incrementUsage(session.user.id, "RESEARCH");
    }

    // Record unified usage (works for both anonymous and authenticated)
    await recordUnifiedUsage(accessResult.identity.identityId, AnalysisType.RESEARCH);

    // Return unified response with usage info
    return await createUnifiedSuccessResponse({ 
      response,
    }, accessResult);
  } catch (error) {
    console.error("Research chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
