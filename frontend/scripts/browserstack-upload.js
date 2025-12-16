#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

const BROWSERSTACK_USERNAME = process.env.BROWSERSTACK_USERNAME;
const BROWSERSTACK_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY;

if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
  console.error('❌ Error: BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY must be set');
  process.exit(1);
}

async function uploadApp() {
  const appPath = process.argv[2] || path.join(__dirname, '../build/app.apk');
  
  if (!fs.existsSync(appPath)) {
    console.error(`❌ Error: App file not found at ${appPath}`);
    console.log('\n💡 Build your app first:');
    console.log('   For Android: eas build --platform android');
    console.log('   For iOS: eas build --platform ios');
    process.exit(1);
  }

  console.log(`📤 Uploading app: ${appPath}`);

  const form = new FormData();
  form.append('file', fs.createReadStream(appPath));

  const options = {
    hostname: 'api-cloud.browserstack.com',
    path: '/app-automate/upload',
    method: 'POST',
    auth: `${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}`,
    headers: form.getHeaders(),
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          console.log('✅ App uploaded successfully!');
          console.log(`📱 App ID: ${response.app_url}`);
          console.log('\n💡 Set this in your .env file:');
          console.log(`   BROWSERSTACK_APP_ID=${response.app_url}`);
          resolve(response.app_url);
        } else {
          console.error('❌ Upload failed:', data);
          reject(new Error(`Upload failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error uploading app:', error);
      reject(error);
    });

    form.pipe(req);
  });
}

uploadApp().catch((error) => {
  console.error('❌ Failed to upload app:', error.message);
  process.exit(1);
});
