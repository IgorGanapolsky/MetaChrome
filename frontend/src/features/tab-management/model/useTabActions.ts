import { useCallback } from 'react';
import { useTabStore } from '@/entities/tab';
import { useHaptics, trackEvent, AnalyticsEvents } from '@/shared/lib';

export function useTabActions() {
  const { setActiveTab, removeTab, tabs } = useTabStore();
  const { impact } = useHaptics();

  const switchTab = useCallback(
    (tabId: string) => {
      impact('light');
      setActiveTab(tabId);
      trackEvent({
        name: AnalyticsEvents.TAB_SWITCHED,
        properties: { tabId },
      });
    },
    [setActiveTab, impact]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      if (tabs.length > 1) {
        impact('medium');
        removeTab(tabId);
        trackEvent({
          name: AnalyticsEvents.TAB_REMOVED,
          properties: { tabId },
        });
      }
    },
    [removeTab, tabs.length, impact]
  );

  return {
    switchTab,
    closeTab,
  };
}
