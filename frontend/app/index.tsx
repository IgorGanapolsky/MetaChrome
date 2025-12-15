import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface CommandResponse {
  id: string;
  original_command: string;
  action: string;
  target_tab: string | null;
  response_text: string;
  status: 'success' | 'pending' | 'error';
  timestamp: string;
}

interface BrowserTab {
  id: string;
  name: string;
  icon: string;
  url: string;
  active: boolean;
  hasUnread: boolean;
}

// Simulated browser tabs
const mockTabs: BrowserTab[] = [
  { id: '1', name: 'Claude Code', icon: 'message-processing', url: 'claude.ai', active: true, hasUnread: true },
  { id: '2', name: 'Cursor Assistant', icon: 'cursor-default-click', url: 'cursor.com', active: false, hasUnread: false },
  { id: '3', name: 'GitHub', icon: 'github', url: 'github.com', active: false, hasUnread: true },
  { id: '4', name: 'ChatGPT', icon: 'robot', url: 'chat.openai.com', active: false, hasUnread: false },
  { id: '5', name: 'Google Search', icon: 'google', url: 'google.com', active: false, hasUnread: false },
];

const quickCommands = [
  { text: 'Open Claude Code tab', icon: 'message-processing' },
  { text: 'Read Claude\'s last response', icon: 'text-to-speech' },
  { text: 'Reply: go ahead and proceed', icon: 'send' },
  { text: 'Switch to GitHub tab', icon: 'github' },
  { text: 'Open new tab with Cursor', icon: 'cursor-default-click' },
  { text: 'Close current tab', icon: 'close-box' },
];

