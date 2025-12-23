/**
 * Expo Config Plugin for MetaChrome
 *
 * This plugin configures native iOS and Android settings for:
 * - Bluetooth permissions (for Meta Ray-Ban glasses)
 * - Microphone permissions (for voice commands)
 * - Siri Shortcuts (iOS)
 * - App Actions (Android)
 * - Deep linking
 */

const {
  withAndroidManifest,
  withInfoPlist,
  withEntitlementsPlist,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Configure Android manifest for Bluetooth and App Actions
 */
function withAndroidConfig(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // Add Bluetooth permissions
    const permissions = [
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
    ];

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    permissions.forEach((permission) => {
      const exists = manifest['uses-permission'].some((p) => p.$['android:name'] === permission);
      if (!exists) {
        manifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    });

    // Add Bluetooth feature
    if (!manifest['uses-feature']) {
      manifest['uses-feature'] = [];
    }

    const bluetoothFeature = manifest['uses-feature'].find(
      (f) => f.$['android:name'] === 'android.hardware.bluetooth'
    );
    if (!bluetoothFeature) {
      manifest['uses-feature'].push({
        $: {
          'android:name': 'android.hardware.bluetooth',
          'android:required': 'false',
        },
      });
    }

    // Add deep link intent filter to main activity
    const application = manifest.application[0];
    const mainActivity = application.activity?.find((a) => a.$['android:name'] === '.MainActivity');

    if (mainActivity) {
      if (!mainActivity['intent-filter']) {
        mainActivity['intent-filter'] = [];
      }

      // Add deep link intent filter
      const deepLinkFilter = {
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        category: [
          { $: { 'android:name': 'android.intent.category.DEFAULT' } },
          { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
        ],
        data: [{ $: { 'android:scheme': 'metachrome' } }],
      };

      const hasDeepLink = mainActivity['intent-filter'].some((f) =>
        f.data?.some((d) => d.$['android:scheme'] === 'metachrome')
      );

      if (!hasDeepLink) {
        mainActivity['intent-filter'].push(deepLinkFilter);
      }
    }

    return config;
  });
}

/**
 * Create shortcuts.xml for Android App Actions
 */
function withAndroidShortcutsXml(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');

      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      const shortcutsXml = `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
    <shortcut
        android:shortcutId="open_browser"
        android:enabled="true"
        android:icon="@mipmap/ic_launcher"
        android:shortcutShortLabel="@string/shortcut_short_label_browser"
        android:shortcutLongLabel="@string/shortcut_long_label_browser">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="com.metachrome.app"
            android:targetClass="com.metachrome.app.MainActivity"
            android:data="metachrome://browser" />
    </shortcut>
</shortcuts>`;

      fs.writeFileSync(path.join(xmlDir, 'shortcuts.xml'), shortcutsXml);
      return config;
    },
  ]);
}

/**
 * Add string resources for shortcuts
 */
function withAndroidStrings(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const stringsPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'values',
        'strings.xml'
      );

      if (fs.existsSync(stringsPath)) {
        let stringsContent = fs.readFileSync(stringsPath, 'utf8');

        if (!stringsContent.includes('shortcut_short_label_browser')) {
          const newStrings = `
    <string name="shortcut_short_label_browser">Browser</string>
    <string name="shortcut_long_label_browser">Open MetaChrome Browser</string>
`;
          stringsContent = stringsContent.replace('</resources>', `${newStrings}</resources>`);
          fs.writeFileSync(stringsPath, stringsContent);
        }
      }
      return config;
    },
  ]);
}

/**
 * Configure iOS Info.plist for Bluetooth and Siri
 */
function withIOSConfig(config) {
  return withInfoPlist(config, (config) => {
    // Bluetooth usage description
    config.modResults.NSBluetoothAlwaysUsageDescription =
      'MetaChrome uses Bluetooth to connect to your Meta Ray-Ban glasses for hands-free voice control.';
    config.modResults.NSBluetoothPeripheralUsageDescription =
      'MetaChrome uses Bluetooth to connect to your Meta Ray-Ban glasses for hands-free voice control.';

    // Microphone usage description
    config.modResults.NSMicrophoneUsageDescription =
      'MetaChrome uses the microphone for voice commands and speech recognition.';

    // Speech recognition usage description
    config.modResults.NSSpeechRecognitionUsageDescription =
      'MetaChrome uses speech recognition to understand your voice commands.';

    // Siri usage description
    // config.modResults.NSSiriUsageDescription =
    //   'MetaChrome uses Siri to allow you to create custom voice shortcuts for hands-free browsing.';

    // URL schemes for deep linking
    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }

    const hasScheme = config.modResults.CFBundleURLTypes.some((type) =>
      type.CFBundleURLSchemes?.includes('metachrome')
    );

    if (!hasScheme) {
      config.modResults.CFBundleURLTypes.push({
        CFBundleURLSchemes: ['metachrome'],
        CFBundleURLName: 'com.metachrome',
      });
    }

    // Background modes for Bluetooth
    if (!config.modResults.UIBackgroundModes) {
      config.modResults.UIBackgroundModes = [];
    }

    const backgroundModes = ['bluetooth-central', 'audio'];
    backgroundModes.forEach((mode) => {
      if (!config.modResults.UIBackgroundModes.includes(mode)) {
        config.modResults.UIBackgroundModes.push(mode);
      }
    });

    return config;
  });
}

/**
 * Configure iOS entitlements for Siri
 */
function withIOSEntitlements(config) {
  return withEntitlementsPlist(config, (config) => {
    // Enable Siri
    // config.modResults['com.apple.developer.siri'] = true;

    return config;
  });
}

/**
 * Main plugin function
 */
module.exports = function withMetaChrome(config) {
  config = withAndroidConfig(config);
  config = withIOSConfig(config);
  config = withIOSEntitlements(config);
  // Add new ones
  config = withAndroidShortcutsXml(config);
  config = withAndroidStrings(config);
  return config;
};
