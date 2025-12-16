import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSpeechRecognitionEvent } from '@jamsch/expo-speech-recognition';
import { useVoiceCommands } from '@/features/voice-commands';
import { useCustomCommandStore } from '@/entities/custom-command';
import { useHaptics } from '@/shared/lib';
import { 
  useSpeechStore, 
  speechService,
  useBluetoothStore,
  bluetoothAudioManager,
} from '@/services';

export function VoiceControls() {
  const router = useRouter();
  const { executeCommand, speakResponse } = useVoiceCommands();
  const { commands, metaRayBanSettings } = useCustomCommandStore();
  const { impact, notification } = useHaptics();
  
  // Speech recognition state
  const speechState = useSpeechStore();
  const bluetoothState = useBluetoothStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get enabled custom commands for quick access
  const enabledCommands = commands.filter((cmd) => cmd.enabled).slice(0, 6);

  // Check if connected to Meta glasses
  const isGlassesConnected = bluetoothState.connectedDevice?.isMetaGlasses || false;

  // Handle speech recognition results
  useSpeechRecognitionEvent('result', async (event) => {
    const transcript = event.results[0]?.transcript || '';
    const isFinal = event.isFinal;

    if (isFinal && transcript) {
      useSpeechStore.getState().setTranscript(transcript);
      useSpeechStore.getState().setListening(false);
      
      // Check for wake word if enabled
      if (metaRayBanSettings.wakeWordEnabled) {
        const wakeWord = metaRayBanSettings.customWakeWord.toLowerCase();
        const lowerTranscript = transcript.toLowerCase();
        
        if (lowerTranscript.includes(wakeWord)) {
          // Extract command after wake word
          const commandStart = lowerTranscript.indexOf(wakeWord) + wakeWord.length;
          const command = transcript.substring(commandStart).trim();
          
          if (command) {
            setIsProcessing(true);
            await executeCommand(command);
            setIsProcessing(false);
          }
        }
      } else {
        // No wake word, execute entire transcript as command
        setIsProcessing(true);
        await executeCommand(transcript);
        setIsProcessing(false);
      }
    } else {
      useSpeechStore.getState().setPartialTranscript(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    useSpeechStore.getState().setError(event.error);
    useSpeechStore.getState().setListening(false);
    notification('error');
  });

  useSpeechRecognitionEvent('start', () => {
    useSpeechStore.getState().setListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    useSpeechStore.getState().setListening(false);
  });

  // Pulse animation when listening
  useEffect(() => {
    if (speechState.isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [speechState.isListening, pulseAnim]);

  // Initialize speech service on mount
  useEffect(() => {
    speechService.initialize();
    
    // Set wake words
    if (metaRayBanSettings.customWakeWord) {
      speechService.setWakeWords([
        metaRayBanSettings.customWakeWord.toLowerCase(),
        'hey chrome',
        'okay chrome',
      ]);
    }
  }, [metaRayBanSettings.customWakeWord]);

  // Start listening for voice commands
  const startListening = useCallback(async () => {
    impact('medium');
    useSpeechStore.getState().reset();

    try {
      // Route audio through Bluetooth if glasses connected
      if (isGlassesConnected) {
        await bluetoothAudioManager.routeAudioToBluetooth();
      }

      // Start speech recognition
      await speechService.startListening({
        continuous: false,
        detectWakeWord: metaRayBanSettings.wakeWordEnabled,
      });
    } catch (error) {
      console.error('Failed to start listening:', error);
      useSpeechStore.getState().setError(`Failed to start: ${error}`);
    }
  }, [isGlassesConnected, metaRayBanSettings.wakeWordEnabled, impact]);

  // Stop listening
  const stopListening = useCallback(async () => {
    await speechService.stopListening();
  }, []);

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (speechState.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [speechState.isListening, startListening, stopListening]);

  const handleOpenSettings = () => {
    router.push('/meta-rayban' as any);
  };

  // Get status text
  const getStatusText = () => {
    if (speechState.error) {
      return `Error: ${speechState.error}`;
    }
    if (isProcessing) {
      return 'Processing command...';
    }
    if (speechState.isListening) {
      return speechState.partialTranscript || 'Listening...';
    }
    if (speechState.transcript) {
      return `"${speechState.transcript}"`;
    }
    if (metaRayBanSettings.wakeWordEnabled) {
      return `Say "${metaRayBanSettings.customWakeWord}" or tap the mic`;
    }
    return 'Tap the mic to speak a command';
  };

  // Get connection status
  const getConnectionStatus = () => {
    if (isGlassesConnected) {
      return {
        text: `${bluetoothState.connectedDevice?.name || 'Meta Glasses'} • Audio routed`,
        color: '#10B981',
        icon: 'glasses-outline' as const,
      };
    }
    if (bluetoothState.connectedDevice) {
      return {
        text: `${bluetoothState.connectedDevice.name} connected`,
        color: '#3B82F6',
        icon: 'bluetooth' as const,
      };
    }
    return {
      text: 'Tap to connect Meta Ray-Ban',
      color: '#71717A',
      icon: 'glasses-outline' as const,
    };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <View style={styles.voiceSection}>
      {/* Connection Status Bar */}
      <TouchableOpacity style={styles.statusBar} onPress={handleOpenSettings}>
        <View style={styles.statusLeft}>
          <Ionicons
            name={connectionStatus.icon}
            size={18}
            color={connectionStatus.color}
          />
          <Text style={[styles.statusText, { color: connectionStatus.color }]}>
            {connectionStatus.text}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#71717A" />
      </TouchableOpacity>

      {/* Voice Button */}
      <TouchableOpacity
        style={[
          styles.voiceButton,
          speechState.isListening && styles.voiceButtonListening,
          isGlassesConnected && !speechState.isListening && styles.voiceButtonConnected,
          isProcessing && styles.voiceButtonProcessing,
        ]}
        onPress={toggleListening}
        activeOpacity={0.8}
        disabled={isProcessing}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons
            name={speechState.isListening ? 'mic' : isProcessing ? 'hourglass' : 'mic-outline'}
            size={28}
            color="#FFF"
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Status Text */}
      <Text style={[
        styles.voiceStatus,
        speechState.error && styles.voiceStatusError,
        speechState.isListening && styles.voiceStatusListening,
      ]}>
        {getStatusText()}
      </Text>

      {/* Speaking indicator */}
      {speechState.isSpeaking && (
        <View style={styles.speakingIndicator}>
          <Ionicons name="volume-high" size={14} color="#8B5CF6" />
          <Text style={styles.speakingText}>Speaking...</Text>
        </View>
      )}

      {/* Quick Commands */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
        {/* Built-in quick commands */}
        <TouchableOpacity
          style={styles.quickCmd}
          onPress={() => executeCommand('read page')}
        >
          <Text style={styles.quickCmdText}>Read page</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickCmd}
          onPress={() => executeCommand('scroll down')}
        >
          <Text style={styles.quickCmdText}>Scroll down</Text>
        </TouchableOpacity>

        {/* Custom commands */}
        {enabledCommands.map((cmd) => (
          <TouchableOpacity
            key={cmd.id}
            style={[styles.quickCmd, cmd.isMetaRayBan && styles.quickCmdMeta]}
            onPress={() => executeCommand(cmd.triggerPhrase)}
          >
            <Text style={styles.quickCmdText}>{cmd.triggerPhrase}</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity style={styles.addQuickCmd} onPress={handleOpenSettings}>
          <Ionicons name="add" size={16} color="#8B5CF6" />
          <Text style={styles.addQuickCmdText}>Add</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  voiceSection: {
    backgroundColor: '#1F1F28',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
    alignItems: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    width: '100%',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  voiceButtonListening: {
    backgroundColor: '#EF4444',
  },
  voiceButtonConnected: {
    backgroundColor: '#10B981',
  },
  voiceButtonProcessing: {
    backgroundColor: '#F59E0B',
  },
  voiceStatus: {
    color: '#A1A1AA',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
    maxWidth: '90%',
  },
  voiceStatusError: {
    color: '#EF4444',
  },
  voiceStatusListening: {
    color: '#10B981',
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  speakingText: {
    color: '#8B5CF6',
    fontSize: 12,
  },
  quickScroll: {
    maxHeight: 40,
  },
  quickCmd: {
    backgroundColor: '#2A2A35',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickCmdMeta: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
  quickCmdText: {
    color: '#FAFAFA',
    fontSize: 13,
  },
  addQuickCmd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    gap: 4,
  },
  addQuickCmdText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '500',
  },
});
