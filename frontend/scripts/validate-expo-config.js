#!/usr/bin/env node
/**
 * Expo Config Validation Script
 *
 * This script validates that app.config.js and app.json are in sync and
 * contain all required fields for EAS builds. Run this in CI to catch
 * configuration mismatches before they cause build failures.
 *
 * Usage: node scripts/validate-expo-config.js
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = {
  root: ['owner', 'slug', 'version', 'scheme'],
  ios: ['bundleIdentifier', 'buildNumber'],
  android: ['package', 'versionCode'],
  extra: ['eas.projectId'],
};

const REQUIRED_PLUGINS = [
  'expo-router',
  'expo-splash-screen',
  '@jamsch/expo-speech-recognition',
  'expo-build-properties',
  './plugins/withMetaChrome.js',
  './plugins/withAccessibilityService.js',
];

const REQUIRED_ANDROID_PERMISSIONS = [
  'INTERNET',
  'RECORD_AUDIO',
  'BLUETOOTH',
  'BLUETOOTH_ADMIN',
  'BLUETOOTH_CONNECT',
  'BLUETOOTH_SCAN',
];

const REQUIRED_IOS_INFOPLIST = [
  'NSMicrophoneUsageDescription',
  'NSSpeechRecognitionUsageDescription',
  'NSBluetoothAlwaysUsageDescription',
  'NSBluetoothPeripheralUsageDescription',
];

function loadConfig(filePath) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  if (filePath.endsWith('.json')) {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } else if (filePath.endsWith('.js')) {
    // Clear require cache to get fresh config
    delete require.cache[require.resolve(fullPath)];
    const config = require(fullPath);
    return typeof config === 'function' ? config() : config;
  }
  return null;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function getPluginName(plugin) {
  if (typeof plugin === 'string') return plugin;
  if (Array.isArray(plugin)) return plugin[0];
  return null;
}

function validateConfig(config, source) {
  const errors = [];
  const warnings = [];
  const expo = config.expo || config;

  // Check required root fields
  for (const field of REQUIRED_FIELDS.root) {
    if (!expo[field]) {
      errors.push(`[${source}] Missing required field: ${field}`);
    }
  }

  // Check iOS fields
  for (const field of REQUIRED_FIELDS.ios) {
    if (!expo.ios?.[field]) {
      errors.push(`[${source}] Missing required iOS field: ios.${field}`);
    }
  }

  // Check Android fields
  for (const field of REQUIRED_FIELDS.android) {
    if (!expo.android?.[field]) {
      errors.push(`[${source}] Missing required Android field: android.${field}`);
    }
  }

  // Check extra.eas.projectId
  if (!getNestedValue(expo, 'extra.eas.projectId')) {
    errors.push(`[${source}] Missing required field: extra.eas.projectId`);
  }

  // Check required plugins
  const pluginNames = (expo.plugins || []).map(getPluginName).filter(Boolean);
  for (const requiredPlugin of REQUIRED_PLUGINS) {
    if (!pluginNames.includes(requiredPlugin)) {
      errors.push(`[${source}] Missing required plugin: ${requiredPlugin}`);
    }
  }

  // Check Android permissions
  const androidPermissions = expo.android?.permissions || [];
  for (const permission of REQUIRED_ANDROID_PERMISSIONS) {
    if (!androidPermissions.includes(permission)) {
      warnings.push(`[${source}] Missing Android permission: ${permission}`);
    }
  }

  // Check iOS infoPlist
  const infoPlist = expo.ios?.infoPlist || {};
  for (const key of REQUIRED_IOS_INFOPLIST) {
    if (!infoPlist[key]) {
      warnings.push(`[${source}] Missing iOS infoPlist key: ${key}`);
    }
  }

  return { errors, warnings };
}

function compareConfigs(appJson, appConfigJs) {
  const warnings = [];
  const jsonExpo = appJson.expo || appJson;
  const jsExpo = appConfigJs.expo || appConfigJs;

  // Check if key fields match
  const fieldsToCompare = ['slug', 'scheme', 'ios.bundleIdentifier', 'android.package'];

  for (const field of fieldsToCompare) {
    const jsonValue = getNestedValue(jsonExpo, field);
    const jsValue = getNestedValue(jsExpo, field);

    if (jsonValue && jsValue && jsonValue !== jsValue) {
      warnings.push(`Field mismatch for '${field}': app.json="${jsonValue}" vs app.config.js="${jsValue}"`);
    }
  }

  // Check plugin count mismatch
  const jsonPlugins = (jsonExpo.plugins || []).length;
  const jsPlugins = (jsExpo.plugins || []).length;

  if (Math.abs(jsonPlugins - jsPlugins) > 2) {
    warnings.push(
      `Significant plugin count difference: app.json has ${jsonPlugins} plugins, app.config.js has ${jsPlugins}`
    );
  }

  return warnings;
}

function main() {
  console.log('🔍 Validating Expo configuration...\n');

  let hasErrors = false;
  const allErrors = [];
  const allWarnings = [];

  // Load configs
  const appJson = loadConfig('app.json');
  const appConfigJs = loadConfig('app.config.js');

  if (!appJson && !appConfigJs) {
    console.error('❌ No Expo configuration found (neither app.json nor app.config.js)');
    process.exit(1);
  }

  // Note: app.config.js takes precedence over app.json
  const activeConfig = appConfigJs || appJson;
  const activeSource = appConfigJs ? 'app.config.js' : 'app.json';

  console.log(`📄 Active configuration: ${activeSource}`);
  if (appConfigJs && appJson) {
    console.log('⚠️  Note: app.config.js takes precedence over app.json\n');
  }

  // Validate the active config
  const { errors, warnings } = validateConfig(activeConfig, activeSource);
  allErrors.push(...errors);
  allWarnings.push(...warnings);

  // If both exist, compare them for consistency
  if (appJson && appConfigJs) {
    const comparisonWarnings = compareConfigs(appJson, appConfigJs);
    allWarnings.push(...comparisonWarnings);
  }

  // Report results
  if (allWarnings.length > 0) {
    console.log('⚠️  Warnings:');
    allWarnings.forEach((w) => console.log(`   ${w}`));
    console.log('');
  }

  if (allErrors.length > 0) {
    console.log('❌ Errors:');
    allErrors.forEach((e) => console.log(`   ${e}`));
    console.log('');
    hasErrors = true;
  }

  if (hasErrors) {
    console.log('❌ Configuration validation FAILED');
    console.log('\nTip: Ensure app.config.js includes all required plugins and fields.');
    console.log('     See: https://docs.expo.dev/workflow/configuration/');
    process.exit(1);
  } else {
    console.log('✅ Configuration validation PASSED');
    process.exit(0);
  }
}

main();
