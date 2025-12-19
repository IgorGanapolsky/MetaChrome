import React, { useState, Suspense } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BrowserHeader } from '@/widgets/browser-header';
import { TabBar } from '@/widgets/tab-bar';
import { BrowserContent } from '@/widgets/browser-content';
import { CommandLog } from '@/widgets/command-log';
import { CommandResult } from '@/widgets/command-result';

// Lazy load VoiceControls - only loaded when user enables it
const VoiceControls = React.lazy(() =>
  import('@/widgets/voice-controls')
    .then((m) => ({ default: m.VoiceControls }))
    .catch(() => ({
      default: () => (
        <View style={{ padding: 16, backgroundColor: '#1F1F28' }}>
          <Text style={{ color: '#fff' }}>Voice controls unavailable</Text>
        </View>
      ),
    }))
);

export function BrowserPage() {
  const [showLogs, setShowLogs] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Don't load voice on startup

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BrowserHeader isConnected={true} onToggleLogs={() => setShowLogs(!showLogs)} />
      <TabBar />
      <View style={styles.browserContainer}>
        <BrowserContent />
      </View>
      <CommandResult result={lastResult} onDismiss={() => setLastResult(null)} />
      <CommandLog visible={showLogs} onClose={() => setShowLogs(false)} />
      {voiceEnabled ? (
        <Suspense fallback={<View style={{ padding: 16, backgroundColor: '#1F1F28' }} />}>
          <VoiceControls />
        </Suspense>
      ) : (
        <TouchableOpacity style={styles.enableVoice} onPress={() => setVoiceEnabled(true)}>
          <Ionicons name="mic-outline" size={24} color="#8B5CF6" />
          <Text style={styles.enableVoiceText}>Tap to enable voice controls</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  browserContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  enableVoice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#1F1F28',
    gap: 8,
  },
  enableVoiceText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
});
