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
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.metachrome.app',
      buildNumber: process.env.IOS_BUILD_NUMBER || '1',
      infoPlist: {
        NSMicrophoneUsageDescription:
          'MetaChrome needs microphone access for voice commands with Meta Ray-Ban glasses.',
        NSSpeechRecognitionUsageDescription:
          'MetaChrome uses speech recognition for voice commands.',
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
      permissions: ['INTERNET', 'RECORD_AUDIO'],
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
      // Sentry plugin - configure with DSN
      // [
      //   'sentry-expo',
      //   {
      //     organization: 'your-org',
      //     project: 'metachrome',
      //     authToken: process.env.SENTRY_AUTH_TOKEN,
      //   },
      // ],
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
