import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommandStore } from '@/entities/command';

interface CommandLogProps {
  visible: boolean;
  onClose: () => void;
}

export function CommandLog({ visible, onClose }: CommandLogProps) {
  const { commandHistory } = useCommandStore();

  if (!visible) return null;

  return (
    <View style={styles.logsPanel}>
      <View style={styles.logsHeader}>
        <Text style={styles.logsTitle}>Command Log</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={20} color="#71717A" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.logsScroll}>
        {commandHistory.length === 0 ? (
          <Text style={styles.noLogs}>No commands yet</Text>
        ) : (
          commandHistory.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <Text style={styles.logCommand}>&quot;{log.command}&quot;</Text>
              <Text style={styles.logResult}>{log.result}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  logsPanel: {
    backgroundColor: '#1F1F28',
    maxHeight: 150,
    padding: 12,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logsTitle: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '600',
  },
  logsScroll: {
    flex: 1,
  },
  noLogs: {
    color: '#52525B',
    fontSize: 13,
  },
  logItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A35',
  },
  logCommand: {
    color: '#8B5CF6',
    fontSize: 13,
  },
  logResult: {
    color: '#A1A1AA',
    fontSize: 12,
    marginTop: 2,
  },
});
