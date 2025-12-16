import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCustomCommandStore } from '@/entities/custom-command';

interface BrowserHeaderProps {
  isConnected?: boolean;
  onToggleLogs?: () => void;
}

export function BrowserHeader({ isConnected = true, onToggleLogs }: BrowserHeaderProps) {
  const router = useRouter();
  const { metaRayBanSettings } = useCustomCommandStore();

  const handleOpenMetaRayBan = () => {
    router.push('/meta-rayban' as any);
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={handleOpenMetaRayBan} style={styles.glassesButton}>
          <Ionicons
            name="glasses-outline"
            size={24}
            color={metaRayBanSettings.isConnected ? '#10B981' : '#8B5CF6'}
          />
          {metaRayBanSettings.isConnected && <View style={styles.connectedBadge} />}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meta Chrome</Text>
      </View>
      <View style={styles.headerRight}>
        <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
        {onToggleLogs && (
          <TouchableOpacity style={styles.headerButton} onPress={onToggleLogs}>
            <Ionicons name="terminal-outline" size={22} color="#71717A" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.headerButton} onPress={handleOpenMetaRayBan}>
          <Ionicons name="settings-outline" size={22} color="#71717A" />
        </TouchableOpacity>
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
  glassesButton: {
    position: 'relative',
  },
  connectedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#0A0A0F',
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
