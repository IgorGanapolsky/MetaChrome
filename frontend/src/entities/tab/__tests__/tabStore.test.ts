import { renderHook, act } from '@testing-library/react-native';
import { useTabStore } from '../model/tabStore';
import type { BrowserTab } from '../model/types';

describe('TabStore', () => {
  beforeEach(() => {
    const { setTabs, setActiveTab } = useTabStore.getState();
    setTabs([
      { id: '1', name: 'Claude', url: 'https://claude.ai', icon: 'chatbubble-ellipses' },
      { id: '2', name: 'Cursor', url: 'https://cursor.com', icon: 'code-slash' },
    ]);
    setActiveTab('1');
  });

  it('should initialize with default tabs', () => {
    const { result } = renderHook(() => useTabStore());
    expect(result.current.tabs).toHaveLength(2);
    expect(result.current.activeTabId).toBe('1');
  });

  it('should add a new tab', () => {
    const { result } = renderHook(() => useTabStore());
    const newTab: BrowserTab = {
      id: '3',
      name: 'GitHub',
      url: 'https://github.com',
      icon: 'logo-github',
    };

    act(() => {
      result.current.addTab(newTab);
    });

    expect(result.current.tabs).toHaveLength(3);
    expect(result.current.tabs[2]).toEqual(newTab);
    expect(result.current.activeTabId).toBe('3');
  });

  it('should remove a tab', () => {
    const { result } = renderHook(() => useTabStore());

    act(() => {
      result.current.removeTab('2');
    });

    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.tabs[0].id).toBe('1');
  });

  it('should switch active tab when removing active tab', () => {
    const { result } = renderHook(() => useTabStore());

    act(() => {
      result.current.removeTab('1');
    });

    expect(result.current.activeTabId).toBe('2');
  });

  it('should set active tab', () => {
    const { result } = renderHook(() => useTabStore());

    act(() => {
      result.current.setActiveTab('2');
    });

    expect(result.current.activeTabId).toBe('2');
  });

  it('should not remove last tab', () => {
    const { result } = renderHook(() => useTabStore());
    const initialTabs = result.current.tabs;

    act(() => {
      result.current.removeTab('1');
      result.current.removeTab('2');
    });

    expect(result.current.tabs.length).toBeGreaterThan(0);
  });
});
