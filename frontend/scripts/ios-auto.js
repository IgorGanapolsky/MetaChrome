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
const PRIMARY_PORT = 8081;
const SECONDARY_PORT = 8082;

const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: PROJECT_ROOT, shell: '/bin/bash' });

function findPhysicalDevice() {
  const out = spawnSync('xcrun', ['xctrace', 'list', 'devices'], { encoding: 'utf8' });
  if (out.status !== 0) return null;
  const lines = out.stdout.split('\n');
  for (const line of lines) {
    // Example: "Igor’s iPhone (26.2) (00008150-000165A23C88401C)"
    if (line.includes('iPhone') && !line.toLowerCase().includes('simulator')) {
      const name = line.split('(')[0].trim();
      return name;
    }
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

  const deviceName = findPhysicalDevice();
  if (deviceName) {
    console.log(`📱 Found device: ${deviceName} — running on device`);
    run(`${envPrefix} npx expo run:ios --device "${deviceName}" --configuration Debug ${portFlag}`);
  } else {
    console.log(`🖥️ No device found; running on simulator: ${FALLBACK_SIM}`);
    run(`${envPrefix} npx expo run:ios --simulator "${FALLBACK_SIM}" --configuration Debug ${portFlag}`);
  }
}

main();
