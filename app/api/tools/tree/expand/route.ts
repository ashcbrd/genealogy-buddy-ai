import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { expandFamilyTree } from "@/lib/claude";
import { checkUsageLimit, incrementUsage } from "@/lib/utils";
import { checkUnifiedAccess, recordUnifiedUsage, createUnifiedErrorResponse, createUnifiedSuccessResponse } from "@/lib/unified-access-control";
import { AnalysisType } from "@prisma/client";
import type { FamilyMember } from "@/types";
import type { TreeExpansionResult } from "@/lib/claude";

interface ExpandTreeRequest {
  members: FamilyMember[];
  treeName: string;
}

export async function POST(req: NextRequest) {
  try {
    // Check unified access control (works for both anonymous and authenticated users)
    const accessResult = await checkUnifiedAccess(req, AnalysisType.FAMILY_TREE);
    if (!accessResult.hasAccess) {
      return createUnifiedErrorResponse(accessResult);
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { members, treeName } = (await req.json()) as ExpandTreeRequest;

    const expandedTree: TreeExpansionResult = await expandFamilyTree(
      { members, treeName },
      userId || accessResult.identity.identityId
    );

    if (userId) {
      // Legacy usage tracking for authenticated users
      await incrementUsage(userId, "FAMILY_TREE");
    }

    // Record unified usage (works for both anonymous and authenticated)
    await recordUnifiedUsage(accessResult.identity.identityId, AnalysisType.FAMILY_TREE);

    const suggestedMembers: FamilyMember[] = expandedTree.individuals.map(
      (ind) => {
        const full = ind.name ?? "";
        const [firstName = "", ...rest] = full.trim().split(/\s+/);
        const lastName = rest.join(" ");
        return {
          id: ind.id,
          firstName: firstName || "Unknown",
          lastName: lastName || "",
          birthDate: ind.birthDate ?? undefined,
          deathDate: ind.deathDate ?? undefined,
          birthPlace: ind.birthPlace ?? undefined,
          deathPlace: undefined,
          parentIds: [],
          confidence: 0.7,
          aiGenerated: true,
        };
      }
    );

    // Return unified response with usage info
    return await createUnifiedSuccessResponse({
      suggestedMembers,
      relationships: [], // Relationships are embedded in individuals
      suggestions: expandedTree.suggestions ?? [],
    }, accessResult);
  } catch (error) {
    console.error("Tree expansion error:", error);
    return NextResponse.json(
      { error: "Failed to expand tree" },
      { status: 500 }
    );
  }
}
