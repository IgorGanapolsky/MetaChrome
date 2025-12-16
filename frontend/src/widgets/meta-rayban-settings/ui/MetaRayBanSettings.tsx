import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomCommandStore } from '@/entities/custom-command';
import { useHaptics } from '@/shared/lib';

export function MetaRayBanSettings() {
  const { metaRayBanSettings, updateMetaRayBanSettings, connectMetaRayBan, disconnectMetaRayBan } =
    useCustomCommandStore();
  const { impact, notification } = useHaptics();
  const [isConnecting, setIsConnecting] = useState(false);
  const [editingWakeWord, setEditingWakeWord] = useState(false);
  const [tempWakeWord, setTempWakeWord] = useState(metaRayBanSettings.customWakeWord);

  const handleConnect = async () => {
    impact('medium');
    setIsConnecting(true);

    // Simulate Bluetooth connection process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In a real implementation, this would use the Bluetooth API
    // to scan for and connect to Meta Ray-Ban glasses
    connectMetaRayBan('Ray-Ban Meta Smart Glasses');
    notification('success');
    setIsConnecting(false);

    Alert.alert(
      'Connected!',
      'Your Meta Ray-Ban glasses are now connected. Voice commands will be processed through the glasses.',
      [{ text: 'OK' }]
    );
  };

  const handleDisconnect = () => {
    impact('light');
    Alert.alert(
      'Disconnect Glasses',
      'Are you sure you want to disconnect your Meta Ray-Ban glasses?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnectMetaRayBan();
            notification('warning');
          },
        },
      ]
    );
  };

  const handleSaveWakeWord = () => {
    if (tempWakeWord.trim()) {
      updateMetaRayBanSettings({ customWakeWord: tempWakeWord.trim() });
      setEditingWakeWord(false);
      notification('success');
    }
  };

  return (
    <View style={styles.container}>
      {/* Connection Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.glassesIcon}>
            <Ionicons
              name="glasses-outline"
              size={32}
              color={metaRayBanSettings.isConnected ? '#10B981' : '#71717A'}
            />
          </View>
          <View style={styles.connectionInfo}>
            <Text style={styles.connectionTitle}>
              {metaRayBanSettings.isConnected
                ? metaRayBanSettings.deviceName
                : 'Meta Ray-Ban Glasses'}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  metaRayBanSettings.isConnected
                    ? styles.statusConnected
                    : styles.statusDisconnected,
                ]}
              />
              <Text style={styles.statusText}>
                {metaRayBanSettings.isConnected ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
          </View>
          {metaRayBanSettings.isConnected && metaRayBanSettings.batteryLevel && (
            <View style={styles.batteryContainer}>
              <Ionicons
                name={
                  metaRayBanSettings.batteryLevel > 50
                    ? 'battery-full'
                    : metaRayBanSettings.batteryLevel > 20
                    ? 'battery-half'
                    : 'battery-dead'
                }
                size={24}
                color={metaRayBanSettings.batteryLevel > 20 ? '#10B981' : '#EF4444'}
              />
              <Text style={styles.batteryText}>{metaRayBanSettings.batteryLevel}%</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.connectButton,
            metaRayBanSettings.isConnected && styles.disconnectButton,
          ]}
          onPress={metaRayBanSettings.isConnected ? handleDisconnect : handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons
                name={metaRayBanSettings.isConnected ? 'bluetooth' : 'bluetooth-outline'}
                size={20}
                color="#FFF"
              />
              <Text style={styles.connectButtonText}>
                {metaRayBanSettings.isConnected ? 'Disconnect' : 'Connect Glasses'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Settings Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Voice Settings</Text>

        {/* Wake Word Setting */}
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="mic-outline" size={22} color="#8B5CF6" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Wake Word</Text>
              <Text style={styles.settingDescription}>
                Say this to activate voice commands
              </Text>
            </View>
          </View>
          {editingWakeWord ? (
            <View style={styles.wakeWordEdit}>
              <TextInput
                style={styles.wakeWordInput}
                value={tempWakeWord}
                onChangeText={setTempWakeWord}
                autoFocus
                placeholder="Enter wake word"
                placeholderTextColor="#52525B"
              />
              <TouchableOpacity onPress={handleSaveWakeWord} style={styles.saveWakeWord}>
                <Ionicons name="checkmark" size={20} color="#10B981" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.wakeWordDisplay}
              onPress={() => setEditingWakeWord(true)}
            >
              <Text style={styles.wakeWordText}>"{metaRayBanSettings.customWakeWord}"</Text>
              <Ionicons name="pencil-outline" size={16} color="#71717A" />
            </TouchableOpacity>
          )}
        </View>

        {/* Wake Word Enabled Toggle */}
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="ear-outline" size={22} color="#8B5CF6" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Wake Word Detection</Text>
              <Text style={styles.settingDescription}>
                Listen for wake word automatically
              </Text>
            </View>
          </View>
          <Switch
            value={metaRayBanSettings.wakeWordEnabled}
            onValueChange={(value) => updateMetaRayBanSettings({ wakeWordEnabled: value })}
            trackColor={{ false: '#3A3A45', true: '#8B5CF6' }}
            thumbColor={metaRayBanSettings.wakeWordEnabled ? '#FFF' : '#888'}
          />
        </View>

        {/* Voice Feedback Toggle */}
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="volume-high-outline" size={22} color="#8B5CF6" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Voice Feedback</Text>
              <Text style={styles.settingDescription}>
                Speak responses through glasses
              </Text>
            </View>
          </View>
          <Switch
            value={metaRayBanSettings.voiceFeedbackEnabled}
            onValueChange={(value) =>
              updateMetaRayBanSettings({ voiceFeedbackEnabled: value })
            }
            trackColor={{ false: '#3A3A45', true: '#8B5CF6' }}
            thumbColor={metaRayBanSettings.voiceFeedbackEnabled ? '#FFF' : '#888'}
          />
        </View>

        {/* Haptic Feedback Toggle */}
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="phone-portrait-outline" size={22} color="#8B5CF6" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
              <Text style={styles.settingDescription}>
                Vibrate phone on command execution
              </Text>
            </View>
          </View>
          <Switch
            value={metaRayBanSettings.hapticFeedbackEnabled}
            onValueChange={(value) =>
              updateMetaRayBanSettings({ hapticFeedbackEnabled: value })
            }
            trackColor={{ false: '#3A3A45', true: '#8B5CF6' }}
            thumbColor={metaRayBanSettings.hapticFeedbackEnabled ? '#FFF' : '#888'}
          />
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={20} color="#8B5CF6" />
        <Text style={styles.infoText}>
          Custom voice commands work with Meta Ray-Ban glasses via Bluetooth audio. The glasses'
          microphone captures your voice, and responses are played through the speakers.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    padding: 16,
  },
  card: {
    backgroundColor: '#1F1F28',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  glassesIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A2A35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FAFAFA',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusConnected: {
    backgroundColor: '#10B981',
  },
  statusDisconnected: {
    backgroundColor: '#71717A',
  },
  statusText: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryText: {
    fontSize: 14,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  disconnectButton: {
    backgroundColor: '#3A3A45',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#71717A',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F1F28',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FAFAFA',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#71717A',
  },
  wakeWordDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2A2A35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  wakeWordText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  wakeWordEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wakeWordInput: {
    backgroundColor: '#2A2A35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    color: '#FAFAFA',
    minWidth: 120,
  },
  saveWakeWord: {
    padding: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#1F1F28',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#8B5CF640',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#A1A1AA',
    lineHeight: 20,
  },
});
