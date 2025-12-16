import { renderHook, act } from '@testing-library/react-native';
import { useAddTab } from '../model/useAddTab';
import { useTabStore } from '@/entities/tab';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Mock the tab store
const mockAddTab = jest.fn();
jest.mock('@/entities/tab', () => ({
  useTabStore: jest.fn(() => ({
    addTab: mockAddTab,
  })),
}));

// Mock expo-router
const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

describe('useAddTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add tab with normalized URL', () => {
    const { result } = renderHook(() => useAddTab());

    act(() => {
      result.current.addTab({
        name: 'Test',
        url: 'example.com',
        icon: 'globe',
      });
    });

    expect(mockAddTab).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test',
        url: 'https://example.com',
        icon: 'globe',
      })
    );
    expect(mockRouterBack).toHaveBeenCalled();
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('should use hostname as name if name is empty', () => {
    const { result } = renderHook(() => useAddTab());

    act(() => {
      result.current.addTab({
        name: '',
        url: 'https://example.com',
        icon: 'globe',
      });
    });

    expect(mockAddTab).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'example.com',
        url: 'https://example.com',
      })
    );
  });
});
