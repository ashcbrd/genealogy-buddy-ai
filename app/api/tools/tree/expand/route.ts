import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { expandFamilyTree } from "@/lib/claude";
import { checkUsageLimit, incrementUsage } from "@/lib/utils";
import {
  checkUnifiedAccess,
  recordUnifiedUsage,
  createUnifiedErrorResponse,
  createUnifiedSuccessResponse,
} from "@/lib/unified-access-control";
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
    const accessResult = await checkUnifiedAccess(
      req,
      AnalysisType.FAMILY_TREE
    );
    if (!accessResult.hasAccess) {
      return createUnifiedErrorResponse(accessResult);
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { members, treeName } = (await req.json()) as ExpandTreeRequest;

    const expandedTree: TreeExpansionResult = await expandFamilyTree(
      { members, treeName },
      userId
    );

    if (userId) {
      // Legacy usage tracking for authenticated users
      await incrementUsage(userId, "FAMILY_TREE");
    }

    // Record unified usage (works for both anonymous and authenticated)
    await recordUnifiedUsage(
      accessResult.identity.identityId,
      AnalysisType.FAMILY_TREE
    );

    // Helper function to normalize names for comparison
    const normalizeName = (firstName: string, lastName: string): string => {
      return `${firstName?.toLowerCase()?.trim()} ${lastName
        ?.toLowerCase()
        ?.trim()}`.trim();
    };

    // Create a set of existing member names for quick lookup
    const existingMemberNames = new Set(
      members.map((member) => normalizeName(member.firstName, member.lastName))
    );

    // Filter out duplicates and convert to FamilyMember format
    const suggestedMembers: FamilyMember[] = expandedTree.individuals
      .map((ind) => {
        const full = ind.name ?? "";
        const [firstName = "", ...rest] = full.trim().split(/\s+/);
        const lastName = rest.join(" ");
        // Validate and conservative relationship assignment
        let relationshipToUser = ind.relationshipDescription;

        // Make relationship descriptions more conservative while keeping names
        if (relationshipToUser) {
          // Check if it's a specific parent/child relationship claim
          const specificClaims = [
            "father of",
            "mother of",
            "son of",
            "daughter of",
            "parent of",
            "child of",
          ];
          const hasSpecificClaim = specificClaims.some((claim) =>
            relationshipToUser?.toLowerCase().includes(claim)
          );

          if (hasSpecificClaim) {
            // Check if we have strong evidence (high confidence)
            const hasStrongEvidence =
              ind.relationships &&
              ind.relationships.some((rel) => rel.confidence > 0.8);

            if (!hasStrongEvidence) {
              // Keep the name but make relationship generic
              const nameMatch = relationshipToUser.match(/(?:of|to)\s+(.+)$/);
              const relatedName = nameMatch ? nameMatch[1] : "family member";
              relationshipToUser = `Relative of ${relatedName}`;
            }
          }
        } else if (firstName && firstName !== "Unknown") {
          // If no relationship provided, keep it undefined rather than making one up
          relationshipToUser = undefined;
        }

        return {
          id: ind.id,
          firstName: firstName || "Unknown",
          lastName: lastName || "",
          birthDate: ind.birthDate ?? undefined,
          deathDate: ind.deathDate ?? undefined,
          birthPlace: ind.birthPlace ?? undefined,
          deathPlace: ind.deathPlace ?? undefined,
          parentIds: [],
          confidence: Math.min(0.6, ind.relationships?.[0]?.confidence || 0.4), // Cap confidence
          aiGenerated: true,
          relationshipToUser: relationshipToUser,
        };
      })
      .filter((suggested) => {
        const suggestedName = normalizeName(
          suggested.firstName,
          suggested.lastName
        );

        // Skip if name is empty or just "unknown"
        if (
          !suggestedName ||
          suggestedName === "unknown" ||
          suggestedName === "unknown unknown"
        ) {
          return false;
        }

        // Skip if this person already exists in the tree
        if (existingMemberNames.has(suggestedName)) {
          console.log(
            `Filtering out duplicate: ${suggested.firstName} ${suggested.lastName}`
          );
          return false;
        }

        return true;
      });

    // Return unified response with usage info
    return await createUnifiedSuccessResponse(
      {
        suggestedMembers,
        relationships: [], // Relationships are embedded in individuals
        suggestions: expandedTree.suggestions ?? [],
      },
      accessResult
    );
  } catch (error) {
    console.error("Tree expansion error:", error);
    return NextResponse.json(
      { error: "Failed to expand tree" },
      { status: 500 }
    );
  }
}
