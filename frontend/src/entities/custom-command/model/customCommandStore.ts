import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomVoiceCommand, CustomCommandCreate, MetaRayBanSettings, ActionType } from './types';

interface CustomCommandState {
  commands: CustomVoiceCommand[];
  metaRayBanSettings: MetaRayBanSettings;
  isLoading: boolean;
  error: string | null;

  // Command actions
  addCommand: (command: CustomCommandCreate) => void;
  updateCommand: (id: string, updates: Partial<CustomVoiceCommand>) => void;
  deleteCommand: (id: string) => void;
  toggleCommand: (id: string) => void;
  getEnabledCommands: () => CustomVoiceCommand[];
  findMatchingCommand: (phrase: string) => CustomVoiceCommand | null;

  // Meta Ray-Ban settings actions
  updateMetaRayBanSettings: (settings: Partial<MetaRayBanSettings>) => void;
  connectMetaRayBan: (deviceName: string) => void;
  disconnectMetaRayBan: () => void;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAllCommands: () => void;
}

const DEFAULT_COMMANDS: CustomVoiceCommand[] = [
  {
    id: '1',
    triggerPhrase: 'open google',
    actionType: 'navigate',
    actionTarget: 'https://google.com',
    description: 'Navigate to Google',
    enabled: true,
    createdAt: new Date(),
    isMetaRayBan: true,
  },
  {
    id: '2',
    triggerPhrase: 'open github',
    actionType: 'navigate',
    actionTarget: 'https://github.com',
    description: 'Navigate to GitHub',
    enabled: true,
    createdAt: new Date(),
    isMetaRayBan: true,
  },
  {
    id: '3',
    triggerPhrase: 'scroll down',
    actionType: 'scroll',
    actionTarget: 'down',
    description: 'Scroll the page down',
    enabled: true,
    createdAt: new Date(),
    isMetaRayBan: true,
  },
  {
    id: '4',
    triggerPhrase: 'scroll up',
    actionType: 'scroll',
    actionTarget: 'up',
    description: 'Scroll the page up',
    enabled: true,
    createdAt: new Date(),
    isMetaRayBan: true,
  },
  {
    id: '5',
    triggerPhrase: 'read this page',
    actionType: 'read',
    actionTarget: 'page',
    description: 'Read the current page content',
    enabled: true,
    createdAt: new Date(),
    isMetaRayBan: true,
  },
];

const DEFAULT_META_RAYBAN_SETTINGS: MetaRayBanSettings = {
  isConnected: false,
  deviceName: null,
  batteryLevel: null,
  voiceFeedbackEnabled: true,
  hapticFeedbackEnabled: true,
  wakeWordEnabled: true,
  customWakeWord: 'Hey Chrome',
};

export const useCustomCommandStore = create<CustomCommandState>()(
  persist(
    (set, get) => ({
      commands: DEFAULT_COMMANDS,
      metaRayBanSettings: DEFAULT_META_RAYBAN_SETTINGS,
      isLoading: false,
      error: null,

      addCommand: (commandData: CustomCommandCreate) => {
        const newCommand: CustomVoiceCommand = {
          id: Date.now().toString(),
          triggerPhrase: commandData.triggerPhrase.toLowerCase().trim(),
          actionType: commandData.actionType,
          actionTarget: commandData.actionTarget,
          description: commandData.description || `${commandData.actionType}: ${commandData.actionTarget}`,
          enabled: commandData.enabled ?? true,
          createdAt: new Date(),
          isMetaRayBan: commandData.isMetaRayBan ?? true,
        };
        set((state) => ({
          commands: [...state.commands, newCommand],
        }));
      },

      updateCommand: (id: string, updates: Partial<CustomVoiceCommand>) => {
        set((state) => ({
          commands: state.commands.map((cmd) =>
            cmd.id === id ? { ...cmd, ...updates } : cmd
          ),
        }));
      },

      deleteCommand: (id: string) => {
        set((state) => ({
          commands: state.commands.filter((cmd) => cmd.id !== id),
        }));
      },

      toggleCommand: (id: string) => {
        set((state) => ({
          commands: state.commands.map((cmd) =>
            cmd.id === id ? { ...cmd, enabled: !cmd.enabled } : cmd
          ),
        }));
      },

      getEnabledCommands: () => {
        return get().commands.filter((cmd) => cmd.enabled);
      },

      findMatchingCommand: (phrase: string) => {
        const normalizedPhrase = phrase.toLowerCase().trim();
        const enabledCommands = get().getEnabledCommands();

        // Exact match first
        const exactMatch = enabledCommands.find(
          (cmd) => cmd.triggerPhrase === normalizedPhrase
        );
        if (exactMatch) return exactMatch;

        // Partial match (phrase contains trigger or trigger contains phrase)
        const partialMatch = enabledCommands.find(
          (cmd) =>
            normalizedPhrase.includes(cmd.triggerPhrase) ||
            cmd.triggerPhrase.includes(normalizedPhrase)
        );
        if (partialMatch) return partialMatch;

        // Fuzzy match - check if key words match
        for (const cmd of enabledCommands) {
          const triggerWords = cmd.triggerPhrase.split(' ');
          const phraseWords = normalizedPhrase.split(' ');
          const matchingWords = triggerWords.filter((word) =>
            phraseWords.some((pw) => pw.includes(word) || word.includes(pw))
          );
          if (matchingWords.length >= triggerWords.length * 0.7) {
            return cmd;
          }
        }

        return null;
      },

      updateMetaRayBanSettings: (settings: Partial<MetaRayBanSettings>) => {
        set((state) => ({
          metaRayBanSettings: { ...state.metaRayBanSettings, ...settings },
        }));
      },

      connectMetaRayBan: (deviceName: string) => {
        set((state) => ({
          metaRayBanSettings: {
            ...state.metaRayBanSettings,
            isConnected: true,
            deviceName,
            batteryLevel: 85, // Simulated battery level
          },
        }));
      },

      disconnectMetaRayBan: () => {
        set((state) => ({
          metaRayBanSettings: {
            ...state.metaRayBanSettings,
            isConnected: false,
            deviceName: null,
            batteryLevel: null,
          },
        }));
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),

      clearAllCommands: () => set({ commands: [] }),
    }),
    {
      name: 'custom-commands-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        commands: state.commands,
        metaRayBanSettings: state.metaRayBanSettings,
      }),
    }
  )
);
