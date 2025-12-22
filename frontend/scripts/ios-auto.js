#!/usr/bin/env node
/**
 * Prefer running on a connected iPhone; fallback to simulator.
 * - Kills stale xcodebuild processes to avoid locked build DBs.
 * - Clears DerivedData for this app.
 * - Runs `expo run:ios` targeting the device if found; otherwise a simulator.
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const DERIVED_DATA_GLOB = '~/Library/Developer/Xcode/DerivedData/MetaChrome-*';
const FALLBACK_SIM = 'iPhone 16e'; // adjust if needed
// Prefer 8082 because 8081 is often occupied by other RN projects.
const PRIMARY_PORT = 8082;
const SECONDARY_PORT = 8081;

const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: PROJECT_ROOT, shell: '/bin/bash' });
const runSafe = (cmd) => {
  try {
    return run(cmd);
  } catch (err) {
    return err;
  }
};

function normalizeQuotes(str) {
  return str.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
}

function findPhysicalDevice() {
  const list = spawnSync('xcrun', ['xcdevice', 'list'], { encoding: 'utf8' });
  if (list.status !== 0) return null;
  let devices;
  try {
    devices = JSON.parse(list.stdout);
  } catch (_) {
    return null;
  }
  const phone = devices.find(
    (d) =>
      d.platform === 'com.apple.platform.iphoneos' &&
      d.available === true &&
      d.interface === 'usb'
  );
  if (phone) {
    return { name: normalizeQuotes(phone.name), udid: phone.identifier };
  }
  // Fallback: any available iPhoneOS (even Wi‑Fi)
  const anyPhone = devices.find(
    (d) => d.platform === 'com.apple.platform.iphoneos' && d.available === true
  );
  if (anyPhone) {
    return { name: normalizeQuotes(anyPhone.name), udid: anyPhone.identifier };
  }
  return null;
}

function choosePort() {
  try {
    const res = spawnSync('lsof', ['-i', `:${PRIMARY_PORT}`], { encoding: 'utf8' });
    if (res.status === 0 && res.stdout.trim().length > 0) {
      return SECONDARY_PORT;
    }
  } catch (_) {}
  return PRIMARY_PORT;
}

function main() {
  try {
    // Kill stale builds
    spawnSync('pkill', ['-9', 'xcodebuild'], { stdio: 'ignore' });
  } catch (_) {}
  try {
    run(`rm -rf ${DERIVED_DATA_GLOB}`);
  } catch (_) {}

  const port = choosePort();
  const envPrefix = `EXPO_NO_INTERACTIVE=1 EXPO_DEV_SERVER_PORT=${port}`;
  const portFlag = `--port ${port}`;

  const device = findPhysicalDevice();
  if (device && device.udid) {
    console.log(`📱 Found device: ${device.name} — running on device via UDID ${device.udid}`);
    const err = runSafe(
      `${envPrefix} npx expo run:ios --device "${device.udid}" --configuration Debug ${portFlag}`
    );
    if (err instanceof Error || err?.status) {
      console.warn('Device run failed; falling back to simulator.');
      console.warn(err?.message || err);
      console.log(`🖥️ Running on simulator: ${FALLBACK_SIM}`);
      run(`${envPrefix} npx expo run:ios --device "${FALLBACK_SIM}" --configuration Debug ${portFlag}`);
    }
  } else if (device) {
    console.log(`📱 Found device: ${device.name} — running on device`);
    const err = runSafe(
      `${envPrefix} npx expo run:ios --device "${device.name}" --configuration Debug ${portFlag}`
    );
    if (err instanceof Error || err?.status) {
      console.warn('Device run failed; falling back to simulator.');
      console.warn(err?.message || err);
      console.log(`🖥️ Running on simulator: ${FALLBACK_SIM}`);
      run(`${envPrefix} npx expo run:ios --device "${FALLBACK_SIM}" --configuration Debug ${portFlag}`);
    }
  } else {
    console.log(`🖥️ No device found; running on simulator: ${FALLBACK_SIM}`);
    run(`${envPrefix} npx expo run:ios --device "${FALLBACK_SIM}" --configuration Debug ${portFlag}`);
  }
}

main();
