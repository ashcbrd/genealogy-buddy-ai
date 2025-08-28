import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminAccount, isAdmin } from "@/lib/admin-setup";
import { SubscriptionTier } from "@prisma/client";

/**
 * Admin-only API endpoint to create admin/developer accounts
 * POST /api/admin/create-account
 */
export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify admin privileges
    const userIsAdmin = await isAdmin(session.user.id);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }

    const { email, password, name, tier } = await req.json();

    // Validate input
    if (!email || !password || !name || !tier) {
      return NextResponse.json(
        { error: "Email, password, name, and tier are required" },
        { status: 400 }
      );
    }

    // Validate tier
    if (tier !== "ADMIN") {
      return NextResponse.json(
        { error: "Tier must be ADMIN" },
        { status: 400 }
      );
    }

    // Create the account
    const result = await createAdminAccount({
      email,
      password,
      name,
      tier: SubscriptionTier.ADMIN,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        userId: result.userId,
        message: `${tier} account created successfully`,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Admin account creation error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}