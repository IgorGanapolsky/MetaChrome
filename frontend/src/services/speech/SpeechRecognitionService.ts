/**
 * SpeechRecognitionService - DISABLED
 * Speech recognition package removed to fix app crash.
 */

import * as Speech from 'expo-speech';
import { create } from 'zustand';

export interface SpeechState {
  isListening: boolean;
  transcript: string;
  partialTranscript: string;
  isSpeaking: boolean;
  error: string | null;
  wakeWordDetected: boolean;
  setListening: (listening: boolean) => void;
  setTranscript: (transcript: string) => void;
  setPartialTranscript: (partial: string) => void;
  setSpeaking: (speaking: boolean) => void;
  setError: (error: string | null) => void;
  setWakeWordDetected: (detected: boolean) => void;
  reset: () => void;
}

export const useSpeechStore = create<SpeechState>((set) => ({
  isListening: false,
  transcript: '',
  partialTranscript: '',
  isSpeaking: false,
  error: 'Speech recognition unavailable',
  wakeWordDetected: false,
  setListening: (listening) => set({ isListening: listening }),
  setTranscript: (transcript) => set({ transcript, partialTranscript: '' }),
  setPartialTranscript: (partial) => set({ partialTranscript: partial }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setError: (error) => set({ error }),
  setWakeWordDetected: (detected) => set({ wakeWordDetected: detected }),
  reset: () => set({ transcript: '', partialTranscript: '', error: null, wakeWordDetected: false }),
}));

class SpeechRecognitionService {
  async initialize(): Promise<boolean> {
    return false;
  }

  setWakeWords(_words: string[]): void {}

  onCommand(_callback: (command: string) => void): void {}

  async startListening(_options?: { continuous?: boolean; detectWakeWord?: boolean }): Promise<void> {
    useSpeechStore.getState().setError('Speech recognition unavailable');
  }

  async stopListening(): Promise<void> {}

  async speak(text: string, options?: { language?: string; pitch?: number; rate?: number }): Promise<void> {
    const { language = 'en-US', pitch = 1.0, rate = 1.0 } = options || {};
    try {
      useSpeechStore.getState().setSpeaking(true);
      await Speech.speak(text, {
        language,
        pitch,
        rate,
        onDone: () => useSpeechStore.getState().setSpeaking(false),
        onError: () => useSpeechStore.getState().setSpeaking(false),
      });
    } catch {
      useSpeechStore.getState().setSpeaking(false);
    }
  }

  async stopSpeaking(): Promise<void> {
    await Speech.stop();
    useSpeechStore.getState().setSpeaking(false);
  }
}

export const speechService = new SpeechRecognitionService();

export function useSpeechRecognition() {
  const speechState = useSpeechStore();
  return {
    ...speechState,
    startListening: speechService.startListening.bind(speechService),
    stopListening: speechService.stopListening.bind(speechService),
    speak: speechService.speak.bind(speechService),
    stopSpeaking: speechService.stopSpeaking.bind(speechService),
    setWakeWords: speechService.setWakeWords.bind(speechService),
    onCommand: speechService.onCommand.bind(speechService),
  };
}
