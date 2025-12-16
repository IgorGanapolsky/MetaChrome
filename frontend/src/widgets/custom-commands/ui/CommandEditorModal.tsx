import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useCustomCommandStore,
  CustomVoiceCommand,
  ActionType,
  ACTION_TYPE_LABELS,
  ACTION_TYPE_ICONS,
} from '@/entities/custom-command';

interface CommandEditorModalProps {
  visible: boolean;
  onClose: () => void;
  editCommand?: CustomVoiceCommand | null;
}

const ACTION_TYPES: ActionType[] = [
  'navigate',
  'switch_tab',
  'scroll',
  'read',
  'search',
  'refresh',
  'close_tab',
  'new_tab',
  'custom_script',
];

export function CommandEditorModal({
  visible,
  onClose,
  editCommand,
}: CommandEditorModalProps) {
  const { addCommand, updateCommand } = useCustomCommandStore();

  const [triggerPhrase, setTriggerPhrase] = useState('');
  const [actionType, setActionType] = useState<ActionType>('navigate');
  const [actionTarget, setActionTarget] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editCommand) {
      setTriggerPhrase(editCommand.triggerPhrase);
      setActionType(editCommand.actionType);
      setActionTarget(editCommand.actionTarget);
      setDescription(editCommand.description);
    } else {
      resetForm();
    }
  }, [editCommand, visible]);

  const resetForm = () => {
    setTriggerPhrase('');
    setActionType('navigate');
    setActionTarget('');
    setDescription('');
  };

  const handleSave = () => {
    if (!triggerPhrase.trim() || !actionTarget.trim()) {
      return;
    }

    if (editCommand) {
      updateCommand(editCommand.id, {
        triggerPhrase: triggerPhrase.toLowerCase().trim(),
        actionType,
        actionTarget: actionTarget.trim(),
        description: description.trim() || `${ACTION_TYPE_LABELS[actionType]}: ${actionTarget}`,
      });
    } else {
      addCommand({
        triggerPhrase: triggerPhrase.toLowerCase().trim(),
        actionType,
        actionTarget: actionTarget.trim(),
        description: description.trim(),
        isMetaRayBan: true,
      });
    }

    onClose();
    resetForm();
  };

  const getPlaceholderForActionType = (type: ActionType): string => {
    switch (type) {
      case 'navigate':
        return 'https://example.com';
      case 'switch_tab':
        return 'Tab name (e.g., GitHub, Claude)';
      case 'scroll':
        return 'up, down, top, bottom';
      case 'read':
        return 'page, selection, last response';
      case 'search':
        return 'Search query or leave empty for voice input';
      case 'refresh':
        return 'current (or leave empty)';
      case 'close_tab':
        return 'current or tab name';
      case 'new_tab':
        return 'URL for new tab';
      case 'custom_script':
        return 'JavaScript code to execute';
      default:
        return 'Action target';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editCommand ? 'Edit Command' : 'New Voice Command'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Trigger Phrase */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trigger Phrase</Text>
              <Text style={styles.hint}>
                What you&apos;ll say to activate this command
              </Text>
              <TextInput
                style={styles.input}
                value={triggerPhrase}
                onChangeText={setTriggerPhrase}
                placeholder="e.g., open my email"
                placeholderTextColor="#52525B"
                autoCapitalize="none"
              />
            </View>

            {/* Action Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Action Type</Text>
              <Text style={styles.hint}>What should happen when you say this</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.actionTypeScroll}
              >
                {ACTION_TYPES.map((type) => {
                  const iconName = ACTION_TYPE_ICONS[type] as keyof typeof Ionicons.glyphMap;
                  const isSelected = actionType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.actionTypeButton,
                        isSelected && styles.actionTypeButtonSelected,
                      ]}
                      onPress={() => setActionType(type)}
                    >
                      <Ionicons
                        name={iconName}
                        size={20}
                        color={isSelected ? '#FFF' : '#A1A1AA'}
                      />
                      <Text
                        style={[
                          styles.actionTypeText,
                          isSelected && styles.actionTypeTextSelected,
                        ]}
                      >
                        {ACTION_TYPE_LABELS[type].split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Action Target */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Action Target</Text>
              <Text style={styles.hint}>{ACTION_TYPE_LABELS[actionType]}</Text>
              <TextInput
                style={[
                  styles.input,
                  actionType === 'custom_script' && styles.multilineInput,
                ]}
                value={actionTarget}
                onChangeText={setActionTarget}
                placeholder={getPlaceholderForActionType(actionType)}
                placeholderTextColor="#52525B"
                autoCapitalize="none"
                multiline={actionType === 'custom_script'}
                numberOfLines={actionType === 'custom_script' ? 4 : 1}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <Text style={styles.hint}>
                A friendly description of what this command does
              </Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g., Opens my Gmail inbox"
                placeholderTextColor="#52525B"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!triggerPhrase.trim() || !actionTarget.trim()) &&
                  styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!triggerPhrase.trim() || !actionTarget.trim()}
            >
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {editCommand ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F1F28',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A35',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FAFAFA',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#71717A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A35',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#3A3A45',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionTypeScroll: {
    marginTop: 4,
  },
  actionTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A35',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#3A3A45',
  },
  actionTypeButtonSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  actionTypeText: {
    fontSize: 13,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  actionTypeTextSelected: {
    color: '#FFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#4A4A55',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
