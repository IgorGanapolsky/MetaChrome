import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceCommands } from '@/features/voice-commands';
import { useHaptics } from '@/shared/lib';

export function VoiceControls() {
  const { executeCommand } = useVoiceCommands();
  const { impact } = useHaptics();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
    setTranscript('Voice input requires development build. Use buttons below.');
  };

  const quickCommands = ['Read last response', 'Scroll down', 'Switch to GitHub', 'What tabs'];

  return (
    <View style={styles.voiceSection}>
      <TouchableOpacity style={styles.voiceButton} onPress={startListening} activeOpacity={0.8}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={28} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.voiceStatus}>
        {isListening ? transcript || 'Listening...' : 'Tap buttons to test commands'}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
        {quickCommands.map((cmd) => (
          <TouchableOpacity
            key={cmd}
            style={styles.quickCmd}
            onPress={async () => {
              const result = await executeCommand(cmd);
              // Result is handled by useVoiceCommands (shows alert)
            }}
          >
            <Text style={styles.quickCmdText}>{cmd}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  voiceSection: {
    backgroundColor: '#1F1F28',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
    alignItems: 'center',
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
});
