export type ActionType =
  | 'navigate'
  | 'switch_tab'
  | 'scroll'
  | 'read'
  | 'search'
  | 'refresh'
  | 'close_tab'
  | 'new_tab'
  | 'custom_script';

export interface CustomVoiceCommand {
  id: string;
  triggerPhrase: string;
  actionType: ActionType;
  actionTarget: string;
  description: string;
  enabled: boolean;
  createdAt: Date;
  isMetaRayBan?: boolean; // Flag for Meta Ray-Ban specific commands
}

export interface CustomCommandCreate {
  triggerPhrase: string;
  actionType: ActionType;
  actionTarget: string;
  description?: string;
  enabled?: boolean;
  isMetaRayBan?: boolean;
}

export interface MetaRayBanSettings {
  isConnected: boolean;
  deviceName: string | null;
  batteryLevel: number | null;
  voiceFeedbackEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  wakeWordEnabled: boolean;
  customWakeWord: string;
}

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  navigate: 'Navigate to URL',
  switch_tab: 'Switch Tab',
  scroll: 'Scroll Page',
  read: 'Read Content',
  search: 'Search',
  refresh: 'Refresh Page',
  close_tab: 'Close Tab',
  new_tab: 'New Tab',
  custom_script: 'Custom Script',
};

export const ACTION_TYPE_ICONS: Record<ActionType, string> = {
  navigate: 'globe-outline',
  switch_tab: 'swap-horizontal-outline',
  scroll: 'arrow-down-outline',
  read: 'reader-outline',
  search: 'search-outline',
  refresh: 'refresh-outline',
  close_tab: 'close-circle-outline',
  new_tab: 'add-circle-outline',
  custom_script: 'code-outline',
};
