#!/usr/bin/env node

const { spawn } = require('child_process');
const { execSync } = require('child_process');

console.log('🌐 Starting Expo web server...');
console.log('📱 Your app will be available at http://localhost:8081');
console.log('');

const expo = spawn('npx', ['expo', 'start', '--web'], {
  stdio: 'inherit',
  shell: true,
});

expo.on('error', (error) => {
  console.error('❌ Failed to start:', error.message);
  process.exit(1);
});

expo.on('close', (code) => {
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  expo.kill();
  process.exit(0);
});
