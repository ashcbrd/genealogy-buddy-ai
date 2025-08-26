import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        bio: true,
        location: true,
        dateOfBirth: true,
        phoneNumber: true,
        website: true,
        researchInterests: true,
        familyOrigins: true,
        languages: true,
        profilePublic: true,
        allowContact: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      bio,
      location,
      dateOfBirth,
      phoneNumber,
      website,
      researchInterests,
      familyOrigins,
      languages,
      profilePublic,
      allowContact,
    } = body;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        bio,
        location,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        phoneNumber,
        website,
        researchInterests,
        familyOrigins,
        languages,
        profilePublic,
        allowContact,
      },
      select: {
        firstName: true,
        lastName: true,
        bio: true,
        location: true,
        dateOfBirth: true,
        phoneNumber: true,
        website: true,
        researchInterests: true,
        familyOrigins: true,
        languages: true,
        profilePublic: true,
        allowContact: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}