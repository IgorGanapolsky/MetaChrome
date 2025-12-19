// Dynamic app config for production builds
module.exports = {
  expo: {
    name: process.env.APP_NAME || 'MetaChrome',
    slug: 'metachrome',
    version: process.env.APP_VERSION || '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'metachrome',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    owner: 'igorganapolsky',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.metachrome.app',
      buildNumber: process.env.IOS_BUILD_NUMBER || '1',
      infoPlist: {
        NSMicrophoneUsageDescription: 'MetaChrome needs microphone access for voice commands',
        NSSpeechRecognitionUsageDescription:
          'MetaChrome uses speech recognition for hands-free browsing',
        NSBluetoothAlwaysUsageDescription:
          'MetaChrome connects to Meta Ray-Ban glasses via Bluetooth',
        NSBluetoothPeripheralUsageDescription:
          'MetaChrome connects to Meta Ray-Ban glasses via Bluetooth',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.metachrome.app',
      versionCode: parseInt(process.env.ANDROID_VERSION_CODE || '1', 10),
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      edgeToEdgeEnabled: true,
      statusBar: {
        backgroundColor: '#000000',
      },
      permissions: [
        'INTERNET',
        'RECORD_AUDIO',
        'BLUETOOTH',
        'BLUETOOTH_ADMIN',
        'BLUETOOTH_CONNECT',
        'BLUETOOTH_SCAN',
        'ACCESS_FINE_LOCATION',
        'SYSTEM_ALERT_WINDOW',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#000',
        },
      ],
      'expo-build-properties',
      './plugins/withMetaChrome.js',
      './plugins/withAccessibilityService.js',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'e85c8a8a-0436-41d8-aad1-f6872a6527bd',
      },
    },
  },
};
