import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withTransaction } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { treeId, name, individuals, metadata } = await req.json();

    if (!name || !individuals || !Array.isArray(individuals)) {
      return NextResponse.json(
        { error: "Tree name and individuals array are required" },
        { status: 400 }
      );
    }

    const result = await withTransaction(async (tx) => {
      let familyTree;

      if (treeId) {
        // Update existing tree
        const existingTree = await tx.familyTree.findFirst({
          where: {
            id: treeId,
            userId,
            deletedAt: null,
          },
        });

        if (!existingTree) {
          throw new Error("Family tree not found");
        }

        familyTree = await tx.familyTree.update({
          where: { id: treeId },
          data: {
            name,
            data: {
              individuals,
              metadata: metadata || {},
              lastModified: new Date().toISOString(),
            },
          },
        });

        // Delete existing individuals
        await tx.individual.deleteMany({
          where: { treeId },
        });
      } else {
        // Create new tree
        familyTree = await tx.familyTree.create({
          data: {
            userId,
            name,
            data: {
              individuals,
              metadata: metadata || {},
              created: new Date().toISOString(),
            },
          },
        });
      }

      // Create/recreate individuals
      const individualData = individuals.map((individual: any) => ({
        treeId: familyTree.id,
        firstName: individual.firstName || null,
        lastName: individual.lastName || null,
        birthDate: individual.birthDate ? new Date(individual.birthDate) : null,
        deathDate: individual.deathDate ? new Date(individual.deathDate) : null,
        birthPlace: individual.birthPlace || null,
        deathPlace: individual.deathPlace || null,
        confidence: individual.confidence || 1.0,
        aiGenerated: individual.aiGenerated || false,
      }));

      if (individualData.length > 0) {
        await tx.individual.createMany({
          data: individualData,
        });
      }

      return familyTree;
    });

    return NextResponse.json({
      success: true,
      treeId: result.id,
      message: treeId ? "Family tree updated successfully" : "Family tree created successfully",
    });

  } catch (error) {
    console.error("Tree save error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Family tree not found") {
        return NextResponse.json(
          { error: "Family tree not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to save family tree" },
      { status: 500 }
    );
  }
}