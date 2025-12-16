/**
 * SiriShortcutsService
 *
 * Integrates with iOS Siri Shortcuts to allow users to create
 * custom voice commands that trigger app actions.
 *
 * Uses react-native-siri-shortcut library.
 */

import { Platform } from 'react-native';
import {
  donateShortcut,
  suggestShortcuts,
  clearAllShortcuts,
  clearShortcutsWithIdentifiers,
  presentShortcut,
  getShortcuts,
  ShortcutOptions,
  ShortcutData,
  PresentShortcutCallbackData,
} from 'react-native-siri-shortcut';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Shortcut activity types
export const SHORTCUT_ACTIVITIES = {
  NAVIGATE: 'com.metachrome.navigate',
  SEARCH: 'com.metachrome.search',
  READ_PAGE: 'com.metachrome.readpage',
  SCROLL: 'com.metachrome.scroll',
  NEW_TAB: 'com.metachrome.newtab',
  CLOSE_TAB: 'com.metachrome.closetab',
  SWITCH_TAB: 'com.metachrome.switchtab',
  CUSTOM_COMMAND: 'com.metachrome.customcommand',
  VOICE_MODE: 'com.metachrome.voicemode',
} as const;

export interface SiriShortcut {
  id: string;
  activityType: string;
  title: string;
  suggestedInvocationPhrase: string;
  userInfo: Record<string, any>;
  isEligibleForSearch: boolean;
  isEligibleForPrediction: boolean;
  needsSave: boolean;
}

export interface SiriShortcutsState {
  shortcuts: SiriShortcut[];
  isAvailable: boolean;

  // Actions
  setShortcuts: (shortcuts: SiriShortcut[]) => void;
  addShortcut: (shortcut: SiriShortcut) => void;
  removeShortcut: (id: string) => void;
  setAvailable: (available: boolean) => void;
}

