import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
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
    executeCommand,
    addCommandLog,
    commandHistory,
  } = useBrowser();
  
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

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

  // Simulated command execution (in real app, this comes from glasses)
  const simulateCommand = useCallback(async (command: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);
    
    try {
      const result = await executeCommand(command);
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
  }, [executeCommand, addCommandLog]);

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
            <View style={styles.webFallback}>
              <Ionicons name="phone-portrait-outline" size={48} color="#8B5CF6" />
              <Text style={styles.webFallbackTitle}>Open on Mobile</Text>
              <Text style={styles.webFallbackText}>
                The in-app browser works on iOS and Android.{'\n'}
                Scan the QR code with Expo Go to test.
              </Text>
              <View style={styles.webFallbackUrl}>
                <Ionicons name="link" size={16} color="#71717A" />
                <Text style={styles.webFallbackUrlText}>{activeTab.url}</Text>
              </View>
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
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
    padding: 32,
  },
  webFallbackTitle: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  webFallbackText: {
    color: '#71717A',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  webFallbackUrl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F1F28',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 24,
  },
  webFallbackUrlText: {
    color: '#A1A1AA',
    fontSize: 13,
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
