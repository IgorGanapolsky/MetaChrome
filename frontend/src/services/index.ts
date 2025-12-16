// Bluetooth Audio
export {
  bluetoothAudioManager,
  useBluetoothStore,
  type BluetoothDevice,
  type BluetoothAudioState,
} from './bluetooth/BluetoothAudioManager';

// Speech Recognition
export {
  speechService,
  useSpeechStore,
  useSpeechRecognition,
  type SpeechState,
} from './speech/SpeechRecognitionService';

// Web Agent (for Claude, Cursor, ChatGPT interaction)
export {
  webAgentService,
  WebAgentCommands,
  WEB_AGENTS,
  type WebAgentConfig,
} from './webagent/WebAgentService';

// iOS Siri Shortcuts
export {
  siriShortcutsService,
  useSiriShortcutsStore,
  SHORTCUT_ACTIVITIES,
  type SiriShortcut,
  type SiriShortcutsState,
} from './siri/SiriShortcutsService';

// Android Google App Actions
export {
  googleAppActionsService,
  useAppActionsStore,
  APP_ACTION_INTENTS,
  DEEP_LINKS,
  type AppActionState,
} from './appactions/GoogleAppActionsService';

// Android Accessibility Service (for Chrome/app control)
export {
  androidAccessibilityService,
  useAndroidAccessibility,
  useAccessibilityStore,
  type AccessibilityNode,
  type AccessibilityState,
} from './accessibility';
