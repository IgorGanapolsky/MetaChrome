import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface CommandLog {
  id: string;
  original_command: string;
  action: string;
  target_tab: string | null;
  response_text: string;
  status: string;
  timestamp: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(true);
  const [activeTab, setActiveTab] = useState('Claude Code');
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [customCommandCount, setCustomCommandCount] = useState(0);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/chrome-history?limit=10`);
      setCommandLogs(response.data);
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    }
  };

  const fetchCommandCount = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/custom-commands`);
      setCustomCommandCount(response.data.length);
    } catch (e) {
      console.error('Failed to fetch commands:', e);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchCommandCount();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.selectionAsync();
    Promise.all([fetchLogs(), fetchCommandCount()]).finally(() => setRefreshing(false));
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="google-chrome" size={28} color="#4285F4" />
          <Text style={styles.headerTitle}>Meta Chrome</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
      >
        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons name="glasses-outline" size={24} color="#8B5CF6" />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Ray-Ban Meta</Text>
              <Text style={[styles.statusText, isConnected ? styles.connected : styles.disconnected]}>
                {isConnected ? 'Connected • Voice ready' : 'Disconnected'}
              </Text>
            </View>
            <View style={[styles.statusDot, isConnected ? styles.dotGreen : styles.dotRed]} />
          </View>
        </View>

        {/* Active Tab */}
        <View style={styles.activeTabCard}>
          <Text style={styles.cardLabel}>ACTIVE BROWSER TAB</Text>
          <View style={styles.activeTabRow}>
            <View style={styles.tabIcon}>
              <MaterialCommunityIcons name="message-processing" size={28} color="#4285F4" />
            </View>
            <View style={styles.tabInfo}>
              <Text style={styles.tabName}>{activeTab}</Text>
              <Text style={styles.tabUrl}>claude.ai</Text>
            </View>
          </View>
        </View>

        {/* Custom Commands Card */}
        <TouchableOpacity
          style={styles.commandsCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/commands');
          }}
        >
          <View style={styles.commandsHeader}>
            <View style={styles.commandsLeft}>
              <Ionicons name="list" size={24} color="#8B5CF6" />
              <View>
                <Text style={styles.commandsTitle}>Custom Commands</Text>
                <Text style={styles.commandsSubtitle}>
                  {customCommandCount} command{customCommandCount !== 1 ? 's' : ''} configured
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#71717A" />
          </View>
          <Text style={styles.commandsHint}>
            Define voice commands for your glasses to control Chrome
          </Text>
        </TouchableOpacity>

        {/* Command Log */}
        <View style={styles.logSection}>
          <Text style={styles.cardLabel}>RECENT COMMANDS</Text>
          {commandLogs.length === 0 ? (
            <View style={styles.emptyLog}>
              <Ionicons name="mic-outline" size={32} color="#3F3F46" />
              <Text style={styles.emptyText}>No commands yet</Text>
              <Text style={styles.emptyHint}>Say "Hey Meta" to your glasses</Text>
            </View>
          ) : (
            commandLogs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logLeft}>
                  <View style={[styles.logDot, log.status === 'success' ? styles.dotGreen : styles.dotRed]} />
                  <View>
                    <Text style={styles.logCommand}>"{log.original_command}"</Text>
                    <Text style={styles.logResponse}>{log.response_text}</Text>
                  </View>
                </View>
                <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="mic" size={16} color="#52525B" />
        <Text style={styles.footerText}>Say "Hey Meta" to your glasses to start</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F28',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#1F1F28',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  statusText: {
    fontSize: 13,
    marginTop: 2,
  },
  connected: {
    color: '#22C55E',
  },
  disconnected: {
    color: '#EF4444',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotGreen: {
    backgroundColor: '#22C55E',
  },
  dotRed: {
    backgroundColor: '#EF4444',
  },
  activeTabCard: {
    backgroundColor: '#1F1F28',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  activeTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabInfo: {
    marginLeft: 12,
  },
  tabName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  tabUrl: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 2,
  },
  commandsCard: {
    backgroundColor: '#1F1F28',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  commandsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commandsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commandsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  commandsSubtitle: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 2,
  },
  commandsHint: {
    fontSize: 13,
    color: '#52525B',
    marginTop: 12,
  },
  logSection: {
    marginTop: 8,
  },
  emptyLog: {
    backgroundColor: '#1F1F28',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#71717A',
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: '#52525B',
    marginTop: 4,
  },
  logItem: {
    backgroundColor: '#1F1F28',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 10,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  logCommand: {
    fontSize: 14,
    color: '#FAFAFA',
    fontWeight: '500',
  },
  logResponse: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 4,
  },
  logTime: {
    fontSize: 11,
    color: '#52525B',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1F1F28',
  },
  footerText: {
    color: '#52525B',
    fontSize: 13,
  },
});
