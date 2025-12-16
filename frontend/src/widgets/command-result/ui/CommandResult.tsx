import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CommandResultProps {
  result: string | null;
  onDismiss: () => void;
}

export function CommandResult({ result, onDismiss }: CommandResultProps) {
  if (!result) return null;

  return (
    <View style={styles.resultPanel}>
      <View style={styles.resultContent}>
        <Ionicons name="chatbubble" size={16} color="#22C55E" />
        <Text style={styles.resultText} numberOfLines={2}>{result}</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Ionicons name="close" size={18} color="#71717A" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resultPanel: {
    backgroundColor: '#1F1F28',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultText: {
    flex: 1,
    color: '#FAFAFA',
    fontSize: 14,
  },
});
