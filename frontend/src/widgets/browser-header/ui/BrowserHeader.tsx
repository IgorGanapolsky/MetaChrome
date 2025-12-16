import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BrowserHeaderProps {
  isConnected?: boolean;
  onToggleLogs?: () => void;
}

export function BrowserHeader({ isConnected = true, onToggleLogs }: BrowserHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Ionicons name="glasses-outline" size={24} color="#8B5CF6" />
        <Text style={styles.headerTitle}>Meta Chrome</Text>
      </View>
      <View style={styles.headerRight}>
        <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
        {onToggleLogs && (
          <TouchableOpacity style={styles.headerButton} onPress={onToggleLogs}>
            <Ionicons name="terminal-outline" size={22} color="#71717A" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F28',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connected: {
    backgroundColor: '#22C55E',
  },
  disconnected: {
    backgroundColor: '#EF4444',
  },
  headerButton: {
    padding: 4,
  },
});
