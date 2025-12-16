import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useTabStore, type BrowserTab } from '@/entities/tab';
import { useHaptics, trackEvent, AnalyticsEvents } from '@/shared/lib';
import { normalizeUrl, getHostname } from '@/shared/lib/utils/url';

export function useAddTab() {
  const router = useRouter();
  const { addTab } = useTabStore();
  const { impact } = useHaptics();

  const handleAddTab = useCallback(
    (tab: Omit<BrowserTab, 'id'>) => {
      impact('medium');
      const normalizedUrl = normalizeUrl(tab.url);
      const finalName = tab.name.trim() || getHostname(normalizedUrl);

      addTab({
        ...tab,
        id: Date.now().toString(),
        url: normalizedUrl,
        name: finalName,
      });

      trackEvent({
        name: AnalyticsEvents.TAB_ADDED,
        properties: { url: normalizedUrl, name: finalName },
      });

      router.back();
    },
    [addTab, router, impact]
  );

  return {
    addTab: handleAddTab,
  };
}
