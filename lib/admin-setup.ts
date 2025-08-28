import { prisma } from "./prisma";
import { hash } from "bcryptjs";
import { SubscriptionTier } from "@prisma/client";

/**
 * Admin Setup Utility
 * Use this to create admin and developer accounts
 */

export interface CreateAdminRequest {
  email: string;
  password: string;
  name: string;
  tier: SubscriptionTier;
}

/**
 * Create an admin or developer account
 * Only use this for initial setup or testing
 */
export async function createAdminAccount({
  email,
  password,
  name,
  tier,
}: CreateAdminRequest): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: `User with email ${email} already exists`,
      };
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: new Date(), // Auto-verify admin accounts
        provider: "credentials",
      },
    });

    // Create subscription with admin/developer tier
    await prisma.subscription.create({
      data: {
        userId: user.id,
        tier,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    console.log(`✅ ${tier} account created successfully:`);
    console.log(`   Email: ${email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Tier: ${tier}`);

    return {
      success: true,
      userId: user.id,
    };
  } catch (error) {
    console.error(`Failed to create ${tier} account:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Quick setup function for admin account
 */
export async function setupAdminAccount(email: string, password: string, name: string = "Admin") {
  return createAdminAccount({
    email,
    password,
    name,
    tier: SubscriptionTier.ADMIN,
  });
}

/**
 * Check if a user has admin privileges
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    
    return subscription?.tier === SubscriptionTier.ADMIN;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}


/**
 * List all admin accounts
 */
export async function listPrivilegedAccounts() {
  try {
    const accounts = await prisma.user.findMany({
      where: {
        subscription: {
          tier: SubscriptionTier.ADMIN,
        },
      },
      include: {
        subscription: true,
      },
    });

    return accounts.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.subscription?.tier,
      createdAt: user.createdAt,
    }));
  } catch (error) {
    console.error("Error listing privileged accounts:", error);
    return [];
  }
}