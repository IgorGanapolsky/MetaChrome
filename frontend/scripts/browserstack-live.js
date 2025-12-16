#!/usr/bin/env node

const https = require('https');
const readline = require('readline');

const BROWSERSTACK_USERNAME = process.env.BROWSERSTACK_USERNAME;
const BROWSERSTACK_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY;
const BROWSERSTACK_APP_ID = process.env.BROWSERSTACK_APP_ID;

if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
  console.error('❌ Error: BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY must be set');
  process.exit(1);
}

if (!BROWSERSTACK_APP_ID) {
  console.error('❌ Error: BROWSERSTACK_APP_ID must be set');
  console.log('💡 Upload your app first: yarn browserstack:upload');
  process.exit(1);
}

function createAppLiveSession() {
  const device = process.argv[2] || 'iPhone 14 Pro';
  const osVersion = process.argv[3] || '16';

  const postData = JSON.stringify({
    app: BROWSERSTACK_APP_ID,
    device: device,
    os_version: osVersion,
  });

  const options = {
    hostname: 'api-cloud.browserstack.com',
    path: '/app-live/upload',
    method: 'POST',
    auth: `${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}`,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (e) {
            resolve({ app_url: data, device, os_version: osVersion });
          }
        } else {
          reject(new Error(`Failed to create session (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 Creating BrowserStack App Live session...');
    const session = await createAppLiveSession();
    
    console.log('\n✅ Session created!');
    console.log(`📱 Device: ${session.device || 'Default'}`);
    console.log(`🔗 Session URL: ${session.app_url || session.browser_url}`);
    
    if (session.app_url) {
      console.log('\n💡 Open this URL in your browser to interact with your app:');
      console.log(`   ${session.app_url}`);
    }
    
    console.log('\n⌨️  Press Ctrl+C to end the session');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.on('SIGINT', () => {
      console.log('\n👋 Session ended');
      rl.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
