#!/usr/bin/env node

/**
 * Diagnostics script to check server health
 */

async function checkHealth() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Server is healthy!');
      console.log(`   Status: ${data.status}`);
      console.log(`   Database: ${data.database}`);
      console.log(`   Total logs: ${data.totalLogs}`);
      console.log('\nYou can access the web UI at: http://localhost:3000\n');
      process.exit(0);
    } else {
      console.error('\n❌ Server returned non-OK status:', response.status);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Could not connect to server:', error.message);
    console.log('\nTroubleshooting:');
    console.log('   1. Make sure the server is running: npm run dev');
    console.log('   2. Check if port 3000 is available: lsof -i :3000');
    console.log('   3. Check server logs for errors');
    console.log('   4. Try restarting the server');
    process.exit(1);
  }
}

checkHealth();