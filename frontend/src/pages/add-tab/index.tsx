import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAddTab } from '@/features/add-tab';
import { useHaptics } from '@/shared/lib';

const presets = [
  { name: 'Claude', url: 'https://claude.ai', icon: 'chatbubble-ellipses' },
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon: 'sparkles' },
  { name: 'Cursor', url: 'https://cursor.com', icon: 'code-slash' },
  { name: 'GitHub', url: 'https://github.com', icon: 'logo-github' },
  { name: 'Google', url: 'https://google.com', icon: 'search' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: 'layers' },
];

export function AddTabPage() {
  const router = useRouter();
  const { addTab } = useAddTab();
  const { impact } = useHaptics();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const handleAddPreset = (preset: typeof presets[0]) => {
    impact('light');
    addTab(preset);
  };

  const handleAddCustom = () => {
    if (!url.trim()) return;
    addTab({
      name: name.trim() || '',
      url: url.trim(),
      icon: 'globe-outline',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#FAFAFA" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Tab</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>QUICK ADD</Text>
          <View style={styles.presetGrid}>
            {presets.map(preset => (
              <TouchableOpacity
                key={preset.url}
                style={styles.presetCard}
                onPress={() => handleAddPreset(preset)}
              >
                <Ionicons name={preset.icon as any} size={28} color="#8B5CF6" />
                <Text style={styles.presetName}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>CUSTOM URL</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="https://example.com"
              placeholderTextColor="#52525B"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TextInput
              style={styles.input}
              placeholder="Tab name (optional)"
              placeholderTextColor="#52525B"
              value={name}
              onChangeText={setName}
            />
            <TouchableOpacity
              style={[styles.addButton, !url.trim() && styles.addButtonDisabled]}
              onPress={handleAddCustom}
              disabled={!url.trim()}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>Add Tab</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F28',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  presetCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#1F1F28',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  presetName: {
    color: '#FAFAFA',
    fontSize: 12,
    fontWeight: '500',
  },
  inputGroup: {
    gap: 12,
  },
  input: {
    backgroundColor: '#1F1F28',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FAFAFA',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
