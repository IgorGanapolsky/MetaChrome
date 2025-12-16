import { renderHook, act } from '@testing-library/react-native';
import { useTabActions } from '../model/useTabActions';
import { useTabStore } from '@/entities/tab';
import * as Haptics from 'expo-haptics';

jest.mock('expo-haptics');
jest.mock('@/entities/tab', () => ({
  useTabStore: jest.fn(),
}));

describe('useTabActions', () => {
  const mockSetActiveTab = jest.fn();
  const mockRemoveTab = jest.fn();
  const mockTabs = [
    { id: '1', name: 'Tab 1', url: 'https://example.com', icon: 'globe' },
    { id: '2', name: 'Tab 2', url: 'https://example2.com', icon: 'globe' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useTabStore as unknown as jest.Mock).mockReturnValue({
      tabs: mockTabs,
      setActiveTab: mockSetActiveTab,
      removeTab: mockRemoveTab,
    });
  });

  it('should switch tab with haptic feedback', () => {
    const { result } = renderHook(() => useTabActions());

    act(() => {
      result.current.switchTab('2');
    });

    expect(mockSetActiveTab).toHaveBeenCalledWith('2');
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('should close tab with haptic feedback when multiple tabs exist', () => {
    const { result } = renderHook(() => useTabActions());

    act(() => {
      result.current.closeTab('1');
    });

    expect(mockRemoveTab).toHaveBeenCalledWith('1');
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('should not close tab if only one tab exists', () => {
    (useTabStore as unknown as jest.Mock).mockReturnValue({
      tabs: [{ id: '1', name: 'Tab 1', url: 'https://example.com', icon: 'globe' }],
      setActiveTab: mockSetActiveTab,
      removeTab: mockRemoveTab,
    });

    const { result } = renderHook(() => useTabActions());

    act(() => {
      result.current.closeTab('1');
    });

    // Should NOT call removeTab when only one tab exists
    expect(mockRemoveTab).not.toHaveBeenCalled();
  });
});
