#!/usr/bin/env tsx

/**
 * Simple script to test database connection and schema
 * Usage: npm run test-db
 */

import { prisma, withRetry, checkDatabaseHealth, connectDB } from '../lib/prisma';

async function testConnection() {
  console.log('🔍 Testing database connection with enhanced error handling...');
  
  try {
    // Use the enhanced connection function
    await connectDB();
    
    // Test database health
    const health = await checkDatabaseHealth();
    console.log(`🏥 Database health: ${health.status} (${health.latency}ms)`);
    if (health.circuitState) {
      console.log(`🔌 Circuit breaker state: ${health.circuitState}`);
    }
    
    // Test if we can query the database with retry
    const userCount = await withRetry(async () => {
      return await prisma.user.count();
    }, 3, 1500);
    console.log(`📊 Found ${userCount} users in database`);
    
    // Test ResearchChat table with retry
    try {
      const chatCount = await withRetry(async () => {
        return await prisma.researchChat.count();
      }, 3, 1500);
      console.log(`💬 Found ${chatCount} research chats`);
      
      // Check if title field exists by trying to select it
      try {
        const sampleChat = await prisma.researchChat.findFirst({
          select: { id: true, title: true }
        });
        console.log('✅ Title field exists in ResearchChat table');
      } catch (titleError) {
        console.log('⚠️  Title field missing in ResearchChat table - migration needed');
        console.log('   Run: npx prisma migrate dev --name add_title_to_research_chat');
      }
    } catch (chatError) {
      console.log('❌ ResearchChat table not accessible:', (chatError as Error).message);
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log((error as Error).message);
    
    if ((error as Error).message.includes('Can\'t reach database server')) {
      console.log('\n💡 Possible solutions:');
      console.log('   1. Check your DATABASE_URL in .env file');
      console.log('   2. Ensure your database server is running');
      console.log('   3. Check network connectivity');
      console.log('   4. Verify database credentials');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConnection()
  .then(() => {
    console.log('\n🏁 Database test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });