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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useBrowser } from '../src/context/BrowserContext';

// Speech recognition - works on Web, needs dev build for mobile
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;

try {
  const speechModule = require('@jamsch/expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
} catch (e) {
  console.log('Speech recognition not available');
}

export default function Browser() {
  const router = useRouter();
  const {
    tabs,
    activeTabId,
    setActiveTab,
    removeTab,
    executeCommand,
    addCommandLog,
    commandHistory,
  } = useBrowser();
  
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  
  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
  }, [isListening]);

  // Speech recognition event handlers
  if (useSpeechRecognitionEvent) {
    useSpeechRecognitionEvent('result', (event: any) => {
      const text = event.results[0]?.transcript || '';
      setTranscript(text);
    });
    
    useSpeechRecognitionEvent('end', () => {
      setIsListening(false);
      if (transcript) {
        simulateCommand(transcript);
        setTranscript('');
      }
    });
    
    useSpeechRecognitionEvent('error', (event: any) => {
      console.log('Speech error:', event.error);
      setIsListening(false);
    });
  }

  const startListening = async () => {
    if (!ExpoSpeechRecognitionModule) {
      setLastResult('Speech recognition not available. Use test buttons below.');
      return;
    }
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTranscript('');
      setIsListening(true);
      
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });
    } catch (e: any) {
      console.error('Speech start error:', e);
      setIsListening(false);
      setLastResult('Could not start voice input. Check microphone permissions.');
    }
  };

  const stopListening = async () => {
    if (ExpoSpeechRecognitionModule) {
      try {
        await ExpoSpeechRecognitionModule.stop();
      } catch (e) {
        console.error('Speech stop error:', e);
      }
    }
    setIsListening(false);
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleTabPress = useCallback((tabId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tabId);
    setLastResult(null);
  }, [setActiveTab]);

  const handleCloseTab = useCallback((tabId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeTab(tabId);
  }, [removeTab]);

  // Check if we're on web platform
  const isWeb = Platform.OS === 'web';

  // Simulated command execution (in real app, this comes from glasses)
  const simulateCommand = useCallback(async (command: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);
    
    const cmd = command.toLowerCase();
    let result = '';

    // Always use local simulation for test buttons
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (cmd.includes('read')) {
        result = "Here's Claude's response: \"I've analyzed your code and found a few issues. First, the authentication flow needs to handle edge cases better. Second, consider adding error boundaries around async operations...\"";
      } else if (cmd.includes('scroll')) {
        result = cmd.includes('up') ? 'Scrolled up' : 'Scrolled down';
      } else if (cmd.includes('switch') || cmd.includes('github')) {
        const tabName = cmd.includes('github') ? 'GitHub' : cmd.includes('claude') ? 'Claude' : 'Cursor';
        const tab = tabs.find(t => t.name.toLowerCase().includes(tabName.toLowerCase()));
        if (tab) {
          setActiveTab(tab.id);
          result = `Switched to ${tab.name}`;
        } else {
          result = `Tab not found`;
        }
      } else if (cmd.includes('tabs')) {
        result = `You have ${tabs.length} tabs: ${tabs.map(t => t.name).join(', ')}`;
      } else {
        result = `Command received: ${command}`;
      }
      
      setLastResult(result);
      addCommandLog({
        command,
        action: 'executed',
        result,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setLastResult(`Error: ${e.message}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [tabs, setActiveTab, addCommandLog]);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', data);
    } catch (e) {
      console.log('WebView raw message:', event.nativeEvent.data);
    }
  }, []);

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
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowLogs(!showLogs)}
          >
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
              <Text
                style={[styles.tabText, activeTabId === tab.id && styles.tabTextActive]}
                numberOfLines={1}
              >
                {tab.name}
              </Text>
              {tabs.length > 1 && (
                <TouchableOpacity
                  style={styles.tabClose}
                  onPress={() => handleCloseTab(tab.id)}
                >
                  <Ionicons name="close" size={14} color="#52525B" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addTab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/add-tab');
            }}
          >
            <Ionicons name="add" size={20} color="#71717A" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* WebView Browser */}
      <View style={styles.browserContainer}>
        {activeTab ? (
          Platform.OS === 'web' ? (
            <View style={styles.simulatedBrowser}>
              {/* Simulated browser chrome */}
              <View style={styles.browserUrlBar}>
                <Ionicons name="lock-closed" size={12} color="#22C55E" />
                <Text style={styles.browserUrl}>{activeTab.url}</Text>
              </View>
              {/* Simulated page content */}
              <ScrollView style={styles.simulatedContent}>
                {activeTab.name === 'Claude' && (
                  <View style={styles.chatSimulation}>
                    <View style={styles.chatMessage}>
                      <View style={styles.userBubble}>
                        <Text style={styles.chatText}>How do I implement authentication in React Native?</Text>
                      </View>
                    </View>
                    <View style={styles.chatMessage}>
                      <View style={styles.assistantBubble}>
                        <Text style={styles.chatText}>I'll help you implement authentication in React Native. Here are the key steps:{'\n\n'}1. Choose an auth provider (Firebase, Auth0, or custom){'\n'}2. Install required packages{'\n'}3. Set up secure token storage{'\n'}4. Create auth context{'\n'}5. Implement login/logout flows{'\n\n'}Would you like me to show you the code for any of these steps?</Text>
                      </View>
                    </View>
                  </View>
                )}
                {activeTab.name === 'GitHub' && (
                  <View style={styles.githubSimulation}>
                    <View style={styles.repoHeader}>
                      <Ionicons name="logo-github" size={24} color="#FAFAFA" />
                      <Text style={styles.repoName}>user/meta-chrome-app</Text>
                    </View>
                    <View style={styles.repoStats}>
                      <View style={styles.stat}><Ionicons name="star" size={14} color="#F59E0B" /><Text style={styles.statText}>128</Text></View>
                      <View style={styles.stat}><Ionicons name="git-branch" size={14} color="#71717A" /><Text style={styles.statText}>12</Text></View>
                      <View style={styles.stat}><Ionicons name="eye" size={14} color="#71717A" /><Text style={styles.statText}>45</Text></View>
                    </View>
                    <View style={styles.fileList}>
                      <View style={styles.fileItem}><Ionicons name="folder" size={16} color="#8B5CF6" /><Text style={styles.fileName}>src/</Text></View>
                      <View style={styles.fileItem}><Ionicons name="folder" size={16} color="#8B5CF6" /><Text style={styles.fileName}>app/</Text></View>
                      <View style={styles.fileItem}><Ionicons name="document" size={16} color="#71717A" /><Text style={styles.fileName}>package.json</Text></View>
                      <View style={styles.fileItem}><Ionicons name="document" size={16} color="#71717A" /><Text style={styles.fileName}>README.md</Text></View>
                    </View>
                  </View>
                )}
                {activeTab.name === 'Cursor' && (
                  <View style={styles.cursorSimulation}>
                    <Text style={styles.cursorTitle}>Cursor AI Assistant</Text>
                    <Text style={styles.cursorText}>Working on: meta-chrome-app/src/index.tsx</Text>
                    <View style={styles.codeBlock}>
                      <Text style={styles.codeText}>{'const App = () => {\n  return (\n    <BrowserProvider>\n      <TabBar />\n      <WebView />\n    </BrowserProvider>\n  );\n}'}</Text>
                    </View>
                  </View>
                )}
                {!['Claude', 'GitHub', 'Cursor'].includes(activeTab.name) && (
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
              onMessage={handleMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              injectedJavaScript={`
                window.onerror = function(msg) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', msg: msg}));
                };
                true;
              `}
              renderLoading={() => (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
              )}
            />
          )
        ) : (
          <View style={styles.noTab}>
            <Ionicons name="globe-outline" size={48} color="#3F3F46" />
            <Text style={styles.noTabText}>No tab selected</Text>
          </View>
        )}
        
        {isLoading && Platform.OS !== 'web' && (
          <View style={styles.loadingBar}>
            <View style={styles.loadingProgress} />
          </View>
        )}
      </View>

      {/* Command Result / Logs */}
      {(lastResult || showLogs) && (
        <View style={styles.resultPanel}>
          {lastResult && !showLogs && (
            <View style={styles.resultContent}>
              <Ionicons name="chatbubble" size={16} color="#22C55E" />
              <Text style={styles.resultText} numberOfLines={3}>{lastResult}</Text>
              <TouchableOpacity onPress={() => setLastResult(null)}>
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </View>
          )}
          {showLogs && (
            <ScrollView style={styles.logsScroll}>
              <View style={styles.logsHeader}>
                <Text style={styles.logsTitle}>Command Log</Text>
                <TouchableOpacity onPress={() => setShowLogs(false)}>
                  <Ionicons name="close" size={20} color="#71717A" />
                </TouchableOpacity>
              </View>
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
          )}
        </View>
      )}

      {/* Quick Commands (for testing - remove in production) */}
      <View style={styles.quickCommands}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            'Read last response',
            'Scroll down',
            'Switch to GitHub',
            'What tabs do I have',
          ].map(cmd => (
            <TouchableOpacity
              key={cmd}
              style={styles.quickCmd}
              onPress={() => simulateCommand(cmd)}
              disabled={isLoading}
            >
              <Text style={styles.quickCmdText}>{cmd}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.quickHint}>Test commands (simulates glasses input)</Text>
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
  tabBar: {
    backgroundColor: '#1F1F28',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A35',
  },
  tabScroll: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0A0A0F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 6,
  },
  tabActive: {
    backgroundColor: '#2A2A35',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 13,
    color: '#71717A',
    maxWidth: 80,
  },
  tabTextActive: {
    color: '#FAFAFA',
    fontWeight: '500',
  },
  tabClose: {
    marginLeft: 4,
    padding: 2,
  },
  addTab: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  browserContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#1F1F28',
  },
  loadingProgress: {
    height: '100%',
    width: '30%',
    backgroundColor: '#8B5CF6',
  },
  noTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
  },
  noTabText: {
    color: '#52525B',
    fontSize: 16,
    marginTop: 12,
  },
  simulatedBrowser: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  browserUrlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1F1F28',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 8,
  },
  browserUrl: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  simulatedContent: {
    flex: 1,
    padding: 12,
  },
  chatSimulation: {
    flex: 1,
  },
  chatMessage: {
    marginBottom: 16,
  },
  userBubble: {
    backgroundColor: '#8B5CF6',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  assistantBubble: {
    backgroundColor: '#1F1F28',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  chatText: {
    color: '#FAFAFA',
    fontSize: 14,
    lineHeight: 20,
  },
  githubSimulation: {
    flex: 1,
  },
  repoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  repoName: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '600',
  },
  repoStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  fileList: {
    backgroundColor: '#1F1F28',
    borderRadius: 12,
    padding: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A35',
  },
  fileName: {
    color: '#FAFAFA',
    fontSize: 14,
  },
  cursorSimulation: {
    flex: 1,
  },
  cursorTitle: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cursorText: {
    color: '#71717A',
    fontSize: 13,
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: '#1F1F28',
    padding: 12,
    borderRadius: 8,
  },
  codeText: {
    color: '#22C55E',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  genericPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genericTitle: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: '600',
  },
  genericUrl: {
    color: '#71717A',
    fontSize: 14,
    marginTop: 8,
  },
  resultPanel: {
    backgroundColor: '#1F1F28',
    maxHeight: 200,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  resultText: {
    flex: 1,
    color: '#FAFAFA',
    fontSize: 14,
  },
  logsScroll: {
    padding: 12,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logsTitle: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '600',
  },
  noLogs: {
    color: '#52525B',
    fontSize: 13,
  },
  logItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A35',
  },
  logCommand: {
    color: '#8B5CF6',
    fontSize: 13,
    marginBottom: 4,
  },
  logResult: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  quickCommands: {
    backgroundColor: '#1F1F28',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
  },
  quickCmd: {
    backgroundColor: '#2A2A35',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickCmdText: {
    color: '#FAFAFA',
    fontSize: 13,
  },
  quickHint: {
    color: '#52525B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});
