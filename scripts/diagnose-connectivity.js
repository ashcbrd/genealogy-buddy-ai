#!/usr/bin/env node

/**
 * Network connectivity diagnostic script
 * Tests various connection methods to Supabase
 */

const { exec } = require('child_process');
const https = require('https');
const net = require('net');

console.log('🔍 Diagnosing database connectivity issues...\n');

// Test URLs
const SUPABASE_HOST = 'db.cekhngnakciszleuhlpa.supabase.com';
const SUPABASE_API = 'https://cekhngnakciszleuhlpa.supabase.com';
const DIRECT_PORT = 5432;
const POOLER_HOST = 'aws-1-us-east-2.pooler.supabase.com';
const POOLER_PORT = 6543;

// 1. Test DNS Resolution
async function testDNS() {
  console.log('1️⃣ Testing DNS resolution...');
  
  return new Promise((resolve) => {
    exec(`nslookup ${SUPABASE_HOST}`, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ DNS resolution failed:', error.message);
        resolve(false);
      } else {
        console.log('✅ DNS resolution successful');
        console.log(`   Host: ${SUPABASE_HOST}`);
        resolve(true);
      }
    });
  });
}

// 2. Test HTTPS API Connectivity
async function testAPI() {
  console.log('\n2️⃣ Testing HTTPS API connectivity...');
  
  return new Promise((resolve) => {
    const req = https.get(SUPABASE_API, { timeout: 10000 }, (res) => {
      console.log(`✅ API connectivity successful (Status: ${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.log('❌ API connectivity failed:', error.message);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('❌ API connectivity timeout');
      req.destroy();
      resolve(false);
    });
  });
}

// 3. Test Direct Database Port
async function testDirectPort() {
  console.log('\n3️⃣ Testing direct database port...');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(10000);
    
    socket.connect(DIRECT_PORT, SUPABASE_HOST, () => {
      console.log(`✅ Direct port ${DIRECT_PORT} is reachable`);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (error) => {
      console.log(`❌ Direct port ${DIRECT_PORT} failed:`, error.code || error.message);
      resolve(false);
    });
    
    socket.on('timeout', () => {
      console.log(`❌ Direct port ${DIRECT_PORT} timeout`);
      socket.destroy();
      resolve(false);
    });
  });
}

// 4. Test Pooler Port
async function testPoolerPort() {
  console.log('\n4️⃣ Testing connection pooler...');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(10000);
    
    socket.connect(POOLER_PORT, POOLER_HOST, () => {
      console.log(`✅ Pooler port ${POOLER_PORT} is reachable`);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (error) => {
      console.log(`❌ Pooler port ${POOLER_PORT} failed:`, error.code || error.message);
      resolve(false);
    });
    
    socket.on('timeout', () => {
      console.log(`❌ Pooler port ${POOLER_PORT} timeout`);
      socket.destroy();
      resolve(false);
    });
  });
}

// 5. Test with different DNS
async function testAlternateDNS() {
  console.log('\n5️⃣ Testing with Google DNS (8.8.8.8)...');
  
  return new Promise((resolve) => {
    exec(`nslookup ${SUPABASE_HOST} 8.8.8.8`, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Google DNS resolution failed:', error.message);
        resolve(false);
      } else {
        console.log('✅ Google DNS resolution successful');
        resolve(true);
      }
    });
  });
}

// Main diagnostic function
async function runDiagnostics() {
  const results = {
    dns: await testDNS(),
    api: await testAPI(), 
    directPort: await testDirectPort(),
    poolerPort: await testPoolerPort(),
    alternateDNS: await testAlternateDNS()
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.padEnd(15)}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log('\n🎯 RECOMMENDATIONS:');
  
  if (!results.dns) {
    console.log('• DNS resolution failed - try different network or DNS servers');
  }
  
  if (!results.api) {
    console.log('• API not reachable - Supabase project may be paused or down');
    console.log('• Check https://status.supabase.com/ for service status');
  }
  
  if (!results.directPort && !results.poolerPort) {
    console.log('• Database ports blocked - firewall or network restriction');
    console.log('• Try mobile hotspot or different network');
  }
  
  if (results.api && !results.directPort) {
    console.log('• Supabase API works but database port blocked');
    console.log('• This suggests firewall/network filtering database connections');
  }
  
  if (!results.alternateDNS && !results.dns) {
    console.log('• DNS completely blocked - network-level restriction');
  }
  
  const totalPassed = Object.values(results).filter(Boolean).length;
  const totalTests = Object.values(results).length;
  
  console.log(`\n📈 Overall Status: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === 0) {
    console.log('🚨 Complete network isolation - try different network');
  } else if (totalPassed < 3) {
    console.log('⚠️ Partial connectivity - network restrictions likely');
  } else {
    console.log('✅ Good connectivity - issue may be temporary');
  }
}

// Run diagnostics
runDiagnostics().catch(console.error);