import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { GEDCOMFamily } from "@/types";
import { exportGEDCOM } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { treeId, format } = await req.json();

    if (!treeId) {
      return NextResponse.json(
        { error: "Tree ID is required" },
        { status: 400 }
      );
    }

    // Get the family tree with individuals
    const familyTree = await prisma.familyTree.findFirst({
      where: {
        id: treeId,
        userId,
        deletedAt: null,
      },
      include: {
        individuals: true,
      },
    });

    if (!familyTree) {
      return NextResponse.json(
        { error: "Family tree not found" },
        { status: 404 }
      );
    }

    const exportFormat = format || "gedcom";

    if (exportFormat === "gedcom") {
      // Convert individuals to GEDCOM format
      const individuals = familyTree.individuals.map(individual => ({
        id: `@I${individual.id}@`,
        firstName: individual.firstName,
        lastName: individual.lastName,
        birthDate: individual.birthDate,
        deathDate: individual.deathDate,
        birthPlace: individual.birthPlace,
        deathPlace: individual.deathPlace,
        sex: null, // Could be inferred or added to schema
        familyChild: individual.fatherId ? `@F${individual.fatherId}@` : null,
        familySpouse: [], // Would need to be calculated from relationships
      }));

      // Generate families based on parent-child relationships
      const families: GEDCOMFamily[] = [];
      const processedFamilies = new Set();

      familyTree.individuals.forEach(individual => {
        if (individual.fatherId || individual.motherId) {
          const familyKey = `${individual.fatherId || 'unknown'}-${individual.motherId || 'unknown'}`;
          
          if (!processedFamilies.has(familyKey)) {
            families.push({
              id: `@F${families.length + 1}@`,
              type: 'FAM' as const,
              data: {
                husband: individual.fatherId ? `@I${individual.fatherId}@` : undefined,
                wife: individual.motherId ? `@I${individual.motherId}@` : undefined,
                children: familyTree.individuals
                  .filter(child => 
                    (child.fatherId === individual.fatherId || child.motherId === individual.motherId) &&
                    (individual.fatherId || individual.motherId)
                  )
                  .map(child => `@I${child.id}@`),
              },
            });
            processedFamilies.add(familyKey);
          }
        }
      });

      const gedcomContent = exportGEDCOM({
        individuals,
        families: families as unknown as Record<string, unknown>[],
        treeName: familyTree.name,
      });

      return NextResponse.json({
        success: true,
        format: "gedcom",
        filename: `${familyTree.name.replace(/[^a-zA-Z0-9]/g, '_')}.ged`,
        content: gedcomContent,
        mimeType: "text/gedcom",
      });

    } else if (exportFormat === "json") {
      // Export as JSON
      const exportData = {
        treeName: familyTree.name,
        exportDate: new Date().toISOString(),
        individuals: familyTree.individuals.map(individual => ({
          id: individual.id,
          firstName: individual.firstName,
          lastName: individual.lastName,
          birthDate: individual.birthDate,
          deathDate: individual.deathDate,
          birthPlace: individual.birthPlace,
          deathPlace: individual.deathPlace,
          fatherId: individual.fatherId,
          motherId: individual.motherId,
          confidence: individual.confidence,
          aiGenerated: individual.aiGenerated,
        })),
        metadata: familyTree.data,
      };

      return NextResponse.json({
        success: true,
        format: "json",
        filename: `${familyTree.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`,
        content: JSON.stringify(exportData, null, 2),
        mimeType: "application/json",
      });

    } else {
      return NextResponse.json(
        { error: "Unsupported export format. Use 'gedcom' or 'json'" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Tree export error:", error);
    return NextResponse.json(
      { error: "Failed to export family tree" },
      { status: 500 }
    );
  }
}