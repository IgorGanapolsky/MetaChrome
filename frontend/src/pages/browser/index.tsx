import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrowserHeader } from '@/widgets/browser-header';
import { TabBar } from '@/widgets/tab-bar';
import { BrowserContent } from '@/widgets/browser-content';
import { VoiceControls } from '@/widgets/voice-controls';
import { CommandLog } from '@/widgets/command-log';
import { CommandResult } from '@/widgets/command-result';
import { useVoiceCommands } from '@/features/voice-commands';

export function BrowserPage() {
  const [showLogs, setShowLogs] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const { executeCommand } = useVoiceCommands();

  const handleExecuteCommand = async (command: string) => {
    const result = await executeCommand(command);
    setLastResult(result);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BrowserHeader isConnected={true} onToggleLogs={() => setShowLogs(!showLogs)} />
      <TabBar />
      <View style={styles.browserContainer}>
        <BrowserContent />
      </View>
      <CommandResult result={lastResult} onDismiss={() => setLastResult(null)} />
      <CommandLog visible={showLogs} onClose={() => setShowLogs(false)} />
      <VoiceControls />
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
