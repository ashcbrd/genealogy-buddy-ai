import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { researchChat } from "@/lib/claude";
import { checkUsageLimit, incrementUsage } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { checkUnifiedAccess, recordUnifiedUsage, createUnifiedErrorResponse, createUnifiedSuccessResponse } from "@/lib/unified-access-control";
import { AnalysisType } from "@prisma/client";
import type { ResearchChatRequest } from "@/types";
import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Check unified access control (works for both anonymous and authenticated users)
    const accessResult = await checkUnifiedAccess(req, AnalysisType.RESEARCH);
    if (!accessResult.hasAccess) {
      return createUnifiedErrorResponse(accessResult);
    }

    const session = await getServerSession(authOptions);

    const { messages } = (await req.json()) as ResearchChatRequest;

    const response = await researchChat(messages, session?.user?.id || accessResult.identity.identityId);

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
