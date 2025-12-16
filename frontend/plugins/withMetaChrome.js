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

const { withAndroidManifest, withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

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
      const exists = manifest['uses-permission'].some(
        (p) => p.$['android:name'] === permission
      );
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
    const mainActivity = application.activity?.find(
      (a) => a.$['android:name'] === '.MainActivity'
    );

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
        data: [
          { $: { 'android:scheme': 'metachrome' } },
        ],
      };

      const hasDeepLink = mainActivity['intent-filter'].some(
        (f) => f.data?.some((d) => d.$['android:scheme'] === 'metachrome')
      );

      if (!hasDeepLink) {
        mainActivity['intent-filter'].push(deepLinkFilter);
      }

      // Add meta-data for shortcuts
      if (!mainActivity['meta-data']) {
        mainActivity['meta-data'] = [];
      }

      const hasShortcuts = mainActivity['meta-data'].some(
        (m) => m.$['android:name'] === 'android.app.shortcuts'
      );

      if (!hasShortcuts) {
        mainActivity['meta-data'].push({
          $: {
            'android:name': 'android.app.shortcuts',
            'android:resource': '@xml/shortcuts',
          },
        });
      }
    }

    return config;
  });
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
    config.modResults.NSSiriUsageDescription =
      'MetaChrome uses Siri to allow you to create custom voice shortcuts for hands-free browsing.';

    // URL schemes for deep linking
    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }

    const hasScheme = config.modResults.CFBundleURLTypes.some(
      (type) => type.CFBundleURLSchemes?.includes('metachrome')
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
    config.modResults['com.apple.developer.siri'] = true;

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
  return config;
};
