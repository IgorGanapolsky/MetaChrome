import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const actionTypes = [
  { id: 'switch_tab', label: 'Switch Tab', icon: 'layers-outline', description: 'Switch to a specific browser tab' },
  { id: 'read_content', label: 'Read Content', icon: 'reader-outline', description: 'Read text from the page aloud' },
  { id: 'send_message', label: 'Send Message', icon: 'send-outline', description: 'Type and send a message' },
  { id: 'scroll', label: 'Scroll', icon: 'swap-vertical-outline', description: 'Scroll up or down on the page' },
  { id: 'new_tab', label: 'Open New Tab', icon: 'add-circle-outline', description: 'Open a new browser tab' },
  { id: 'close_tab', label: 'Close Tab', icon: 'close-circle-outline', description: 'Close the current tab' },
];

export default function CommandEditor() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [triggerPhrase, setTriggerPhrase] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchCommand();
    }
  }, [id]);

  const fetchCommand = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/custom-commands/${id}`);
      const cmd = response.data;
      setTriggerPhrase(cmd.trigger_phrase);
      setSelectedAction(cmd.action_type);
      setActionTarget(cmd.action_target);
      setDescription(cmd.description);
    } catch (e) {
      console.error('Failed to fetch command:', e);
      Alert.alert('Error', 'Failed to load command');
    }
  };

  const handleSave = async () => {
    if (!triggerPhrase.trim()) {
      Alert.alert('Error', 'Please enter a trigger phrase');
      return;
    }
    if (!selectedAction) {
      Alert.alert('Error', 'Please select an action type');
      return;
    }
    if (!actionTarget.trim()) {
      Alert.alert('Error', 'Please enter an action target');
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const payload = {
        trigger_phrase: triggerPhrase.trim(),
        action_type: selectedAction,
        action_target: actionTarget.trim(),
        description: description.trim() || `${selectedAction.replace('_', ' ')} → ${actionTarget}`,
        enabled: true,
      };

      if (isEditing) {
        await axios.put(`${BACKEND_URL}/api/custom-commands/${id}`, payload);
      } else {
        await axios.post(`${BACKEND_URL}/api/custom-commands`, payload);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.error('Failed to save:', e);
      Alert.alert('Error', 'Failed to save command');
    } finally {
      setSaving(false);
    }
  };

  const getPlaceholder = () => {
    switch (selectedAction) {
      case 'switch_tab': return 'e.g., Claude Code, GitHub, ChatGPT';
      case 'read_content': return 'e.g., last response, first paragraph';
      case 'send_message': return 'e.g., go ahead and proceed';
      case 'scroll': return 'e.g., down, up, to top';
      case 'new_tab': return 'e.g., cursor.com, google.com';
      default: return 'Enter target...';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Command' : 'New Command'}</Text>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Trigger Phrase */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>VOICE TRIGGER</Text>
            <Text style={styles.sectionHint}>What you'll say to your glasses</Text>
            <TextInput
              style={styles.textInput}
              placeholder='e.g., "Open Claude Code"'
              placeholderTextColor="#52525B"
              value={triggerPhrase}
              onChangeText={setTriggerPhrase}
            />
          </View>

          {/* Action Type */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACTION TYPE</Text>
            <Text style={styles.sectionHint}>What the command will do</Text>
            <View style={styles.actionGrid}>
              {actionTypes.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.actionCard,
                    selectedAction === action.id && styles.actionCardSelected,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedAction(action.id);
                  }}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={24}
                    color={selectedAction === action.id ? '#8B5CF6' : '#71717A'}
                  />
                  <Text
                    style={[
                      styles.actionLabel,
                      selectedAction === action.id && styles.actionLabelSelected,
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Target */}
          {selectedAction && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TARGET</Text>
              <Text style={styles.sectionHint}>
                {actionTypes.find((a) => a.id === selectedAction)?.description}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={getPlaceholder()}
                placeholderTextColor="#52525B"
                value={actionTarget}
                onChangeText={setActionTarget}
              />
            </View>
          )}

          {/* Description (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPTION (OPTIONAL)</Text>
            <Text style={styles.sectionHint}>A note to help you remember this command</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Opens my main coding assistant"
              placeholderTextColor="#52525B"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Preview */}
          {triggerPhrase && selectedAction && actionTarget && (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>PREVIEW</Text>
              <Text style={styles.previewTrigger}>"Hey Meta, {triggerPhrase}"</Text>
              <View style={styles.previewArrow}>
                <Ionicons name="arrow-down" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.previewAction}>
                {selectedAction.replace('_', ' ')} → {actionTarget}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F28',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#A1A1AA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: '#52525B',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#1F1F28',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FAFAFA',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '31%',
    backgroundColor: '#1F1F28',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  actionCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  actionLabel: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 8,
    textAlign: 'center',
  },
  actionLabelSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#1F1F28',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  previewTrigger: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FAFAFA',
  },
  previewArrow: {
    marginVertical: 10,
  },
  previewAction: {
    fontSize: 14,
    color: '#8B5CF6',
  },
});
