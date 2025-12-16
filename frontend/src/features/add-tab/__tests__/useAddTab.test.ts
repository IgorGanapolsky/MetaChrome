import { renderHook, act } from '@testing-library/react-native';
import { useAddTab } from '../model/useAddTab';
import { useTabStore } from '@/entities/tab';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

jest.mock('@/entities/tab');
jest.mock('expo-router');
jest.mock('expo-haptics');

describe('useAddTab', () => {
  const mockAddTab = jest.fn();
  const mockRouterBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTabStore as jest.Mock).mockReturnValue({
      addTab: mockAddTab,
    });
    (useRouter as jest.Mock).mockReturnValue({
      back: mockRouterBack,
    });
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
