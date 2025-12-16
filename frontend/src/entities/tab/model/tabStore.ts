import { create } from 'zustand';
import type { BrowserTab } from './types';

interface TabStore {
  tabs: BrowserTab[];
  activeTabId: string | null;
  setTabs: (tabs: BrowserTab[]) => void;
  addTab: (tab: BrowserTab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
}

const defaultTabs: BrowserTab[] = [
  { id: '1', name: 'Claude', url: 'https://claude.ai', icon: 'chatbubble-ellipses' },
  { id: '2', name: 'Cursor', url: 'https://cursor.com', icon: 'code-slash' },
  { id: '3', name: 'GitHub', url: 'https://github.com', icon: 'logo-github' },
];

export const useTabStore = create<TabStore>((set) => ({
  tabs: defaultTabs,
  activeTabId: '1',
  setTabs: (tabs) => set({ tabs }),
  addTab: (tab) =>
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    })),
  removeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      const newActiveTabId =
        state.activeTabId === id && newTabs.length > 0 ? newTabs[0].id : state.activeTabId;
      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };
    }),
  setActiveTab: (id) => set({ activeTabId: id }),
}));
