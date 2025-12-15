import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useBrowser } from '../src/context/BrowserContext';

export default function Browser() {
  const router = useRouter();
  const {
    tabs,
    activeTabId,
    setActiveTab,
    removeTab,
    addCommandLog,
    commandHistory,
  } = useBrowser();
  
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected] = useState(true);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  // Command execution
  const executeVoiceCommand = useCallback(async (command: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    
    const cmd = command.toLowerCase();
    let result = '';

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (cmd.includes('read')) {
        result = "Claude says: \"I've analyzed your code and found a few improvements we can make...\"";
      } else if (cmd.includes('scroll')) {
        result = cmd.includes('up') ? 'Scrolled up' : 'Scrolled down';
      } else if (cmd.includes('github')) {
        const tab = tabs.find(t => t.name === 'GitHub');
        if (tab) {
          setActiveTab(tab.id);
          result = 'Switched to GitHub';
        } else {
          result = 'GitHub tab not found';
        }
      } else if (cmd.includes('claude')) {
        const tab = tabs.find(t => t.name === 'Claude');
        if (tab) {
          setActiveTab(tab.id);
          result = 'Switched to Claude';
        } else {
          result = 'Claude tab not found';
        }
      } else if (cmd.includes('tabs')) {
        result = `${tabs.length} tabs: ${tabs.map(t => t.name).join(', ')}`;
      } else {
        result = `Got: ${command}`;
      }
      
      setLastResult(result);
      addCommandLog({ command, action: 'executed', result });
      
      // Show alert popup
      Alert.alert('Voice Command', result);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      const errorMsg = e.message || 'Command failed';
      setLastResult(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [tabs, setActiveTab, addCommandLog]);

  const handleTabPress = useCallback((tabId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tabId);
  }, [setActiveTab]);

  const handleCloseTab = useCallback((tabId: string) => {
    if (tabs.length > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      removeTab(tabId);
    }
  }, [removeTab, tabs.length]);

  const startListening = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLastResult('Voice input requires development build. Use buttons below.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="glasses-outline" size={24} color="#8B5CF6" />
          <Text style={styles.headerTitle}>Meta Chrome</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowLogs(!showLogs)}>
            <Ionicons name="terminal-outline" size={22} color="#71717A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTabId === tab.id && styles.tabActive]}
              onPress={() => handleTabPress(tab.id)}
              onLongPress={() => handleCloseTab(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTabId === tab.id ? '#8B5CF6' : '#71717A'}
              />
              <Text style={[styles.tabText, activeTabId === tab.id && styles.tabTextActive]} numberOfLines={1}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addTab} onPress={() => router.push('/add-tab')}>
            <Ionicons name="add" size={20} color="#71717A" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Browser Content */}
      <View style={styles.browserContainer}>
        {activeTab ? (
          Platform.OS === 'web' ? (
            <View style={styles.simulatedBrowser}>
              <View style={styles.browserUrlBar}>
                <Ionicons name="lock-closed" size={12} color="#22C55E" />
                <Text style={styles.browserUrl}>{activeTab.url}</Text>
              </View>
              <ScrollView style={styles.simulatedContent}>
                {activeTab.name === 'Claude' && (
                  <View style={styles.chatSimulation}>
                    <View style={styles.userBubble}>
                      <Text style={styles.chatText}>How do I implement auth?</Text>
                    </View>
                    <View style={styles.assistantBubble}>
                      <Text style={styles.chatText}>I'll help you implement authentication. Here are the steps:{'\n\n'}1. Choose provider{'\n'}2. Install packages{'\n'}3. Set up context{'\n'}4. Add login flow</Text>
                    </View>
                  </View>
                )}
                {activeTab.name === 'GitHub' && (
                  <View style={styles.githubSimulation}>
                    <View style={styles.repoHeader}>
                      <Ionicons name="logo-github" size={24} color="#FAFAFA" />
                      <Text style={styles.repoName}>meta-chrome-app</Text>
                    </View>
                    <View style={styles.fileList}>
                      <View style={styles.fileItem}><Ionicons name="folder" size={16} color="#8B5CF6" /><Text style={styles.fileName}>src/</Text></View>
                      <View style={styles.fileItem}><Ionicons name="folder" size={16} color="#8B5CF6" /><Text style={styles.fileName}>app/</Text></View>
                      <View style={styles.fileItem}><Ionicons name="document" size={16} color="#71717A" /><Text style={styles.fileName}>README.md</Text></View>
                    </View>
                  </View>
                )}
                {!['Claude', 'GitHub'].includes(activeTab.name) && (
                  <View style={styles.genericPage}>
                    <Text style={styles.genericTitle}>{activeTab.name}</Text>
                    <Text style={styles.genericUrl}>{activeTab.url}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ) : (
            <WebView
              ref={webViewRef}
              source={{ uri: activeTab.url }}
              style={styles.webview}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          )
        ) : (
          <View style={styles.noTab}>
            <Ionicons name="globe-outline" size={48} color="#3F3F46" />
            <Text style={styles.noTabText}>No tab selected</Text>
          </View>
        )}
      </View>

      {/* Result Display */}
      {lastResult && (
        <View style={styles.resultPanel}>
          <View style={styles.resultContent}>
            <Ionicons name="chatbubble" size={16} color="#22C55E" />
            <Text style={styles.resultText} numberOfLines={2}>{lastResult}</Text>
            <TouchableOpacity onPress={() => setLastResult(null)}>
              <Ionicons name="close" size={18} color="#71717A" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Command Log */}
      {showLogs && (
        <View style={styles.logsPanel}>
          <View style={styles.logsHeader}>
            <Text style={styles.logsTitle}>Command Log</Text>
            <TouchableOpacity onPress={() => setShowLogs(false)}>
              <Ionicons name="close" size={20} color="#71717A" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.logsScroll}>
            {commandHistory.length === 0 ? (
              <Text style={styles.noLogs}>No commands yet</Text>
            ) : (
              commandHistory.map(log => (
                <View key={log.id} style={styles.logItem}>
                  <Text style={styles.logCommand}>"{log.command}"</Text>
                  <Text style={styles.logResult}>{log.result}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Voice Section */}
      <View style={styles.voiceSection}>
        <TouchableOpacity style={styles.voiceButton} onPress={startListening} activeOpacity={0.8}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={28} color="#FFF" />
          </Animated.View>
        </TouchableOpacity>
        
        <Text style={styles.voiceStatus}>
          {isListening ? (transcript || 'Listening...') : 'Tap buttons to test commands'}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
          <TouchableOpacity style={styles.quickCmd} onPress={() => executeVoiceCommand('Read last response')}>
            <Text style={styles.quickCmdText}>Read last response</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCmd} onPress={() => executeVoiceCommand('Scroll down')}>
            <Text style={styles.quickCmdText}>Scroll down</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCmd} onPress={() => executeVoiceCommand('Switch to GitHub')}>
            <Text style={styles.quickCmdText}>Switch to GitHub</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCmd} onPress={() => executeVoiceCommand('What tabs')}>
            <Text style={styles.quickCmdText}>List tabs</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1F1F28' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FAFAFA' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  connected: { backgroundColor: '#22C55E' },
  disconnected: { backgroundColor: '#EF4444' },
  headerButton: { padding: 4 },
  tabBar: { backgroundColor: '#1F1F28', borderBottomWidth: 1, borderBottomColor: '#2A2A35' },
  tabScroll: { paddingHorizontal: 8, paddingVertical: 8, gap: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0A0A0F', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 6 },
  tabActive: { backgroundColor: '#2A2A35', borderWidth: 1, borderColor: '#8B5CF6' },
  tabText: { fontSize: 13, color: '#71717A', maxWidth: 80 },
  tabTextActive: { color: '#FAFAFA', fontWeight: '500' },
  addTab: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center' },
  browserContainer: { flex: 1, backgroundColor: '#FFF' },
  webview: { flex: 1 },
  noTab: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' },
  noTabText: { color: '#52525B', fontSize: 16, marginTop: 12 },
  simulatedBrowser: { flex: 1, backgroundColor: '#0A0A0F' },
  browserUrlBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1F1F28', paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 8, marginTop: 8, borderRadius: 8 },
  browserUrl: { color: '#A1A1AA', fontSize: 12 },
  simulatedContent: { flex: 1, padding: 12 },
  chatSimulation: { flex: 1 },
  userBubble: { backgroundColor: '#8B5CF6', padding: 12, borderRadius: 16, alignSelf: 'flex-end', maxWidth: '85%', marginBottom: 12 },
  assistantBubble: { backgroundColor: '#1F1F28', padding: 12, borderRadius: 16, alignSelf: 'flex-start', maxWidth: '85%' },
  chatText: { color: '#FAFAFA', fontSize: 14, lineHeight: 20 },
  githubSimulation: { flex: 1 },
  repoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  repoName: { color: '#FAFAFA', fontSize: 18, fontWeight: '600' },
  fileList: { backgroundColor: '#1F1F28', borderRadius: 12, padding: 8 },
  fileItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#2A2A35' },
  fileName: { color: '#FAFAFA', fontSize: 14 },
  genericPage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  genericTitle: { color: '#FAFAFA', fontSize: 20, fontWeight: '600' },
  genericUrl: { color: '#71717A', fontSize: 14, marginTop: 8 },
  resultPanel: { backgroundColor: '#1F1F28', paddingHorizontal: 12, paddingVertical: 10 },
  resultContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultText: { flex: 1, color: '#FAFAFA', fontSize: 14 },
  logsPanel: { backgroundColor: '#1F1F28', maxHeight: 150, padding: 12 },
  logsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logsTitle: { color: '#FAFAFA', fontSize: 14, fontWeight: '600' },
  logsScroll: { flex: 1 },
  noLogs: { color: '#52525B', fontSize: 13 },
  logItem: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#2A2A35' },
  logCommand: { color: '#8B5CF6', fontSize: 13 },
  logResult: { color: '#A1A1AA', fontSize: 12, marginTop: 2 },
  voiceSection: { backgroundColor: '#1F1F28', paddingVertical: 16, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#2A2A35', alignItems: 'center' },
  voiceButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  voiceStatus: { color: '#A1A1AA', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  quickScroll: { maxHeight: 40 },
  quickCmd: { backgroundColor: '#2A2A35', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
  quickCmdText: { color: '#FAFAFA', fontSize: 13 },
});
