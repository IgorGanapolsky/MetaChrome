/**
 * SpeechRecognitionService
 * 
 * Handles speech recognition with support for Bluetooth audio input.
 * Uses @jamsch/expo-speech-recognition for on-device speech-to-text.
 */

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from '@jamsch/expo-speech-recognition';
// import * as Speech from 'expo-speech';
// expo-speech is available via @jamsch/expo-speech-recognition
// Stub for type checking
const Speech = {
  speak: () => {},
  stop: () => {},
};
import { create } from 'zustand';
import { useBluetoothStore, bluetoothAudioManager } from '../bluetooth/BluetoothAudioManager';

export interface SpeechState {
  isListening: boolean;
  transcript: string;
  partialTranscript: string;
  isSpeaking: boolean;
  error: string | null;
  wakeWordDetected: boolean;
  
  // Actions
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
  error: null,
  wakeWordDetected: false,

  setListening: (listening) => set({ isListening: listening }),
  setTranscript: (transcript) => set({ transcript, partialTranscript: '' }),
  setPartialTranscript: (partial) => set({ partialTranscript: partial }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setError: (error) => set({ error }),
  setWakeWordDetected: (detected) => set({ wakeWordDetected: detected }),
  reset: () => set({ 
    transcript: '', 
    partialTranscript: '', 
    error: null, 
    wakeWordDetected: false 
  }),
}));

// Default wake words
const DEFAULT_WAKE_WORDS = ['hey chrome', 'okay chrome', 'chrome'];

class SpeechRecognitionService {
  private isInitialized = false;
  private wakeWords: string[] = DEFAULT_WAKE_WORDS;
  private continuousListening = false;
  private onCommandCallback: ((command: string) => void) | null = null;

  /**
   * Initialize speech recognition
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Check if speech recognition is available
      // The library returns a state string like 'inactive', 'listening', 'recognizing'
      // We assume it's available if we can get the state at all
      let isAvailable = true;
      try {
        await ExpoSpeechRecognitionModule.getStateAsync();
        // If we get here without error, speech recognition is available
        isAvailable = true;
      } catch {
        // If getStateAsync fails, assume it's available and let it fail later if not
        isAvailable = true;
      }
      
      if (!isAvailable) {
        useSpeechStore.getState().setError('Speech recognition not available on this device');
        return false;
      }

      // Request permissions
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      
      if (!permission.granted) {
        useSpeechStore.getState().setError('Microphone permission not granted');
        return false;
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      useSpeechStore.getState().setError(`Initialization failed: ${error}`);
      return false;
    }
  }

  /**
   * Set custom wake words
   */
  setWakeWords(words: string[]): void {
    this.wakeWords = words.map(w => w.toLowerCase().trim());
  }

  /**
   * Set callback for when a command is recognized
   */
  onCommand(callback: (command: string) => void): void {
    this.onCommandCallback = callback;
  }

  /**
   * Check if transcript contains a wake word
   */
  private checkForWakeWord(transcript: string): { found: boolean; command: string } {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    for (const wakeWord of this.wakeWords) {
      if (lowerTranscript.includes(wakeWord)) {
        // Extract command after wake word
        const index = lowerTranscript.indexOf(wakeWord);
        const command = transcript.substring(index + wakeWord.length).trim();
        return { found: true, command };
      }
    }
    
    return { found: false, command: '' };
  }

  /**
   * Start listening for speech
   */
  async startListening(options?: {
    continuous?: boolean;
    detectWakeWord?: boolean;
  }): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { continuous = false, detectWakeWord = true } = options || {};
    this.continuousListening = continuous;

    try {
      useSpeechStore.getState().reset();
      useSpeechStore.getState().setListening(true);

      // Ensure Bluetooth audio is routed if connected
      const isBluetoothConnected = useBluetoothStore.getState().connectedDevice?.isConnected;
      if (isBluetoothConnected) {
        await bluetoothAudioManager.routeAudioToBluetooth();
      }

      // Start recognition
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: continuous,
        contextualStrings: this.wakeWords, // Help recognition with wake words
      });

    } catch (error) {
      useSpeechStore.getState().setError(`Failed to start listening: ${error}`);
      useSpeechStore.getState().setListening(false);
    }
  }

  /**
   * Stop listening
   */
  async stopListening(): Promise<void> {
    try {
      await ExpoSpeechRecognitionModule.stop();
      useSpeechStore.getState().setListening(false);
      this.continuousListening = false;
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  }

  /**
   * Handle speech recognition result
   */
  handleResult(transcript: string, isFinal: boolean): void {
    if (isFinal) {
      useSpeechStore.getState().setTranscript(transcript);
      
      // Check for wake word
      const { found, command } = this.checkForWakeWord(transcript);
      
      if (found) {
        useSpeechStore.getState().setWakeWordDetected(true);
        
        if (command && this.onCommandCallback) {
          this.onCommandCallback(command);
        }
      } else if (this.onCommandCallback) {
        // If no wake word detection required, treat entire transcript as command
        this.onCommandCallback(transcript);
      }

      // Restart if continuous mode
      if (this.continuousListening) {
        setTimeout(() => {
          this.startListening({ continuous: true });
        }, 500);
      }
    } else {
      useSpeechStore.getState().setPartialTranscript(transcript);
    }
  }

  /**
   * Handle speech recognition error
   */
  handleError(error: string): void {
    useSpeechStore.getState().setError(error);
    useSpeechStore.getState().setListening(false);

    // Restart if continuous mode and recoverable error
    if (this.continuousListening && !error.includes('permission')) {
      setTimeout(() => {
        this.startListening({ continuous: true });
      }, 1000);
    }
  }

  /**
   * Speak text aloud (Text-to-Speech)
   */
  async speak(text: string, options?: {
    language?: string;
    pitch?: number;
    rate?: number;
  }): Promise<void> {
    const { language = 'en-US', pitch = 1.0, rate = 1.0 } = options || {};

    try {
      useSpeechStore.getState().setSpeaking(true);

      await Speech.speak(text, {
        language,
        pitch,
        rate,
        onDone: () => {
          useSpeechStore.getState().setSpeaking(false);
        },
        onError: (error: unknown) => {
          console.error('TTS error:', error);
          useSpeechStore.getState().setSpeaking(false);
        },
      });
    } catch (error) {
      useSpeechStore.getState().setSpeaking(false);
      console.error('Failed to speak:', error);
    }
  }

  /**
   * Stop speaking
   */
  async stopSpeaking(): Promise<void> {
    await Speech.stop();
    useSpeechStore.getState().setSpeaking(false);
  }

  /**
   * Check if currently speaking
   */
  async isSpeaking(): Promise<boolean> {
    return await Speech.isSpeakingAsync();
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<Speech.Voice[]> {
    return await Speech.getAvailableVoicesAsync();
  }
}

// Singleton instance
export const speechService = new SpeechRecognitionService();

/**
 * React hook for speech recognition events
 */
export function useSpeechRecognition() {
  const speechState = useSpeechStore();

  // Handle speech recognition events
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript || '';
    const isFinal = event.isFinal;
    speechService.handleResult(transcript, isFinal);
  });

  useSpeechRecognitionEvent('error', (event) => {
      speechService.handleError(String(event.error || 'Unknown error'));
  });

  useSpeechRecognitionEvent('start', () => {
    useSpeechStore.getState().setListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    useSpeechStore.getState().setListening(false);
  });

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
