#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

console.log('🚀 Starting Expo Go dev server...\n');
console.log('📱 Next steps:');
console.log('   1. Install Expo Go app on your phone');
console.log('   2. Scan the QR code that appears below');
console.log('   3. Your app will load on your phone!\n');
console.log('⏳ Starting server...\n');

const expo = spawn('npx', ['expo', 'start', '--clear'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname + '/..',
});

expo.on('error', (error) => {
  console.error('❌ Failed to start:', error.message);
  process.exit(1);
});

expo.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`\n⚠️  Server stopped with code ${code}`);
  }
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down Expo server...');
  expo.kill();
  process.exit(0);
});
