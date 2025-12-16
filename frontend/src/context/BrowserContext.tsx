// Legacy BrowserContext - kept for backward compatibility
// New code should use entities/features directly
import React from 'react';
import { useTabStore, type BrowserTab } from '@/entities/tab';
import { useCommandStore, type CommandLog } from '@/entities/command';
import { useBrowserControls } from '@/features/browser-controls';
import { useVoiceCommands } from '@/features/voice-commands';

export type { BrowserTab, CommandLog };

export function BrowserProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useBrowser() {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTabStore();
  const { commandHistory, addCommandLog } = useCommandStore();
  const { webViewRef, injectScript } = useBrowserControls();
  const { executeCommand } = useVoiceCommands();

  return {
    tabs,
    activeTabId,
    webViewRef,
    addTab: (tab: Omit<BrowserTab, 'id'>) => {
      addTab({
        ...tab,
        id: Date.now().toString(),
      });
    },
    removeTab,
    setActiveTab,
    executeCommand,
    injectScript,
    commandHistory,
    addCommandLog,
  };
}
