#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const GCLOUD_PROJECT = process.env.GCLOUD_PROJECT;
const APP_PATH = process.argv[2];

if (!APP_PATH) {
  console.error('❌ Error: Provide path to APK/IPA');
  console.log('Usage: yarn firebase:test <path-to-apk>');
  process.exit(1);
}

if (!fs.existsSync(APP_PATH)) {
  console.error(`❌ Error: App file not found at ${APP_PATH}`);
  process.exit(1);
}

if (!GCLOUD_PROJECT) {
  console.error('❌ Error: GCLOUD_PROJECT not set in .env');
  console.log('Set it to your Firebase project ID');
  process.exit(1);
}

console.log('🔥 Uploading to Firebase Test Lab...');
console.log(`📱 App: ${APP_PATH}`);
console.log(`🔧 Project: ${GCLOUD_PROJECT}\n`);

try {
  const device = process.argv[3] || 'Pixel7';
  const osVersion = process.argv[4] || '33';
  
  const command = `gcloud firebase test android run \
    --app ${APP_PATH} \
    --project ${GCLOUD_PROJECT} \
    --device model=${device},version=${osVersion},locale=en,orientation=portrait \
    --timeout 5m \
    --results-bucket gs://${GCLOUD_PROJECT}-test-results \
    --results-dir test-results`;

  console.log('Running:', command.replace(/\s+/g, ' '));
  console.log('\n⏳ This will take a few minutes...\n');

  execSync(command, { stdio: 'inherit' });

  console.log('\n✅ Test completed!');
  console.log('📊 View results in Firebase Console');
  console.log(`   https://console.firebase.google.com/project/${GCLOUD_PROJECT}/testlab`);

} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.log('\n💡 Make sure:');
  console.log('   1. gcloud CLI is installed');
  console.log('   2. You are authenticated: gcloud auth login');
  console.log('   3. Firebase Test Lab API is enabled');
  process.exit(1);
}
