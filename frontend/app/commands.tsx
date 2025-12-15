import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface CustomCommand {
  id: string;
  trigger_phrase: string;
  action_type: string;
  action_target: string;
  description: string;
  enabled: boolean;
}

export default function CommandsScreen() {
  const router = useRouter();
  const [commands, setCommands] = useState<CustomCommand[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCommands = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/custom-commands`);
      setCommands(response.data);
    } catch (e) {
      console.error('Failed to fetch commands:', e);
    }
  };

  useEffect(() => {
    fetchCommands();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.selectionAsync();
    fetchCommands().finally(() => setRefreshing(false));
  }, []);

  const handleDelete = (command: CustomCommand) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Command',
      `Delete "${command.trigger_phrase}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/custom-commands/${command.id}`);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchCommands();
            } catch (e) {
              console.error('Failed to delete:', e);
            }
          },
        },
      ]
    );
  };

  const toggleCommand = async (command: CustomCommand) => {
    Haptics.selectionAsync();
    try {
      await axios.patch(`${BACKEND_URL}/api/custom-commands/${command.id}`, {
        enabled: !command.enabled,
      });
      fetchCommands();
    } catch (e) {
      console.error('Failed to toggle:', e);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'switch_tab': return 'layers-outline';
      case 'read_content': return 'reader-outline';
      case 'send_message': return 'send-outline';
      case 'scroll': return 'swap-vertical-outline';
      case 'close_tab': return 'close-circle-outline';
      case 'new_tab': return 'add-circle-outline';
      default: return 'code-outline';
    }
  };

  const renderCommand = ({ item }: { item: CustomCommand }) => (
    <View style={[styles.commandCard, !item.enabled && styles.commandDisabled]}>
      <TouchableOpacity
        style={styles.commandContent}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/command-editor', params: { id: item.id } });
        }}
      >
        <View style={styles.commandIcon}>
          <Ionicons name={getActionIcon(item.action_type) as any} size={22} color="#8B5CF6" />
        </View>
        <View style={styles.commandInfo}>
          <Text style={styles.triggerPhrase}>"{item.trigger_phrase}"</Text>
          <Text style={styles.commandDescription}>{item.description}</Text>
          <View style={styles.commandMeta}>
            <Text style={styles.actionType}>{item.action_type.replace('_', ' ')}</Text>
            <Text style={styles.actionTarget}>→ {item.action_target}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.commandActions}>
        <TouchableOpacity onPress={() => toggleCommand(item)} style={styles.actionButton}>
          <Ionicons
            name={item.enabled ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={item.enabled ? '#22C55E' : '#52525B'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom Commands</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/command-editor');
          }}
        >
          <Ionicons name="add" size={28} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* Help Text */}
      <View style={styles.helpBar}>
        <Ionicons name="information-circle" size={18} color="#71717A" />
        <Text style={styles.helpText}>
          Create voice commands your glasses will recognize
        </Text>
      </View>

      {/* Commands List */}
      {commands.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="mic-outline" size={48} color="#3F3F46" />
          <Text style={styles.emptyTitle}>No Custom Commands</Text>
          <Text style={styles.emptySubtitle}>Tap + to create your first voice command</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/command-editor');
            }}
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.createButtonText}>Create Command</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={commands}
          renderItem={renderCommand}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
          }
        />
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F28',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FAFAFA',
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
  },
  helpBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1F1F28',
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#71717A',
  },
  listContent: {
    padding: 16,
  },
  commandCard: {
    backgroundColor: '#1F1F28',
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
  },
  commandDisabled: {
    opacity: 0.5,
  },
  commandContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 14,
  },
  commandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commandInfo: {
    flex: 1,
    marginLeft: 12,
  },
  triggerPhrase: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  commandDescription: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: 4,
  },
  commandMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  actionType: {
    fontSize: 11,
    color: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  actionTarget: {
    fontSize: 12,
    color: '#71717A',
  },
  commandActions: {
    justifyContent: 'center',
    paddingRight: 8,
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FAFAFA',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#71717A',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
