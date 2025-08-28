import { NextRequest, NextResponse } from "next/server";
import { researchChat } from "@/lib/claude";
import { prisma } from "@/lib/prisma";
import { validateApiSecurity } from "@/lib/security";
import { AnalysisType } from "@prisma/client";
import type { ResearchChatRequest, ChatMessage } from "@/types";
import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Comprehensive security validation
    const securityValidation = await validateApiSecurity(req, {
      requireAuth: true,
      checkRateLimit: true,
      logRequest: true,
      validateUsage: { type: AnalysisType.RESEARCH }
    });

    if (!securityValidation.allowed) {
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

    const response = await researchChat(messages, userId);

    // Save chat
    const messagesJson = JSON.parse(
      JSON.stringify(messages)
    ) as unknown as Prisma.InputJsonValue;

    const chat = await prisma.researchChat.create({
      data: {
        userId,
        messages: messagesJson,
      },
    });

    // Usage tracking is handled by validateApiSecurity

    // Add usage info to response headers
    const responseObj = NextResponse.json({ 
      response,
      chatId: chat.id,
    });
    
    if (securityValidation.usageValidation) {
      responseObj.headers.set('X-Usage-Current', securityValidation.usageValidation.currentUsage.toString());
      responseObj.headers.set('X-Usage-Limit', securityValidation.usageValidation.limit.toString());
      responseObj.headers.set('X-Usage-Remaining', securityValidation.usageValidation.remaining.toString());
    }
    
    return responseObj;
  } catch (error) {
    console.error("Research chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
