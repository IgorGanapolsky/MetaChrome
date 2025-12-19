import React, { useState, Suspense } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrowserHeader } from '@/widgets/browser-header';
import { TabBar } from '@/widgets/tab-bar';
import { BrowserContent } from '@/widgets/browser-content';
import { CommandLog } from '@/widgets/command-log';
import { CommandResult } from '@/widgets/command-result';

// Lazy load VoiceControls to prevent crash if native module fails
const VoiceControls = React.lazy(() =>
  import('@/widgets/voice-controls').then((m) => ({ default: m.VoiceControls })).catch(() => ({
    default: () => <View style={{ padding: 16, backgroundColor: '#1F1F28' }}><Text style={{ color: '#fff' }}>Voice controls unavailable</Text></View>,
  }))
);

export function BrowserPage() {
  const [showLogs, setShowLogs] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BrowserHeader isConnected={true} onToggleLogs={() => setShowLogs(!showLogs)} />
      <TabBar />
      <View style={styles.browserContainer}>
        <BrowserContent />
      </View>
      <CommandResult result={lastResult} onDismiss={() => setLastResult(null)} />
      <CommandLog visible={showLogs} onClose={() => setShowLogs(false)} />
      <Suspense fallback={<View style={{ padding: 16, backgroundColor: '#1F1F28' }} />}>
        <VoiceControls />
      </Suspense>
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
});
