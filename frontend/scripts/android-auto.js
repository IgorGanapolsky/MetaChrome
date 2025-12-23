#!/usr/bin/env node
/**
 * Prefer running on a connected Android device; fallback to default emulator.
 * - Kills stale Metro ports if needed (chooses 8081 unless busy -> 8082).
 * - Runs `expo run:android` targeting the device if found; otherwise emulator.
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PRIMARY_PORT = 8081;
const SECONDARY_PORT = 8082;
// Prefer a known local AVD; override with ANDROID_AVD if desired.
const FALLBACK_EMULATOR = process.env.ANDROID_AVD || 'Pixel_9_Pro_XL';

const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: PROJECT_ROOT, shell: '/bin/bash' });

function listAdbDevices() {
  const out = spawnSync('adb', ['devices'], { encoding: 'utf8' });
  if (out.status !== 0) return [];
  return out.stdout
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split('\t'))
    .filter((parts) => parts.length === 2 && parts[1] === 'device')
    .map((parts) => parts[0]);
}

function choosePort() {
  try {
    const res = spawnSync('lsof', ['-i', `:${PRIMARY_PORT}`], { encoding: 'utf8' });
    if (res.status === 0 && res.stdout.trim().length > 0) return SECONDARY_PORT;
  } catch (_) {}
  return PRIMARY_PORT;
}

function startEmulatorIfNeeded() {
  // If a device is already present, skip
  if (listAdbDevices().length > 0) return;
  // Try to start the AVD
  try {
    console.log(`🖥️ Starting Android emulator: ${FALLBACK_EMULATOR}`);
    spawnSync('nohup', ['emulator', `-avd`, FALLBACK_EMULATOR], {
      stdio: 'ignore',
      detached: true,
    });
    // Wait up to ~40s for device to appear
    for (let i = 0; i < 40; i++) {
      if (listAdbDevices().length > 0) return;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    }
  } catch (e) {
    console.warn('Could not start emulator automatically:', e.message);
  }
}

function main() {
  startEmulatorIfNeeded();
  const port = choosePort();
  const envPrefix = `EXPO_NO_INTERACTIVE=1 EXPO_DEV_SERVER_PORT=${port}`;
  const portFlag = `--port ${port}`;

  const devices = listAdbDevices();
  if (devices.length > 0) {
    // Expo prefers the AVD name (e.g., Pixel_9_Pro_XL) over the emulator serial (emulator-5554).
    const serial = devices[0];
    const target = serial.startsWith('emulator-') ? FALLBACK_EMULATOR : serial;
    console.log(`🤖 Found Android device: ${serial} — running on ${target}`);
    run(`${envPrefix} npx expo run:android --device ${target} ${portFlag}`);
  } else {
    console.log(`🖥️ No Android device found; trying emulator (${FALLBACK_EMULATOR})`);
    run(`${envPrefix} npx expo run:android --device ${FALLBACK_EMULATOR} ${portFlag}`);
  }
}

main();
