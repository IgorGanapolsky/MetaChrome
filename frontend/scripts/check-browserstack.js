#!/usr/bin/env node

require('dotenv').config({ path: '.env' });

const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
const appId = process.env.BROWSERSTACK_APP_ID;

console.log('🔍 Checking BrowserStack configuration...\n');

if (!username || username === 'your_username') {
  console.log('❌ BROWSERSTACK_USERNAME not set');
  console.log('   Get it from: https://www.browserstack.com/accounts/settings\n');
} else {
  console.log(`✅ BROWSERSTACK_USERNAME: ${username}`);
}

if (!accessKey || accessKey === 'your_access_key') {
  console.log('❌ BROWSERSTACK_ACCESS_KEY not set');
  console.log('   Get it from: https://www.browserstack.com/accounts/settings\n');
} else {
  console.log(`✅ BROWSERSTACK_ACCESS_KEY: ${accessKey.substring(0, 10)}...`);
}

if (!appId || appId === 'bs://your-app-id-here') {
  console.log('❌ BROWSERSTACK_APP_ID not set');
  console.log('   Upload your app first: yarn browserstack:upload <path-to-apk>\n');
} else {
  console.log(`✅ BROWSERSTACK_APP_ID: ${appId}`);
}

if (
  username &&
  accessKey &&
  appId &&
  username !== 'your_username' &&
  accessKey !== 'your_access_key' &&
  appId !== 'bs://your-app-id-here'
) {
  console.log('\n✅ All BrowserStack config is set!');
  console.log('   Run: yarn browserstack:live\n');
} else {
  console.log('\n💡 Quick start:');
  console.log('   1. Set credentials in .env file');
  console.log('   2. Build app: eas build --platform android');
  console.log('   3. Upload: yarn browserstack:upload <path-to-apk>');
  console.log('   4. Launch: yarn browserstack:live\n');
}
