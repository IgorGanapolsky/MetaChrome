import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useCustomCommandStore,
  CustomVoiceCommand,
  ACTION_TYPE_ICONS,
  ACTION_TYPE_LABELS,
} from '@/entities/custom-command';

interface CustomCommandsListProps {
  onEditCommand?: (command: CustomVoiceCommand) => void;
  onAddCommand?: () => void;
}

export function CustomCommandsList({ onEditCommand, onAddCommand }: CustomCommandsListProps) {
  const { commands, toggleCommand, deleteCommand } = useCustomCommandStore();

  const renderCommandItem = (command: CustomVoiceCommand) => {
    const iconName = ACTION_TYPE_ICONS[command.actionType] as keyof typeof Ionicons.glyphMap;

    return (
      <View key={command.id} style={styles.commandItem}>
        <View style={styles.commandIcon}>
          <Ionicons name={iconName} size={24} color="#8B5CF6" />
        </View>

        <View style={styles.commandContent}>
          <Text style={styles.triggerPhrase}>&quot;{command.triggerPhrase}&quot;</Text>
          <Text style={styles.actionLabel}>{ACTION_TYPE_LABELS[command.actionType]}</Text>
          <Text style={styles.actionTarget} numberOfLines={1}>
            {command.actionTarget}
          </Text>
        </View>

        <View style={styles.commandActions}>
          <Switch
            value={command.enabled}
            onValueChange={() => toggleCommand(command.id)}
            trackColor={{ false: '#3A3A45', true: '#8B5CF6' }}
            thumbColor={command.enabled ? '#FFF' : '#888'}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={() => onEditCommand?.(command)}>
              <Ionicons name="pencil-outline" size={18} color="#A1A1AA" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => deleteCommand(command.id)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="mic-outline" size={24} color="#8B5CF6" />
          <Text style={styles.headerTitle}>Custom Voice Commands</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onAddCommand}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Create custom voice commands for your Meta Ray-Ban glasses
      </Text>

      <ScrollView style={styles.commandsList} showsVerticalScrollIndicator={false}>
        {commands.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mic-off-outline" size={48} color="#3A3A45" />
            <Text style={styles.emptyText}>No custom commands yet</Text>
            <Text style={styles.emptySubtext}>
              Tap &quot;Add&quot; to create your first voice command
            </Text>
          </View>
        ) : (
          commands.map(renderCommandItem)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  subtitle: {
    fontSize: 14,
    color: '#71717A',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  commandsList: {
    flex: 1,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F28',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  commandIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commandContent: {
    flex: 1,
  },
  triggerPhrase: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FAFAFA',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    color: '#8B5CF6',
    marginBottom: 2,
  },
  actionTarget: {
    fontSize: 12,
    color: '#71717A',
  },
  commandActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#71717A',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#52525B',
    marginTop: 8,
  },
});
