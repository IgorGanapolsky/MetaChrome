/**
 * AndroidAccessibilityService
 *
 * React Native bridge to Android's AccessibilityService for controlling
 * other apps like Chrome, reading screen content, and performing actions.
 *
 * This service enables:
 * - Opening apps (Chrome, Gmail, etc.)
 * - Navigating within apps (tap, scroll, type)
 * - Reading screen content from any app
 * - Switching Chrome tabs
 * - Typing into text fields
 */

import { NativeModules, Platform, NativeEventEmitter } from 'react-native';
import { create } from 'zustand';

// Types for accessibility actions
export interface AccessibilityNode {
  id: string;
  text: string;
  contentDescription: string;
  className: string;
  bounds: { left: number; top: number; right: number; bottom: number };
  isClickable: boolean;
  isScrollable: boolean;
  isEditable: boolean;
  children?: AccessibilityNode[];
}

export interface AccessibilityState {
  isEnabled: boolean;
  isServiceRunning: boolean;
  currentApp: string | null;
  screenContent: string | null;
  error: string | null;

  // Actions
  setEnabled: (enabled: boolean) => void;
  setServiceRunning: (running: boolean) => void;
  setCurrentApp: (app: string | null) => void;
  setScreenContent: (content: string | null) => void;
  setError: (error: string | null) => void;
}

export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  isEnabled: false,
  isServiceRunning: false,
  currentApp: null,
  screenContent: null,
  error: null,

  setEnabled: (enabled) => set({ isEnabled: enabled }),
  setServiceRunning: (running) => set({ isServiceRunning: running }),
  setCurrentApp: (app) => set({ currentApp: app }),
  setScreenContent: (content) => set({ screenContent: content }),
  setError: (error) => set({ error }),
}));

// Native module interface (will be implemented in Java/Kotlin)
interface AccessibilityNativeModule {
  // Service management
  isAccessibilityEnabled(): Promise<boolean>;
  openAccessibilitySettings(): Promise<void>;
  isServiceRunning(): Promise<boolean>;

  // App control
  openApp(packageName: string): Promise<boolean>;
  openChrome(url?: string): Promise<boolean>;
  getCurrentApp(): Promise<string>;

  // Screen interaction
  getScreenContent(): Promise<string>;
  getAccessibilityNodes(): Promise<AccessibilityNode[]>;
  findNodeByText(text: string): Promise<AccessibilityNode | null>;
  findNodeByContentDescription(description: string): Promise<AccessibilityNode | null>;

  // Actions
  clickNode(nodeId: string): Promise<boolean>;
  clickByText(text: string): Promise<boolean>;
  clickByCoordinates(x: number, y: number): Promise<boolean>;
  scrollUp(): Promise<boolean>;
  scrollDown(): Promise<boolean>;
  scrollLeft(): Promise<boolean>;
  scrollRight(): Promise<boolean>;
  typeText(text: string): Promise<boolean>;
  pressBack(): Promise<boolean>;
  pressHome(): Promise<boolean>;
  pressRecents(): Promise<boolean>;

  // Chrome-specific
  getChromeTabCount(): Promise<number>;
  switchChromeTab(index: number): Promise<boolean>;
  openNewChromeTab(url?: string): Promise<boolean>;
  closeChromeTab(): Promise<boolean>;
  getChromeUrl(): Promise<string>;
  navigateChromeToUrl(url: string): Promise<boolean>;
}

