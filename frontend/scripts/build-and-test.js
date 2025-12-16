#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

console.log('🚀 Build and Test Workflow');
console.log('==========================\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  try {
    console.log('Choose platform:');
    console.log('1. Android (APK)');
    console.log('2. iOS (IPA)');
    const platform = await ask('\nEnter choice (1 or 2): ');

    if (platform === '1') {
      console.log('\n📱 Building Android APK...');
      const build = spawn('eas', ['build', '--platform', 'android', '--profile', 'preview'], {
        stdio: 'inherit',
        shell: true,
      });

      build.on('close', async (code) => {
        if (code === 0) {
          console.log('\n✅ Build complete!');
          const testChoice = await ask(
            '\nTest on:\n1. BrowserStack\n2. Firebase Test Lab\nEnter choice: '
          );

          if (testChoice === '1') {
            const appPath = await ask('Enter path to APK: ');
            console.log('\n📤 Uploading to BrowserStack...');
            spawn('yarn', ['browserstack:upload', appPath], { stdio: 'inherit', shell: true });
          } else if (testChoice === '2') {
            const appPath = await ask('Enter path to APK: ');
            console.log('\n🔥 Uploading to Firebase Test Lab...');
            spawn('yarn', ['firebase:test', appPath], { stdio: 'inherit', shell: true });
          }
        }
        rl.close();
      });
    } else if (platform === '2') {
      console.log('\n📱 Building iOS IPA...');
      const build = spawn('eas', ['build', '--platform', 'ios', '--profile', 'preview'], {
        stdio: 'inherit',
        shell: true,
      });

      build.on('close', async (code) => {
        if (code === 0) {
          console.log('\n✅ Build complete!');
          const appPath = await ask('Enter path to IPA: ');
          console.log('\n📤 Uploading to BrowserStack...');
          spawn('yarn', ['browserstack:upload', appPath], { stdio: 'inherit', shell: true });
        }
        rl.close();
      });
    } else {
      console.log('Invalid choice');
      rl.close();
    }
  } catch (error) {
    console.error('Error:', error);
    rl.close();
  }
}

main();
