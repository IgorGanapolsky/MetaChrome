import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVoiceCommands } from '@/features/voice-commands';
import { useCustomCommandStore } from '@/entities/custom-command';
import { useHaptics } from '@/shared/lib';

export function VoiceControls() {
  const router = useRouter();
  const { executeCommand } = useVoiceCommands();
  const { commands, metaRayBanSettings } = useCustomCommandStore();
  const { impact } = useHaptics();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get enabled custom commands for quick access
  const enabledCommands = commands.filter((cmd) => cmd.enabled).slice(0, 6);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  const startListening = () => {
    impact('medium');
    if (metaRayBanSettings.isConnected) {
      setTranscript('Listening via Meta Ray-Ban...');
      setIsListening(true);
      // Simulate listening for demo purposes
      setTimeout(() => {
        setIsListening(false);
        setTranscript('');
      }, 3000);
    } else {
      setTranscript('Connect Meta Ray-Ban glasses for voice input');
    }
  };

  const handleOpenSettings = () => {
    router.push('/meta-rayban' as any);
  };

  return (
    <View style={styles.voiceSection}>
      {/* Meta Ray-Ban Status Bar */}
      <TouchableOpacity style={styles.statusBar} onPress={handleOpenSettings}>
        <View style={styles.statusLeft}>
          <Ionicons
            name="glasses-outline"
            size={18}
            color={metaRayBanSettings.isConnected ? '#10B981' : '#71717A'}
          />
          <Text
            style={[
              styles.statusText,
              metaRayBanSettings.isConnected && styles.statusTextConnected,
            ]}
          >
            {metaRayBanSettings.isConnected
              ? `${metaRayBanSettings.deviceName} • ${metaRayBanSettings.batteryLevel}%`
              : 'Tap to connect Meta Ray-Ban'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#71717A" />
      </TouchableOpacity>

      {/* Voice Button */}
      <TouchableOpacity
        style={[
          styles.voiceButton,
          metaRayBanSettings.isConnected && styles.voiceButtonConnected,
        ]}
        onPress={startListening}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            size={28}
            color="#FFF"
          />
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.voiceStatus}>
        {isListening
          ? transcript || 'Listening...'
          : metaRayBanSettings.wakeWordEnabled
          ? `Say "${metaRayBanSettings.customWakeWord}" or tap buttons`
          : 'Tap buttons to test commands'}
      </Text>

      {/* Quick Commands - Now shows custom commands */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
        {enabledCommands.map((cmd) => (
          <TouchableOpacity
            key={cmd.id}
            style={styles.quickCmd}
            onPress={async () => {
              await executeCommand(cmd.triggerPhrase);
            }}
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
    color: '#71717A',
  },
  statusTextConnected: {
    color: '#10B981',
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
  voiceButtonConnected: {
    backgroundColor: '#10B981',
  },
  voiceStatus: {
    color: '#A1A1AA',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
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