// Fallback implementation for iOS or when native module is not available
const FallbackModule: AccessibilityNativeModule = {
  isAccessibilityEnabled: async () => false,
  openAccessibilitySettings: async () => {
    console.warn('AccessibilityService is only available on Android');
  },
  isServiceRunning: async () => false,
  openApp: async () => false,
  openChrome: async () => false,
  getCurrentApp: async () => '',
  getScreenContent: async () => '',
  getAccessibilityNodes: async () => [],
  findNodeByText: async () => null,
  findNodeByContentDescription: async () => null,
  clickNode: async () => false,
  clickByText: async () => false,
  clickByCoordinates: async () => false,
  scrollUp: async () => false,
  scrollDown: async () => false,
  scrollLeft: async () => false,
  scrollRight: async () => false,
  typeText: async () => false,
  pressBack: async () => false,
  pressHome: async () => false,
  pressRecents: async () => false,
  getChromeTabCount: async () => 0,
  switchChromeTab: async () => false,
  openNewChromeTab: async () => false,
  closeChromeTab: async () => false,
  getChromeUrl: async () => '',
  navigateChromeToUrl: async () => false,
};

// Get the native module or fallback
const AccessibilityModule: AccessibilityNativeModule =
  Platform.OS === 'android' && NativeModules.MetaChromeAccessibility
    ? NativeModules.MetaChromeAccessibility
    : FallbackModule;

/**
 * AndroidAccessibilityService class
 * Provides high-level methods for controlling Android apps via AccessibilityService
 */
class AndroidAccessibilityService {
  private eventEmitter: NativeEventEmitter | null = null;
  private isInitialized = false;

  /**
   * Initialize the accessibility service
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      useAccessibilityStore
        .getState()
        .setError('AccessibilityService is only available on Android');
      return false;
    }

    if (this.isInitialized) return true;

    try {
      // Check if accessibility is enabled
      const isEnabled = await AccessibilityModule.isAccessibilityEnabled();
      useAccessibilityStore.getState().setEnabled(isEnabled);

      if (!isEnabled) {
        useAccessibilityStore
          .getState()
          .setError('Accessibility service not enabled. Please enable it in Settings.');
        return false;
      }

      // Check if our service is running
      const isRunning = await AccessibilityModule.isServiceRunning();
      useAccessibilityStore.getState().setServiceRunning(isRunning);

      if (!isRunning) {
        useAccessibilityStore
          .getState()
          .setError('MetaChrome accessibility service not running. Please enable it in Settings.');
        return false;
      }

      // Set up event emitter for native events
      if (NativeModules.MetaChromeAccessibility) {
        this.eventEmitter = new NativeEventEmitter(NativeModules.MetaChromeAccessibility);

        // Listen for screen changes
        this.eventEmitter.addListener('onScreenChanged', (event) => {
          useAccessibilityStore.getState().setCurrentApp(event.packageName);
          useAccessibilityStore.getState().setScreenContent(event.content);
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      useAccessibilityStore.getState().setError(`Initialization failed: ${error}`);
      return false;
    }
  }

  /**
   * Open accessibility settings for the user to enable the service
   */
  async openSettings(): Promise<void> {
    await AccessibilityModule.openAccessibilitySettings();
  }

