import { useCallback } from 'react';
import { useTabStore } from '@/entities/tab';
import { useHaptics } from '@/shared/lib';

export function useTabActions() {
  const { setActiveTab, removeTab, tabs } = useTabStore();
  const { impact } = useHaptics();

  const switchTab = useCallback(
    (tabId: string) => {
      impact('light');
      setActiveTab(tabId);
    },
    [setActiveTab, impact]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      if (tabs.length > 1) {
        impact('medium');
        removeTab(tabId);
      }
    },
    [removeTab, tabs.length, impact]
  );

  return {
    switchTab,
    closeTab,
  };
}
