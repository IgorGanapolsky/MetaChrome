import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Voice controls disabled - speech recognition package removed to fix crash
export function VoiceControls() {
  return (
    <View style={styles.container}>
      <Ionicons name="mic-off-outline" size={24} color="#71717A" />
      <Text style={styles.text}>Voice controls temporarily unavailable</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#1F1F28',
    gap: 8,
  },
  text: {
    color: '#71717A',
    fontSize: 14,
  },
});