  /**
   * Check if the service is available and running
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    const isEnabled = await AccessibilityModule.isAccessibilityEnabled();
    const isRunning = await AccessibilityModule.isServiceRunning();

    return isEnabled && isRunning;
  }

  /**
   * Check and update the service status in the store
   */
  async checkStatus(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const isEnabled = await AccessibilityModule.isAccessibilityEnabled();
      const isRunning = await AccessibilityModule.isServiceRunning();

      useAccessibilityStore.getState().setEnabled(isEnabled);
      useAccessibilityStore.getState().setServiceRunning(isRunning);
      useAccessibilityStore.getState().setError(null);
    } catch (error) {
      useAccessibilityStore.getState().setError(`Failed to check status: ${error}`);
    }
  }

  // ==================== App Control ====================

  /**
   * Open an app by package name
   */
  async openApp(packageName: string): Promise<boolean> {
    return AccessibilityModule.openApp(packageName);
  }

  /**
   * Open Chrome browser, optionally to a specific URL
   */
  async openChrome(url?: string): Promise<boolean> {
    return AccessibilityModule.openChrome(url);
  }

  /**
   * Get the currently focused app
   */
  async getCurrentApp(): Promise<string> {
    return AccessibilityModule.getCurrentApp();
  }

  // ==================== Screen Reading ====================

  /**
   * Get all text content from the current screen
   */
  async getScreenContent(): Promise<string> {
    const content = await AccessibilityModule.getScreenContent();
    useAccessibilityStore.getState().setScreenContent(content);
    return content;
  }

  /**
   * Get accessibility nodes from the current screen
   */
  async getAccessibilityNodes(): Promise<AccessibilityNode[]> {
    return AccessibilityModule.getAccessibilityNodes();
  }

  /**
   * Find a node by its text content
   */
  async findNodeByText(text: string): Promise<AccessibilityNode | null> {
    return AccessibilityModule.findNodeByText(text);
  }

  // ==================== Actions ====================

  /**
   * Click on an element by its text
   */
  async clickByText(text: string): Promise<boolean> {
    return AccessibilityModule.clickByText(text);
  }

  /**
   * Click at specific coordinates
   */
  async clickAt(x: number, y: number): Promise<boolean> {
    return AccessibilityModule.clickByCoordinates(x, y);
  }

  /**
   * Scroll the screen
   */
  async scroll(direction: 'up' | 'down' | 'left' | 'right'): Promise<boolean> {
    switch (direction) {
      case 'up':
        return AccessibilityModule.scrollUp();
      case 'down':
        return AccessibilityModule.scrollDown();
      case 'left':
        return AccessibilityModule.scrollLeft();
      case 'right':
        return AccessibilityModule.scrollRight();
    }
  }

  /**
   * Type text into the focused field
   */
  async typeText(text: string): Promise<boolean> {
    return AccessibilityModule.typeText(text);
  }

  /**
   * Press the back button
   */
  async pressBack(): Promise<boolean> {
    return AccessibilityModule.pressBack();
  }

  /**
   * Press the home button
   */
  async pressHome(): Promise<boolean> {
    return AccessibilityModule.pressHome();
  }

  // ==================== Chrome-Specific ====================

  /**
   * Get the number of open Chrome tabs
   */
  async getChromeTabCount(): Promise<number> {
    return AccessibilityModule.getChromeTabCount();
  }

  /**
   * Switch to a specific Chrome tab by index
   */
  async switchChromeTab(index: number): Promise<boolean> {
    return AccessibilityModule.switchChromeTab(index);
  }

  /**
   * Open a new Chrome tab
   */
  async openNewChromeTab(url?: string): Promise<boolean> {
    return AccessibilityModule.openNewChromeTab(url);
  }

  /**
   * Close the current Chrome tab
   */
  async closeChromeTab(): Promise<boolean> {
    return AccessibilityModule.closeChromeTab();
  }

  /**
   * Get the current URL in Chrome
   */
  async getChromeUrl(): Promise<string> {
    return AccessibilityModule.getChromeUrl();
  }

  /**
   * Navigate Chrome to a specific URL
   */
  async navigateChromeTo(url: string): Promise<boolean> {
    return AccessibilityModule.navigateChromeToUrl(url);
  }

  // ==================== High-Level Commands ====================

  /**
   * Execute a voice command for Chrome control
   */
  async executeCommand(command: string): Promise<string> {
    const lowerCommand = command.toLowerCase();

    // Open Chrome
    if (lowerCommand.includes('open chrome')) {
      const urlMatch = command.match(/(?:to|at|on)\s+(\S+)/i);
      const url = urlMatch ? urlMatch[1] : undefined;
      const success = await this.openChrome(url);
      return success ? `Opened Chrome${url ? ` to ${url}` : ''}` : 'Failed to open Chrome';
    }

    // Navigate to URL
    if (lowerCommand.includes('go to') || lowerCommand.includes('navigate to')) {
      const urlMatch = command.match(/(?:go to|navigate to)\s+(\S+)/i);
      if (urlMatch) {
        let url = urlMatch[1];
        if (!url.startsWith('http')) {
          url = `https://${url}`;
        }
        const success = await this.navigateChromeTo(url);
        return success ? `Navigating to ${url}` : 'Failed to navigate';
      }
    }

    // Switch tab
    if (lowerCommand.includes('switch tab') || lowerCommand.includes('tab')) {
      const tabMatch = command.match(/tab\s*(\d+)/i);
      if (tabMatch) {
        const tabIndex = parseInt(tabMatch[1], 10) - 1; // Convert to 0-indexed
        const success = await this.switchChromeTab(tabIndex);
        return success ? `Switched to tab ${tabIndex + 1}` : 'Failed to switch tab';
      }
    }

    // New tab
    if (lowerCommand.includes('new tab')) {
      const urlMatch = command.match(/new tab\s+(?:to|at|on)?\s*(\S+)/i);
      const url = urlMatch ? urlMatch[1] : undefined;
      const success = await this.openNewChromeTab(url);
      return success ? `Opened new tab${url ? ` to ${url}` : ''}` : 'Failed to open new tab';
    }

    // Close tab
    if (lowerCommand.includes('close tab')) {
      const success = await this.closeChromeTab();
      return success ? 'Closed tab' : 'Failed to close tab';
    }

    // Scroll
    if (lowerCommand.includes('scroll')) {
      if (lowerCommand.includes('up')) {
        await this.scroll('up');
        return 'Scrolled up';
      } else if (lowerCommand.includes('down')) {
        await this.scroll('down');
        return 'Scrolled down';
      }
    }

    // Read screen
    if (lowerCommand.includes('read') || lowerCommand.includes('what')) {
      const content = await this.getScreenContent();
      return content.substring(0, 500) || 'Could not read screen content';
    }

    // Type
    if (lowerCommand.includes('type')) {
      const textMatch = command.match(/type\s+(.+)/i);
      if (textMatch) {
        const success = await this.typeText(textMatch[1]);
        return success ? `Typed: ${textMatch[1]}` : 'Failed to type';
      }
    }

    // Click
    if (lowerCommand.includes('click') || lowerCommand.includes('tap')) {
      const textMatch = command.match(/(?:click|tap)\s+(?:on\s+)?(.+)/i);
      if (textMatch) {
        const success = await this.clickByText(textMatch[1]);
        return success ? `Clicked on ${textMatch[1]}` : `Could not find "${textMatch[1]}" to click`;
      }
    }

    // Back
    if (lowerCommand.includes('go back') || lowerCommand === 'back') {
      await this.pressBack();
      return 'Pressed back';
    }

    // Home
    if (lowerCommand.includes('go home') || lowerCommand === 'home') {
      await this.pressHome();
      return 'Pressed home';
    }

    return 'Command not recognized';
  }
}

