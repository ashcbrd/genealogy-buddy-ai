/**
 * Admin Account Deletion Script
 * 
 * Usage:
 * npx tsx scripts/delete-admin.ts <email>
 * 
 * Example:
 * npx tsx scripts/delete-admin.ts admin@genealogybuddy.ai
 */

import { prisma } from "../lib/prisma";

async function deleteAdminAccount(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: `User with email ${email} not found`,
      };
    }

    // Check if user is admin
    if (user.subscription?.tier !== "ADMIN") {
      return {
        success: false,
        error: `User ${email} is not an admin account`,
      };
    }

    console.log(`🗑️  Deleting admin account: ${email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);

    // Delete subscription first (due to foreign key constraint)
    if (user.subscription) {
      await prisma.subscription.delete({
        where: { userId: user.id },
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: user.id },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete admin account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("🗑️  Admin Account Deletion");
    console.log("=========================");
    console.log();
    console.log("Usage:");
    console.log("  npx tsx scripts/delete-admin.ts <email>");
    console.log();
    console.log("Example:");
    console.log("  npx tsx scripts/delete-admin.ts admin@genealogybuddy.ai");
    console.log();
    return;
  }

  const [email] = args;

  if (!email) {
    console.error("❌ Error: Email is required");
    console.log("Usage: npx tsx scripts/delete-admin.ts <email>");
    process.exit(1);
  }

  console.log(`🗑️  Deleting admin account: ${email}`);
  console.log();

  const result = await deleteAdminAccount(email);

  if (result.success) {
    console.log("✅ Admin account deleted successfully!");
    console.log();
    console.log("⚠️  The user can no longer access admin functions.");
  } else {
    console.error("❌ Failed to delete admin account:");
    console.error(`   ${result.error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});