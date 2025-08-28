import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { expandFamilyTree } from "@/lib/claude";
import { prisma } from "@/lib/prisma";
import { AnalysisType, SubscriptionTier } from "@prisma/client";
import { SUBSCRIPTION_LIMITS } from "@/types";
import type { FamilyMember } from "@/types";
import type { TreeExpansionResult } from "@/lib/claude";

interface ExpandTreeRequest {
  members: FamilyMember[];
  treeName: string;
}

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to use this feature." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Check usage limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    
    const tier = subscription?.tier || SubscriptionTier.FREE;
    const limits = SUBSCRIPTION_LIMITS[tier];
    
    if (limits.trees === 0) {
      return NextResponse.json(
        { error: "Family tree building is not available in your plan. Please upgrade to access this feature." },
        { status: 402 }
      );
    }
    
    // Check current usage if not unlimited
    if (limits.trees !== -1) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const currentUsage = await prisma.analysis.count({
        where: {
          userId,
          type: AnalysisType.FAMILY_TREE,
          createdAt: { gte: startOfMonth },
          deletedAt: null,
        },
      });
      
      if (currentUsage >= limits.trees) {
        return NextResponse.json(
          { error: `You have reached your monthly limit of ${limits.trees} tree expansions. Please upgrade your plan or wait until next month.` },
          { status: 429 }
        );
      }
    }

    const { members, treeName } = (await req.json()) as ExpandTreeRequest;

    console.log(`[Tree Expansion] User: ${userId}, Members: ${members?.length || 0}, TreeName: ${treeName}`);

    const expandedTree: TreeExpansionResult = await expandFamilyTree(
      { members, treeName },
      userId
    );

    console.log(`[Tree Expansion] AI returned ${expandedTree?.individuals?.length || 0} individuals`);

    // Record analysis in the database
    const analysisData = {
      members,
      treeName,
    };

    await prisma.analysis.create({
      data: {
        userId,
        type: AnalysisType.FAMILY_TREE,
        input: JSON.parse(JSON.stringify(analysisData)) as any,
        result: JSON.parse(JSON.stringify(expandedTree)) as any,
        confidence: 0.8,
        suggestions: (expandedTree as any).suggestions || [],
        claudeTokensUsed: 0,
      },
    });

    // Record usage for real-time tracking
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    await prisma.usage.upsert({
      where: {
        userId_type_period: {
          userId,
          type: AnalysisType.FAMILY_TREE,
          period: startOfMonth,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        userId,
        type: AnalysisType.FAMILY_TREE,
        count: 1,
        period: startOfMonth,
      },
    });

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

    return NextResponse.json({
      suggestedMembers,
      relationships: [], // Relationships are embedded in individuals
      suggestions: expandedTree.suggestions ?? [],
    });
  } catch (error) {
    console.error("Tree expansion error:", error);
    
    // Provide more detailed error messages
    let errorMessage = "Failed to expand tree";
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = "Claude API rate limit exceeded. Please try again in a moment.";
        statusCode = 429;
      } else if (error.message.includes('authentication') || error.message.includes('401')) {
        errorMessage = "AI service authentication error. Please try again.";
        statusCode = 503;
      } else if (error.message.includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
        statusCode = 504;
      } else {
        errorMessage = `Tree expansion failed: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