// Singleton instance
export const androidAccessibilityService = new AndroidAccessibilityService();

/**
 * React hook for using the accessibility service
 */
export function useAndroidAccessibility() {
  const state = useAccessibilityStore();

  return {
    ...state,
    initialize: androidAccessibilityService.initialize.bind(androidAccessibilityService),
    openSettings: androidAccessibilityService.openSettings.bind(androidAccessibilityService),
    isAvailable: androidAccessibilityService.isAvailable.bind(androidAccessibilityService),
    openChrome: androidAccessibilityService.openChrome.bind(androidAccessibilityService),
    getScreenContent: androidAccessibilityService.getScreenContent.bind(
      androidAccessibilityService
    ),
    scroll: androidAccessibilityService.scroll.bind(androidAccessibilityService),
    typeText: androidAccessibilityService.typeText.bind(androidAccessibilityService),
    clickByText: androidAccessibilityService.clickByText.bind(androidAccessibilityService),
    executeCommand: androidAccessibilityService.executeCommand.bind(androidAccessibilityService),
    getChromeTabCount: androidAccessibilityService.getChromeTabCount.bind(
      androidAccessibilityService
    ),
    switchChromeTab: androidAccessibilityService.switchChromeTab.bind(androidAccessibilityService),
    navigateChromeTo: androidAccessibilityService.navigateChromeTo.bind(
      androidAccessibilityService
    ),
  };
}
