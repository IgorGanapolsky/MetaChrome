import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useTabStore } from '@/entities/tab';
import { useBrowserControls } from '@/features/browser-controls';

export function BrowserContent() {
  const { tabs, activeTabId } = useTabStore();
  const { handleWebViewMessage } = useBrowserControls();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeTab = tabs.find(t => t.id === activeTabId);

  if (!activeTab) {
    return (
      <View style={styles.noTab}>
        <Ionicons name="globe-outline" size={48} color="#3F3F46" />
        <Text style={styles.noTabText}>No tab selected</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
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
                <Text style={styles.chatText}>
                  I'll help you implement authentication. Here are the steps:{'\n\n'}1. Choose provider{'\n'}2. Install packages{'\n'}3. Set up context{'\n'}4. Add login flow
                </Text>
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
                <View style={styles.fileItem}>
                  <Ionicons name="folder" size={16} color="#8B5CF6" />
                  <Text style={styles.fileName}>src/</Text>
                </View>
                <View style={styles.fileItem}>
                  <Ionicons name="folder" size={16} color="#8B5CF6" />
                  <Text style={styles.fileName}>app/</Text>
                </View>
                <View style={styles.fileItem}>
                  <Ionicons name="document" size={16} color="#71717A" />
                  <Text style={styles.fileName}>README.md</Text>
                </View>
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
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: activeTab.url }}
      style={styles.webview}
      onLoadStart={() => setIsLoading(true)}
      onLoadEnd={() => setIsLoading(false)}
      onMessage={handleWebViewMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  browserContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  webview: {
    flex: 1,
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
  userBubble: {
    backgroundColor: '#8B5CF6',
    padding: 12,
    borderRadius: 16,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginBottom: 12,
  },
  assistantBubble: {
    backgroundColor: '#1F1F28',
    padding: 12,
    borderRadius: 16,
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
    marginBottom: 16,
  },
  repoName: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '600',
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
});
