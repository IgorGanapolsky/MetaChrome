import { create } from 'zustand';
import type { CommandLog } from './types';

interface CommandStore {
  commandHistory: CommandLog[];
  addCommandLog: (log: Omit<CommandLog, 'id' | 'timestamp'>) => void;
}

export const useCommandStore = create<CommandStore>((set) => ({
  commandHistory: [],
  addCommandLog: (log) => set((state) => ({
    commandHistory: [
      {
        ...log,
        id: Date.now().toString(),
        timestamp: new Date(),
      },
      ...state.commandHistory,
    ].slice(0, 20),
  })),
}));
