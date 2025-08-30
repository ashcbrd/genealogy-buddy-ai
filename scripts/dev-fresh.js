#!/usr/bin/env node

/**
 * Start development server with fresh environment and cleared cache
 */

const { spawn } = require('child_process');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

console.log('🚀 Starting development server with fresh environment...');
console.log('🔧 Using pooler database connection');

// Set NODE_ENV explicitly to development
process.env.NODE_ENV = 'development';

// Verify database URL
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('pooler.supabase.com:6543')) {
  console.log('✅ Database URL correctly configured for pooler');
} else {
  console.log('⚠️ Database URL might not be using pooler');
}

// Start the development server
const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    // Force reload of environment
    FORCE_RELOAD: 'true'
  }
});

devProcess.on('error', (error) => {
  console.error('Failed to start development server:', error);
  process.exit(1);
});

devProcess.on('close', (code) => {
  console.log(`Development server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  devProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  devProcess.kill('SIGTERM');
});