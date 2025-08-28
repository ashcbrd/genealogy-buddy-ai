/**
 * Admin Account Creation Script
 * 
 * Usage:
 * npx tsx scripts/create-admin.ts
 * 
 * Or create admin account:
 * npx tsx scripts/create-admin.ts admin admin@yourcompany.com your-secure-password
 */

import { setupAdminAccount, listPrivilegedAccounts } from "../lib/admin-setup";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("🔧 Admin Account Setup");
    console.log("======================");
    console.log();
    console.log("Usage:");
    console.log("  npx tsx scripts/create-admin.ts admin <email> <password> [name]");
    console.log("  npx tsx scripts/create-admin.ts list");
    console.log();
    console.log("Examples:");
    console.log("  npx tsx scripts/create-admin.ts admin admin@company.com secure123 \"Admin User\"");
    console.log("  npx tsx scripts/create-admin.ts list");
    console.log();
    
    // Show current admin accounts
    console.log("Current admin accounts:");
    const accounts = await listPrivilegedAccounts();
    if (accounts.length === 0) {
      console.log("  No admin accounts found.");
    } else {
      accounts.forEach(account => {
        console.log(`  ${account.tier}: ${account.email} (${account.name}) - ID: ${account.id}`);
      });
    }
    return;
  }

  const [type, email, password, name] = args;

  if (type === "list") {
    console.log("📋 Current admin accounts:");
    const accounts = await listPrivilegedAccounts();
    if (accounts.length === 0) {
      console.log("No admin accounts found.");
    } else {
      accounts.forEach(account => {
        console.log(`${account.tier}: ${account.email} (${account.name})`);
        console.log(`  ID: ${account.id}`);
        console.log(`  Created: ${account.createdAt.toISOString()}`);
        console.log();
      });
    }
    return;
  }

  if (!email || !password) {
    console.error("❌ Error: Email and password are required");
    console.log("Usage: npx tsx scripts/create-admin.ts admin <email> <password> [name]");
    process.exit(1);
  }

  if (type !== "admin") {
    console.error("❌ Error: Type must be 'admin'");
    console.log("Usage: npx tsx scripts/create-admin.ts admin <email> <password> [name]");
    process.exit(1);
  }

  console.log(`🚀 Creating ${type} account...`);
  console.log(`   Email: ${email}`);
  console.log(`   Name: ${name || "Admin"}`);

  const result = await setupAdminAccount(email, password, name);

  if (result.success) {
    console.log(`✅ ${type.toUpperCase()} account created successfully!`);
    console.log(`   User ID: ${result.userId}`);
    console.log();
    console.log("🔑 Login credentials:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log();
    console.log("🌐 You can now login at: http://localhost:3000/login");
    
    if (type === "admin") {
      console.log("📊 Admin panel: http://localhost:3000/admin");
    }
  } else {
    console.error(`❌ Failed to create ${type} account:`);
    console.error(`   ${result.error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});