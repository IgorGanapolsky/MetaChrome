/**
 * GoogleAppActionsService
 *
 * Handles Google Assistant App Actions integration for Android.
 * App Actions allow users to say "Hey Google, [action] on MetaChrome"
 *
 * Note: This service manages the JavaScript side. The actual App Actions
 * are defined in android/app/src/main/res/xml/shortcuts.xml
 */

import { Platform, Linking } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Built-in Intent (BII) types supported by MetaChrome
export const APP_ACTION_INTENTS = {
  // Open app feature
  OPEN_APP_FEATURE: 'actions.intent.OPEN_APP_FEATURE',
  // Search
  SEARCH: 'actions.intent.SEARCH',
  // Get content
  GET_THING: 'actions.intent.GET_THING',
} as const;

// Deep link schemes for App Actions
export const DEEP_LINKS = {
  NAVIGATE: 'metachrome://navigate',
  SEARCH: 'metachrome://search',
  NEW_TAB: 'metachrome://newtab',
  VOICE_MODE: 'metachrome://voice',
  READ_PAGE: 'metachrome://read',
  SCROLL: 'metachrome://scroll',
  CUSTOM_COMMAND: 'metachrome://command',
} as const;

export interface AppActionState {
  isAvailable: boolean;
  lastDeepLink: string | null;
  lastParams: Record<string, string> | null;

  // Actions
  setLastDeepLink: (link: string | null, params: Record<string, string> | null) => void;
}

export const useAppActionsStore = create<AppActionState>()(
  persist(
    (set) => ({
      isAvailable: Platform.OS === 'android',
      lastDeepLink: null,
      lastParams: null,

      setLastDeepLink: (link, params) => set({ lastDeepLink: link, lastParams: params }),
    }),
    {
      name: 'app-actions-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({}), // Don't persist anything
    }
  )
);

class GoogleAppActionsService {
  private isInitialized = false;
  private deepLinkHandlers: Map<string, (params: Record<string, string>) => void> = new Map();

  /**
   * Check if App Actions are available (Android only)
   */
  isAvailable(): boolean {
    return Platform.OS === 'android';
  }

  /**
   * Initialize the service and set up deep link handling
   */
  async initialize(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    if (this.isInitialized) return true;

    try {
      // Handle initial deep link (app opened via App Action)
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        this.handleDeepLink(initialUrl);
      }

      // Listen for deep links while app is running
      Linking.addEventListener('url', (event) => {
        this.handleDeepLink(event.url);
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize App Actions:', error);
      return false;
    }
  }

  /**
   * Register a handler for a specific deep link scheme
   */
  onDeepLink(scheme: string, handler: (params: Record<string, string>) => void): void {
    this.deepLinkHandlers.set(scheme, handler);
  }

  /**
   * Parse and handle a deep link
   */
  private handleDeepLink(url: string): void {
    try {
      const parsed = new URL(url);
      const scheme = `${parsed.protocol}//${parsed.host}`;

      // Parse query parameters
      const params: Record<string, string> = {};
      parsed.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Also check path as parameter
      if (parsed.pathname && parsed.pathname !== '/') {
        params.path = parsed.pathname.substring(1);
      }

      // Store for reference
      useAppActionsStore.getState().setLastDeepLink(url, params);

      // Call registered handler
      const handler = this.deepLinkHandlers.get(scheme);
      if (handler) {
        handler(params);
      }
    } catch (error) {
      console.error('Failed to parse deep link:', error);
    }
  }

  /**
   * Generate the shortcuts.xml content for Android
   * This should be placed in android/app/src/main/res/xml/shortcuts.xml
   */
  generateShortcutsXml(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">

  <!-- Voice browsing capability -->
  <capability android:name="actions.intent.OPEN_APP_FEATURE">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="com.metachrome"
      android:targetClass="com.metachrome.MainActivity">
      <parameter
        android:name="feature"
        android:key="feature" />
    </intent>
  </capability>

  <!-- Search capability -->
  <capability android:name="actions.intent.SEARCH">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="com.metachrome"
      android:targetClass="com.metachrome.MainActivity">
      <parameter
        android:name="query"
        android:key="query" />
      <url-template android:value="metachrome://search?q={query}" />
    </intent>
  </capability>

  <!-- Static shortcuts for common actions -->
  <shortcut
    android:shortcutId="voice_mode"
    android:enabled="true"
    android:shortcutShortLabel="@string/shortcut_voice_mode"
    android:shortcutLongLabel="@string/shortcut_voice_mode_long">
    <intent
      android:action="android.intent.action.VIEW"
      android:data="metachrome://voice" />
    <capability-binding android:key="actions.intent.OPEN_APP_FEATURE">
      <parameter-binding
        android:key="feature"
        android:value="voice browsing" />
    </capability-binding>
  </shortcut>

  <shortcut
    android:shortcutId="new_tab"
    android:enabled="true"
    android:shortcutShortLabel="@string/shortcut_new_tab"
    android:shortcutLongLabel="@string/shortcut_new_tab_long">
    <intent
      android:action="android.intent.action.VIEW"
      android:data="metachrome://newtab" />
    <capability-binding android:key="actions.intent.OPEN_APP_FEATURE">
      <parameter-binding
        android:key="feature"
        android:value="new tab" />
    </capability-binding>
  </shortcut>

  <shortcut
    android:shortcutId="read_page"
    android:enabled="true"
    android:shortcutShortLabel="@string/shortcut_read_page"
    android:shortcutLongLabel="@string/shortcut_read_page_long">
    <intent
      android:action="android.intent.action.VIEW"
      android:data="metachrome://read" />
    <capability-binding android:key="actions.intent.OPEN_APP_FEATURE">
      <parameter-binding
        android:key="feature"
        android:value="read page" />
    </capability-binding>
  </shortcut>

</shortcuts>`;
  }

  /**
   * Generate strings.xml entries for shortcuts
   */
  generateStringsXml(): string {
    return `<!-- Add these to android/app/src/main/res/values/strings.xml -->
<string name="shortcut_voice_mode">Voice Mode</string>
<string name="shortcut_voice_mode_long">Start voice browsing</string>
<string name="shortcut_new_tab">New Tab</string>
<string name="shortcut_new_tab_long">Open a new browser tab</string>
<string name="shortcut_read_page">Read Page</string>
<string name="shortcut_read_page_long">Read the current page aloud</string>`;
  }
}

// Singleton instance
export const googleAppActionsService = new GoogleAppActionsService();
