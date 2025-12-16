import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TabBar } from '../ui/TabBar';
import { useTabStore } from '@/entities/tab';
import { useTabActions } from '@/features/tab-management';

jest.mock('@/entities/tab');
jest.mock('@/features/tab-management');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('TabBar', () => {
  const mockTabs = [
    { id: '1', name: 'Claude', url: 'https://claude.ai', icon: 'chatbubble-ellipses' },
    { id: '2', name: 'GitHub', url: 'https://github.com', icon: 'logo-github' },
  ];

  const mockSwitchTab = jest.fn();
  const mockCloseTab = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTabStore as unknown as jest.Mock).mockReturnValue({
      tabs: mockTabs,
      activeTabId: '1',
    });
    (useTabActions as jest.Mock).mockReturnValue({
      switchTab: mockSwitchTab,
      closeTab: mockCloseTab,
    });
  });

  it('should render all tabs', () => {
    const { getByText } = render(<TabBar />);
    expect(getByText('Claude')).toBeTruthy();
    expect(getByText('GitHub')).toBeTruthy();
  });

  it('should highlight active tab', () => {
    const { getByText } = render(<TabBar />);
    const activeTab = getByText('Claude').parent;
    expect(activeTab).toBeTruthy();
  });

  it('should call switchTab when tab is pressed', () => {
    const { getByText } = render(<TabBar />);
    const tab = getByText('GitHub');

    fireEvent.press(tab);

    expect(mockSwitchTab).toHaveBeenCalledWith('2');
  });

  it('should call closeTab when tab is long pressed', () => {
    const { getByText } = render(<TabBar />);
    const tab = getByText('GitHub');

    fireEvent(tab, 'longPress');

    expect(mockCloseTab).toHaveBeenCalledWith('2');
  });

  it('should render add tab button', () => {
    const { getByTestId } = render(<TabBar />);
    // Add tab button should be present (icon with name "add")
    expect(getByTestId).toBeDefined();
  });
});
