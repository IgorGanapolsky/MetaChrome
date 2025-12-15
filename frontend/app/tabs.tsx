import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface BrowserTab {
  id: string;
  name: string;
  icon: string;
  url: string;
  lastActivity: string;
  preview: string;
}

const mockTabs: BrowserTab[] = [
  { 
    id: '1', 
    name: 'Claude Code', 
    icon: 'message-processing', 
    url: 'claude.ai/chat', 
    lastActivity: '2 min ago',
    preview: 'Last message: "I\'ve implemented the authentication flow..."'
  },
  { 
    id: '2', 
    name: 'Cursor Assistant', 
    icon: 'cursor-default-click', 
    url: 'cursor.com/assistant', 
    lastActivity: '15 min ago',
    preview: 'Working on: voice-command-app/src/index.tsx'
  },
  { 
    id: '3', 
    name: 'GitHub - voice-app', 
    icon: 'github', 
    url: 'github.com/user/voice-app', 
    lastActivity: '1 hour ago',
    preview: '3 new notifications, 2 PRs ready for review'
  },
  { 
    id: '4', 
    name: 'ChatGPT', 
    icon: 'robot', 
    url: 'chat.openai.com', 
    lastActivity: '3 hours ago',
    preview: 'Last conversation: "API integration patterns..."'
  },
  { 
    id: '5', 
    name: 'Stack Overflow', 
    icon: 'stack-overflow', 
    url: 'stackoverflow.com/questions', 
    lastActivity: 'Yesterday',
    preview: 'Saved question: "React Native gesture handling"'
  },
];

export default function TabsScreen() {
  const router = useRouter();
  const [tabs, setTabs] = useState<BrowserTab[]>(mockTabs);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTabs = tabs.filter(tab => 
    tab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTabSelect = (tab: BrowserTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCloseTab = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTabs(prev => prev.filter(t => t.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browser Tabs</Text>
        <View style={styles.tabCountBadge}>
          <Text style={styles.tabCountText}>{tabs.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#71717A" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tabs..."
          placeholderTextColor="#52525B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#71717A" />
          </TouchableOpacity>
        )}
      </View>

      {/* Voice Command Hint */}
      <View style={styles.voiceHint}>
        <Ionicons name="mic" size={16} color="#8B5CF6" />
        <Text style={styles.voiceHintText}>Say "Switch to [tab name]" to your glasses</Text>
      </View>

      {/* Tabs List */}
      <ScrollView style={styles.tabsList}>
        {filteredTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabCard}
            onPress={() => handleTabSelect(tab)}
            activeOpacity={0.7}
          >
            <View style={styles.tabIcon}>
              <MaterialCommunityIcons name={tab.icon as any} size={24} color="#4285F4" />
            </View>
            <View style={styles.tabInfo}>
              <Text style={styles.tabName}>{tab.name}</Text>
              <Text style={styles.tabUrl}>{tab.url}</Text>
              <Text style={styles.tabPreview} numberOfLines={1}>{tab.preview}</Text>
            </View>
            <View style={styles.tabActions}>
              <Text style={styles.tabTime}>{tab.lastActivity}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => handleCloseTab(tab.id)}
              >
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* New Tab Button */}
      <TouchableOpacity 
        style={styles.newTabButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <Ionicons name="add" size={24} color="#FFF" />
        <Text style={styles.newTabText}>New Tab</Text>
      </TouchableOpacity>
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
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  tabCountBadge: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tabCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F28',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FAFAFA',
    fontSize: 15,
    paddingVertical: 12,
    marginLeft: 10,
  },
  voiceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 10,
  },
  voiceHintText: {
    color: '#8B5CF6',
    fontSize: 13,
  },
  tabsList: {
    flex: 1,
    padding: 16,
  },
  tabCard: {
    flexDirection: 'row',
    backgroundColor: '#1F1F28',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  tabIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  tabName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  tabUrl: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  tabPreview: {
    fontSize: 12,
    color: '#52525B',
    marginTop: 4,
  },
  tabActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  tabTime: {
    fontSize: 11,
    color: '#52525B',
  },
  closeButton: {
    padding: 4,
  },
  newTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4285F4',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  newTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
