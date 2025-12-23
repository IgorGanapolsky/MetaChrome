#!/usr/bin/env node
/**
 * Preflight Check Script
 *
 * Comprehensive validation suite that runs before commits and CI builds.
 * Ensures operational reliability by catching configuration issues early.
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - Critical error (blocks commit/build)
 *   2 - Warnings only (allows commit with notice)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ERRORS = [];
const WARNINGS = [];

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(color, prefix, message) {
  console.log(`${color}${prefix}${RESET} ${message}`);
}

function error(msg) {
  ERRORS.push(msg);
  log(RED, '✗', msg);
}

function warn(msg) {
  WARNINGS.push(msg);
  log(YELLOW, '⚠', msg);
}

function pass(msg) {
  log(GREEN, '✓', msg);
}

function info(msg) {
  log(BLUE, '→', msg);
}

// ============= CHECK FUNCTIONS =============

function checkRequiredFiles() {
  info('Checking required files...');

  const required = ['app.config.js', 'app.json', 'package.json', 'tsconfig.json'];

  let allExist = true;
  for (const file of required) {
    const filePath = path.join(ROOT, file);
    if (!fs.existsSync(filePath)) {
      error(`Missing required file: ${file}`);
      allExist = false;
    }
  }

  if (allExist) {
    pass('All required files present');
  }
}

function checkAppConfig() {
  info('Validating app.config.js...');

  try {
    const configPath = path.join(ROOT, 'app.config.js');
    delete require.cache[require.resolve(configPath)];
    const config = require(configPath);
    const expo = config.expo || config;

    // Required fields
    const requiredFields = ['slug', 'version', 'owner'];
    for (const field of requiredFields) {
      if (!expo[field]) {
        error(`app.config.js missing required field: ${field}`);
      }
    }

    // Check owner matches Expo account
    if (expo.owner && expo.owner !== 'igorganapolsky') {
      warn(`Owner mismatch: expected 'igorganapolsky', got '${expo.owner}'`);
    }

    // Check projectId
    const projectId = expo.extra?.eas?.projectId;
    if (!projectId) {
      error('app.config.js missing extra.eas.projectId');
    }

    // Check iOS config
    if (!expo.ios?.bundleIdentifier) {
      error('app.config.js missing ios.bundleIdentifier');
    }

    // Check Android config
    if (!expo.android?.package) {
      error('app.config.js missing android.package');
    }

    // Check plugins
    const plugins = expo.plugins || [];
    const pluginNames = plugins.map((p) => (typeof p === 'string' ? p : p[0]));

    const requiredPlugins = ['expo-router'];
    for (const plugin of requiredPlugins) {
      if (!pluginNames.includes(plugin)) {
        error(`app.config.js missing required plugin: ${plugin}`);
      }
    }

    if (ERRORS.length === 0) {
      pass('app.config.js is valid');
    }
  } catch (e) {
    error(`Failed to load app.config.js: ${e.message}`);
  }
}

function checkPackageJson() {
  info('Validating package.json...');

  try {
    const pkgPath = path.join(ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    // Check required scripts
    const requiredScripts = ['start', 'lint', 'test', 'typecheck'];
    for (const script of requiredScripts) {
      if (!pkg.scripts?.[script]) {
        warn(`package.json missing recommended script: ${script}`);
      }
    }

    // Check critical dependencies
    const criticalDeps = ['expo', 'react', 'react-native'];
    for (const dep of criticalDeps) {
      if (!pkg.dependencies?.[dep]) {
        error(`package.json missing critical dependency: ${dep}`);
      }
    }

    pass('package.json is valid');
  } catch (e) {
    error(`Failed to load package.json: ${e.message}`);
  }
}

function checkGitStatus() {
  info('Checking git status...');

  try {
    // Check for uncommitted native folders
    const gitStatus = execSync('git status --porcelain', {
      cwd: ROOT,
      encoding: 'utf8',
    });

    const lines = gitStatus.split('\n').filter(Boolean);
    const nativeFolders = lines.filter((l) => l.includes('android/') || l.includes('ios/'));

    if (nativeFolders.length > 0) {
      warn('Native folders (android/ios) detected in git status - ensure they are in .gitignore');
    }

    // Check .gitignore has native folders
    const gitignorePath = path.join(ROOT, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignore.includes('android/') || !gitignore.includes('ios/')) {
        warn('.gitignore should include android/ and ios/ folders');
      }
    }

    pass('Git status check complete');
  } catch (e) {
    // Git might not be available
    warn(`Could not check git status: ${e.message}`);
  }
}

function checkTypeScript() {
  info('Running TypeScript check...');

  try {
    execSync('npx tsc --noEmit', { cwd: ROOT, stdio: 'pipe' });
    pass('TypeScript compilation successful');
  } catch (e) {
    error('TypeScript compilation failed - run "yarn typecheck" for details');
  }
}

function checkExpoDoctor() {
  info('Running Expo doctor...');

  try {
    const result = execSync('npx expo-doctor@latest', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });

    if (result.includes('error') || result.includes('Error')) {
      warn('Expo doctor found issues - run "npx expo-doctor" for details');
    } else {
      pass('Expo doctor check passed');
    }
  } catch (e) {
    // expo-doctor might not be available or might fail
    warn('Could not run expo-doctor');
  }
}

function checkConfigSync() {
  info('Checking app.json and app.config.js sync...');

  try {
    const appJsonPath = path.join(ROOT, 'app.json');
    const appConfigPath = path.join(ROOT, 'app.config.js');

    if (!fs.existsSync(appJsonPath) || !fs.existsSync(appConfigPath)) {
      return;
    }

    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    delete require.cache[require.resolve(appConfigPath)];
    const appConfig = require(appConfigPath);

    const jsonExpo = appJson.expo || appJson;
    const configExpo = appConfig.expo || appConfig;

    // Check critical fields match
    const fieldsToCheck = ['slug', 'ios.bundleIdentifier', 'android.package'];

    for (const field of fieldsToCheck) {
      const jsonVal = field.split('.').reduce((o, k) => o?.[k], jsonExpo);
      const configVal = field.split('.').reduce((o, k) => o?.[k], configExpo);

      if (jsonVal && configVal && jsonVal !== configVal) {
        error(
          `Config mismatch for ${field}: app.json="${jsonVal}" vs app.config.js="${configVal}"`
        );
      }
    }

    // Warn about plugin count mismatch
    const jsonPlugins = (jsonExpo.plugins || []).length;
    const configPlugins = (configExpo.plugins || []).length;

    if (Math.abs(jsonPlugins - configPlugins) > 2) {
      warn(
        `Plugin count differs significantly: app.json has ${jsonPlugins}, app.config.js has ${configPlugins}`
      );
    }

    pass('Config sync check complete');
  } catch (e) {
    warn(`Could not check config sync: ${e.message}`);
  }
}

// ============= MAIN =============

async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('  PREFLIGHT CHECK - Operational Reliability Suite');
  console.log('='.repeat(50) + '\n');

  // Run all checks
  checkRequiredFiles();
  checkAppConfig();
  // checkEasJson(); // Removed
  checkPackageJson();
  checkGitStatus();
  checkConfigSync();

  // Optional deeper checks (can be slow)
  if (process.argv.includes('--full')) {
    checkTypeScript();
    checkExpoDoctor();
  }

  // Summary
  console.log('\n' + '='.repeat(50));

  if (ERRORS.length > 0) {
    console.log(`${RED}PREFLIGHT FAILED${RESET}`);
    console.log(`${RED}${ERRORS.length} error(s), ${WARNINGS.length} warning(s)${RESET}\n`);
    console.log('Errors must be fixed before proceeding:\n');
    ERRORS.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    console.log('');
    process.exit(1);
  } else if (WARNINGS.length > 0) {
    console.log(`${YELLOW}PREFLIGHT PASSED WITH WARNINGS${RESET}`);
    console.log(`${WARNINGS.length} warning(s)\n`);
    process.exit(0);
  } else {
    console.log(`${GREEN}PREFLIGHT PASSED${RESET}`);
    console.log('All checks passed successfully!\n');
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('Preflight check crashed:', e);
  process.exit(1);
});
