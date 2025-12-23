// Mock React Native before anything else
jest.mock('react-native', () => {
  const React = require('react');
  return {
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: (obj) => obj.ios || obj.default,
    },
    StyleSheet: {
      create: (styles) => styles,
      flatten: (style) => style,
    },
    View: ({ children, ...props }) => React.createElement('View', props, children),
    Text: ({ children, ...props }) => React.createElement('Text', props, children),
    TouchableOpacity: ({ children, ...props }) =>
      React.createElement('TouchableOpacity', props, children),
    ScrollView: ({ children, ...props }) => React.createElement('ScrollView', props, children),
    TextInput: (props) => React.createElement('TextInput', props),
    Switch: (props) => React.createElement('Switch', props),
    Alert: {
      alert: jest.fn(),
    },
    Animated: {
      View: ({ children, ...props }) => React.createElement('View', props, children),
      Text: ({ children, ...props }) => React.createElement('Text', props, children),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({ __getValue: () => 0 })),
      })),
      timing: jest.fn(() => ({ start: jest.fn((cb) => cb && cb()) })),
      spring: jest.fn(() => ({ start: jest.fn((cb) => cb && cb()) })),
      loop: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
      sequence: jest.fn(() => ({ start: jest.fn((cb) => cb && cb()) })),
      parallel: jest.fn(() => ({ start: jest.fn((cb) => cb && cb()) })),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    PixelRatio: {
      get: jest.fn(() => 2),
      getFontScale: jest.fn(() => 1),
      getPixelSizeForLayoutSize: jest.fn((size) => size * 2),
      roundToNearestPixel: jest.fn((size) => size),
    },
    NativeModules: {},
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    })),
    ActivityIndicator: (props) => React.createElement('ActivityIndicator', props),
    FlatList: ({ data, renderItem, ...props }) =>
      React.createElement(
        'FlatList',
        props,
        data?.map((item, index) => renderItem({ item, index }))
      ),
    Modal: ({ children, ...props }) => React.createElement('Modal', props, children),
    Pressable: ({ children, ...props }) => React.createElement('Pressable', props, children),
    Image: (props) => React.createElement('Image', props),
    Keyboard: {
      dismiss: jest.fn(),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListener: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(() => Promise.resolve()),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
    },
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
  }),
  Stack: ({ children }) => children,
  usePathname: () => '/',
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
}));

// Mock @jamsch/expo-speech-recognition
jest.mock('@jamsch/expo-speech-recognition', () => ({
  useSpeechRecognitionEvent: jest.fn(),
  ExpoSpeechRecognitionModule: {
    start: jest.fn(),
    stop: jest.fn(),
    getStateAsync: jest.fn(() => Promise.resolve({ isRecognizing: false })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  },
  SpeechRecognitionModule: {
    start: jest.fn(),
    stop: jest.fn(),
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children, ...props }) => React.createElement('View', props, children),
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
  Swipeable: ({ children }) => children,
  DrawerLayout: ({ children }) => children,
}));

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    WebView: (props) => React.createElement('View', { ...props, testID: 'webview' }),
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
  },
}));

// Mock react-native-ble-plx
jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn(() => ({
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    connectToDevice: jest.fn(),
    destroy: jest.fn(),
    state: jest.fn(() => Promise.resolve('PoweredOn')),
    onStateChange: jest.fn(),
  })),
  State: {
    PoweredOn: 'PoweredOn',
    PoweredOff: 'PoweredOff',
  },
}));

// Mock react-native-siri-shortcut
jest.mock('react-native-siri-shortcut', () => ({
  presentShortcut: jest.fn(() => Promise.resolve()),
  donateShortcut: jest.fn(() => Promise.resolve()),
  clearAllShortcuts: jest.fn(() => Promise.resolve()),
  getShortcuts: jest.fn(() => Promise.resolve([])),
}));

// Mock services
jest.mock('@/services', () => ({
  speechService: {
    initialize: jest.fn(),
    startListening: jest.fn(),
    stopListening: jest.fn(),
  },
  useSpeechStore: jest.fn(() => ({
    isListening: false,
    transcript: '',
    error: null,
  })),
  bluetoothAudioManager: {
    initialize: jest.fn(),
    scanForDevices: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
  useBluetoothStore: jest.fn(() => ({
    isScanning: false,
    connectedDevice: null,
    availableDevices: [],
  })),
  siriShortcutsService: {
    initialize: jest.fn(),
    donateDefaultShortcuts: jest.fn(),
  },
  useSiriShortcutsStore: jest.fn(() => ({
    shortcuts: [],
  })),
  webAgentService: {
    setWebViewRef: jest.fn(),
    typeIntoInput: jest.fn(),
    readResponse: jest.fn(),
  },
}));

// Silence console warnings in tests
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
  log: originalConsole.log,
  info: originalConsole.info,
};

// Set up global test utilities
global.__DEV__ = true;
