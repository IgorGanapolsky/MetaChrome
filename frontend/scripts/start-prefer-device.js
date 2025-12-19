#!/usr/bin/env node
/**
 * Starts Expo/Metro preferring a connected physical device (iOS first, then Android).
 * Falls back to default Expo behavior if no device is found.
 *
 * Usage:
 *   yarn start
 *   yarn start:rozenite (WITH_ROZENITE=true env handled by package.json)
 *
 * Env overrides:
 *   USE_EXPO_GO=1 -> run plain `expo start` (keep old behavior)
 */

const { spawn, execSync } = require('child_process');
const os = require('os');

const isCI = process.env.CI === 'true' || process.env.CI === '1';
const useExpoGo = process.env.USE_EXPO_GO === '1';
const preferredIosUdid = process.env.PREFERRED_IOS_UDID;
const preferredIosName = process.env.PREFERRED_IOS_NAME;
const passthroughArgs = process.argv.slice(2);

function log(msg) {
  console.log(`[start-prefer-device] ${msg}`);
}

function chooseIosDevice() {
  // Manual override takes priority
  if (preferredIosUdid || preferredIosName) {
    return { name: preferredIosName, udid: preferredIosUdid, flag: '--ios' };
  }

  try {
    const raw = execSync('xcrun xctrace list devices', { encoding: 'utf8' });
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);

    // Prefer an iPhone-like device line with a UDID (physical) and not a Simulator.
    const physical = lines.find((l) => {
      if (/Simulator/i.test(l)) return false;
      if (!/iPhone|iPad|iPod/i.test(l)) return false;
      return /\(([0-9A-Fa-f-]{10,})\)$/.test(l);
    });

    if (physical) {
      // Example: "Igor’s iPhone (26.2) (00008150-000165A23C88401C)"
      const name = physical.split(' (')[0];
      const udidMatch = physical.match(/\(([0-9A-Fa-f-]{10,})\)$/);
      const udid = udidMatch ? udidMatch[1] : undefined;
      return { name, udid, flag: '--ios' };
    }
  } catch (error) {
    // Swallow; fallback later
  }
  return null;
}

function chooseAndroidDevice() {
  try {
    const raw = execSync('adb devices -l', { encoding: 'utf8' });
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    const deviceLine = lines.find((l) => l.endsWith('device') && !l.includes('emulator'));
    if (deviceLine) {
      const serial = deviceLine.split(/\s+/)[0];
      return { serial, flag: '--android' };
    }
  } catch (error) {
    // adb missing or no devices; fallback later
  }
  return null;
}

function buildCommand(target) {
  if (useExpoGo) {
    return { cmd: 'npx', args: ['expo', 'start'] };
  }

  // For dev-client we don't pass --device because expo start doesn't support it.
  // We avoid auto-opening anything and let the user open the dev client on the device.
  const args = ['expo', 'start', '--dev-client'];

  if (passthroughArgs.length) {
    args.push(...passthroughArgs);
  }
  return { cmd: 'npx', args };
}

function main() {
  if (isCI) {
    log('CI detected; running default expo start to avoid device-specific logic.');
    spawn('npx', ['expo', 'start', '--non-interactive'], {
      stdio: 'inherit',
      env: process.env,
    });
    return;
  }

  const isMac = os.platform() === 'darwin';
  const targetIos = isMac ? chooseIosDevice() : null;
  const targetAndroid = chooseAndroidDevice();
  const target = targetIos || targetAndroid;

  if (target) {
    log(
      `Found physical ${target.flag === '--ios' ? 'iOS' : 'Android'} device ${
        target.udid || target.name || target.serial
      }; launching Metro targeting it.`,
    );

    // Prevent Expo CLI from auto-opening a simulator when we have a real device.
    if (isMac && target.flag === '--ios') {
      try {
        execSync('killall Simulator', { stdio: 'ignore' });
      } catch {
        // ignore if Simulator not running
      }
    }
  } else {
    log('No physical device detected; falling back to default Expo behavior (simulator/emulator).');
  }

  // Pick an available port to avoid non-interactive prompts
  const resolvePort = () => {
    const base = Number(process.env.RCT_METRO_PORT || process.env.EXPO_DEV_SERVER_PORT || 8081);
    for (let p = base; p < base + 10; p++) {
      try {
        execSync(`lsof -i :${p}`, { stdio: 'ignore' });
        // in use; continue
      } catch {
        return p;
      }
    }
    return base;
  };

  const port = resolvePort();
  const { cmd, args } = buildCommand(target);
  log(`Command: ${cmd} ${args.join(' ')}`);

  const child = spawn(cmd, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: '1', // prevent expo CLI from opening simulators/devices
      RCT_METRO_PORT: String(port),
      EXPO_DEV_SERVER_PORT: String(port),
      EXPO_NO_SIMULATOR: target && target.flag === '--ios' ? '1' : process.env.EXPO_NO_SIMULATOR,
      EXPO_DEV_CLIENT: target ? '1' : process.env.EXPO_DEV_CLIENT,
      EXPO_NO_DEVICES: target && target.flag === '--ios' ? '1' : process.env.EXPO_NO_DEVICES,
      EXPO_NO_INTERACTIVE: '1',
    },
  });

  child.on('exit', (code) => process.exit(code || 0));
}

main();