export default function MetaChrome() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<CommandResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabs, setTabs] = useState<BrowserTab[]>(mockTabs);
  const [isConnected, setIsConnected] = useState(true);
  
  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    // Pulse animation for connection indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'success' | 'error') => {
    switch (type) {
      case 'light': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
      case 'medium': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
      case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
      case 'error': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
    }
  }, []);

  const processCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    triggerHaptic('light');
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/chrome-command`, {
        command: command.trim(),
      });
      
      const data: CommandResponse = response.data;
      setLastResponse(data);
      triggerHaptic('success');
      
      // Simulate tab switching if needed
      if (data.target_tab) {
        setTabs(prev => prev.map(tab => ({
          ...tab,
          active: tab.name.toLowerCase().includes(data.target_tab!.toLowerCase())
        })));
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.detail || 'Command failed');
      triggerHaptic('error');
    } finally {
      setIsProcessing(false);
      setInputText('');
    }
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    processCommand(inputText);
  };

  const handleQuickCommand = (command: string) => {
    triggerHaptic('light');
    processCommand(command);
  };

  const handleTabPress = (tab: BrowserTab) => {
    triggerHaptic('light');
    setTabs(prev => prev.map(t => ({ ...t, active: t.id === tab.id })));
    processCommand(`Switch to ${tab.name} tab`);
  };

  const activeTab = tabs.find(t => t.active);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="google-chrome" size={28} color="#4285F4" />
            <Text style={styles.headerTitle}>Meta Chrome</Text>
          </View>
          <View style={styles.headerRight}>
            <Animated.View style={[styles.connectionDot, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.dot, isConnected ? styles.dotConnected : styles.dotDisconnected]} />
            </Animated.View>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => {
                triggerHaptic('light');
                router.push('/tabs');
              }}
            >
              <Ionicons name="layers-outline" size={24} color="#A1A1AA" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Glasses Connection Status */}
        <View style={styles.connectionBar}>
          <View style={styles.connectionInfo}>
            <Ionicons name="glasses-outline" size={18} color="#8B5CF6" />
            <Text style={styles.connectionText}>Ray-Ban Meta Connected</Text>
          </View>
          <Text style={styles.connectionHint}>Voice commands ready</Text>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Active Tab Display */}
          <View style={styles.activeTabCard}>
            <View style={styles.activeTabHeader}>
              <Text style={styles.activeTabLabel}>ACTIVE TAB</Text>
              <View style={styles.tabCount}>
                <Text style={styles.tabCountText}>{tabs.length} tabs</Text>
              </View>
            </View>
            {activeTab && (
              <View style={styles.activeTabContent}>
                <View style={styles.activeTabIcon}>
                  <MaterialCommunityIcons name={activeTab.icon as any} size={32} color="#4285F4" />
                </View>
                <View style={styles.activeTabInfo}>
                  <Text style={styles.activeTabName}>{activeTab.name}</Text>
                  <Text style={styles.activeTabUrl}>{activeTab.url}</Text>
                </View>
                {activeTab.hasUnread && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>NEW</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Tab Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabItem, tab.active && styles.tabItemActive]}
                onPress={() => handleTabPress(tab)}
              >
                <MaterialCommunityIcons 
                  name={tab.icon as any} 
                  size={20} 
                  color={tab.active ? '#4285F4' : '#71717A'} 
                />
                {tab.hasUnread && <View style={styles.tabDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Command Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>VOICE COMMAND</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mic" size={20} color="#8B5CF6" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Type or speak a command..."
                placeholderTextColor="#52525B"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSubmit}
                returnKeyType="send"
              />
              <TouchableOpacity 
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={handleSubmit}
                disabled={!inputText.trim() || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Last Response */}
          {lastResponse && (
            <View style={styles.responseCard}>
              <View style={styles.responseHeader}>
                <View style={[styles.statusDot, 
                  lastResponse.status === 'success' && styles.statusSuccess,
                  lastResponse.status === 'error' && styles.statusError,
                ]} />
                <Text style={styles.responseAction}>{lastResponse.action}</Text>
              </View>
              <Text style={styles.responseText}>{lastResponse.response_text}</Text>
              {lastResponse.target_tab && (
                <View style={styles.targetTab}>
                  <Ionicons name="arrow-forward" size={14} color="#4285F4" />
                  <Text style={styles.targetTabText}>{lastResponse.target_tab}</Text>
                </View>
              )}
            </View>
          )}

          {/* Quick Commands */}
          <View style={styles.quickSection}>
            <Text style={styles.quickTitle}>Quick Commands</Text>
            <View style={styles.quickGrid}>
              {quickCommands.map((cmd, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickItem}
                  onPress={() => handleQuickCommand(cmd.text)}
                >
                  <MaterialCommunityIcons name={cmd.icon as any} size={20} color="#8B5CF6" />
                  <Text style={styles.quickText} numberOfLines={2}>{cmd.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Say "Hey Meta" to your glasses to start</Text>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F28',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectionDot: {
    padding: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotConnected: {
    backgroundColor: '#22C55E',
  },
  dotDisconnected: {
    backgroundColor: '#EF4444',
  },
  headerButton: {
    padding: 8,
  },
  connectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1F1F28',
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '500',
  },
  connectionHint: {
    color: '#22C55E',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  activeTabCard: {
    backgroundColor: '#1F1F28',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  activeTabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
  },
  tabCount: {
    backgroundColor: '#2A2A35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabCountText: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  activeTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTabIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activeTabName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  activeTabUrl: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  tabBar: {
    marginBottom: 16,
  },
  tabItem: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1F1F28',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: '#2A2A35',
    borderWidth: 2,
    borderColor: '#4285F4',
  },
  tabDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F28',
    borderRadius: 14,
    paddingLeft: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#FAFAFA',
    fontSize: 15,
    paddingVertical: 14,
  },
  sendButton: {
    backgroundColor: '#4285F4',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#3F3F46',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
  },
  responseCard: {
    backgroundColor: '#1F1F28',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  statusSuccess: {
    backgroundColor: '#22C55E',
  },
  statusError: {
    backgroundColor: '#EF4444',
  },
  responseAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1AA',
    textTransform: 'uppercase',
  },
  responseText: {
    fontSize: 15,
    color: '#FAFAFA',
    lineHeight: 22,
  },
  targetTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#0A0A0F',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  targetTabText: {
    fontSize: 12,
    color: '#4285F4',
    fontWeight: '500',
  },
  quickSection: {
    marginTop: 8,
  },
  quickTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickItem: {
    width: '48.5%',
    backgroundColor: '#1F1F28',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickText: {
    flex: 1,
    fontSize: 13,
    color: '#FAFAFA',
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1F1F28',
  },
  footerText: {
    color: '#52525B',
    fontSize: 12,
  },
});