export const useSiriShortcutsStore = create<SiriShortcutsState>()(
  persist(
    (set, get) => ({
      shortcuts: [],
      isAvailable: Platform.OS === 'ios',

      setShortcuts: (shortcuts) => set({ shortcuts }),
      addShortcut: (shortcut) => {
        const existing = get().shortcuts;
        const filtered = existing.filter((s) => s.id !== shortcut.id);
        set({ shortcuts: [...filtered, shortcut] });
      },
      removeShortcut: (id) => {
        const existing = get().shortcuts;
        set({ shortcuts: existing.filter((s) => s.id !== id) });
      },
      setAvailable: (available) => set({ isAvailable: available }),
    }),
    {
      name: 'siri-shortcuts-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

class SiriShortcutsService {
  private isInitialized = false;

  /**
   * Check if Siri Shortcuts is available (iOS only)
   */
  isAvailable(): boolean {
    return Platform.OS === 'ios';
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<boolean> {
    if (!this.isAvailable()) {
      useSiriShortcutsStore.getState().setAvailable(false);
      return false;
    }

    if (this.isInitialized) return true;

    try {
      // Load existing shortcuts
      await this.loadShortcuts();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Siri Shortcuts:', error);
      return false;
    }
  }

  /**
   * Load all donated shortcuts
   */
  async loadShortcuts(): Promise<SiriShortcut[]> {
    if (!this.isAvailable()) return [];

    try {
      const shortcuts = await getShortcuts();
      const mapped = shortcuts.map((s: ShortcutData) => this.mapShortcutData(s));
      useSiriShortcutsStore.getState().setShortcuts(mapped);
      return mapped;
    } catch (error) {
      console.error('Failed to load shortcuts:', error);
      return [];
    }
  }

  /**
   * Map native shortcut data to our format
   * Note: ShortcutData type from library may not include all fields,
   * so we use type assertion for runtime data
   */
  private mapShortcutData(data: ShortcutData): SiriShortcut {
    // Cast to any to access runtime properties that may not be in type definition
    const shortcutData = data as unknown as SiriShortcut;
    return {
      id: shortcutData.activityType || '',
      activityType: shortcutData.activityType || '',
      title: shortcutData.title || '',
      suggestedInvocationPhrase: shortcutData.suggestedInvocationPhrase || '',
      userInfo: shortcutData.userInfo || {},
      isEligibleForSearch: shortcutData.isEligibleForSearch ?? true,
      isEligibleForPrediction: shortcutData.isEligibleForPrediction ?? true,
      needsSave: shortcutData.needsSave ?? false,
    };
  }

  /**
   * Create a shortcut for navigating to a URL
   */
  createNavigateShortcut(url: string, title: string): ShortcutOptions {
    return {
      activityType: SHORTCUT_ACTIVITIES.NAVIGATE,
      title: `Open ${title}`,
      suggestedInvocationPhrase: `Open ${title}`,
      userInfo: { url, title },
      isEligibleForSearch: true,
      isEligibleForPrediction: true,
      needsSave: true,
    };
  }

  /**
   * Create a shortcut for searching
   */
  createSearchShortcut(query?: string): ShortcutOptions {
    return {
      activityType: SHORTCUT_ACTIVITIES.SEARCH,
      title: query ? `Search for ${query}` : 'Search the web',
      suggestedInvocationPhrase: query ? `Search for ${query}` : 'Search in MetaChrome',
      userInfo: { query },
      isEligibleForSearch: true,
      isEligibleForPrediction: true,
      needsSave: true,
    };
  }

  /**
   * Create a shortcut for reading the current page
   */
  createReadPageShortcut(): ShortcutOptions {
    return {
      activityType: SHORTCUT_ACTIVITIES.READ_PAGE,
      title: 'Read this page',
      suggestedInvocationPhrase: 'Read this page',
      userInfo: {},
      isEligibleForSearch: true,
      isEligibleForPrediction: true,
      needsSave: true,
    };
  }

  /**
   * Create a shortcut for voice mode
   */
  createVoiceModeShortcut(): ShortcutOptions {
    return {
      activityType: SHORTCUT_ACTIVITIES.VOICE_MODE,
      title: 'Start voice browsing',
      suggestedInvocationPhrase: 'Start voice browsing',
      userInfo: {},
      isEligibleForSearch: true,
      isEligibleForPrediction: true,
      needsSave: true,
    };
  }

  /**
   * Create a custom command shortcut
   */
  createCustomCommandShortcut(
    commandId: string,
    triggerPhrase: string,
    actionType: string,
    actionTarget: string
  ): ShortcutOptions {
    return {
      activityType: `${SHORTCUT_ACTIVITIES.CUSTOM_COMMAND}.${commandId}`,
      title: triggerPhrase,
      suggestedInvocationPhrase: triggerPhrase,
      userInfo: { commandId, actionType, actionTarget },
      isEligibleForSearch: true,
      isEligibleForPrediction: true,
      needsSave: true,
    };
  }

  /**
   * Donate a shortcut (make it available to Siri)
   */
  async donateShortcut(options: ShortcutOptions): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      donateShortcut(options);

      // Add to store
      useSiriShortcutsStore.getState().addShortcut({
        id: options.activityType,
        activityType: options.activityType,
        title: options.title || '',
        suggestedInvocationPhrase: options.suggestedInvocationPhrase || '',
        userInfo: options.userInfo || {},
        isEligibleForSearch: options.isEligibleForSearch ?? true,
        isEligibleForPrediction: options.isEligibleForPrediction ?? true,
        needsSave: options.needsSave ?? false,
      });
    } catch (error) {
      console.error('Failed to donate shortcut:', error);
    }
  }

  /**
   * Suggest multiple shortcuts to the user
   */
  async suggestShortcuts(shortcuts: ShortcutOptions[]): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      suggestShortcuts(shortcuts);
    } catch (error) {
      console.error('Failed to suggest shortcuts:', error);
    }
  }

  /**
   * Present the "Add to Siri" UI for a shortcut
   */
  async presentShortcut(
    options: ShortcutOptions,
    callback?: (data: PresentShortcutCallbackData) => void
  ): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      presentShortcut(options, callback || (() => {}));
    } catch (error) {
      console.error('Failed to present shortcut:', error);
    }
  }

  /**
   * Clear a specific shortcut
   */
  async clearShortcut(activityType: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      clearShortcutsWithIdentifiers([activityType]);
      useSiriShortcutsStore.getState().removeShortcut(activityType);
    } catch (error) {
      console.error('Failed to clear shortcut:', error);
    }
  }

  /**
   * Clear all shortcuts
   */
  async clearAllShortcuts(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      clearAllShortcuts();
      useSiriShortcutsStore.getState().setShortcuts([]);
    } catch (error) {
      console.error('Failed to clear all shortcuts:', error);
    }
  }

  /**
   * Donate default shortcuts for the app
   */
  async donateDefaultShortcuts(): Promise<void> {
    if (!this.isAvailable()) return;

    const defaultShortcuts: ShortcutOptions[] = [
      this.createVoiceModeShortcut(),
      this.createReadPageShortcut(),
      this.createSearchShortcut(),
      {
        activityType: SHORTCUT_ACTIVITIES.NEW_TAB,
        title: 'Open new tab',
        suggestedInvocationPhrase: 'New tab in MetaChrome',
        userInfo: {},
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
        needsSave: true,
      },
    ];

    await this.suggestShortcuts(defaultShortcuts);
  }
}

// Singleton instance
export const siriShortcutsService = new SiriShortcutsService();
