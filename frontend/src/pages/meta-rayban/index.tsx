import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MetaRayBanSettings } from '@/widgets/meta-rayban-settings';
import { CustomCommandsList, CommandEditorModal } from '@/widgets/custom-commands';
import { CustomVoiceCommand } from '@/entities/custom-command';

export function MetaRayBanPage() {
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editingCommand, setEditingCommand] = useState<CustomVoiceCommand | null>(null);

  const handleAddCommand = () => {
    setEditingCommand(null);
    setIsEditorVisible(true);
  };

  const handleEditCommand = (command: CustomVoiceCommand) => {
    setEditingCommand(command);
    setIsEditorVisible(true);
  };

  const handleCloseEditor = () => {
    setIsEditorVisible(false);
    setEditingCommand(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <MetaRayBanSettings />
        <View style={styles.divider} />
        <CustomCommandsList
          onAddCommand={handleAddCommand}
          onEditCommand={handleEditCommand}
        />
      </ScrollView>

      <CommandEditorModal
        visible={isEditorVisible}
        onClose={handleCloseEditor}
        editCommand={editingCommand}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scrollView: {
    flex: 1,
  },
  divider: {
    height: 8,
    backgroundColor: '#0A0A0F',
  },
});
