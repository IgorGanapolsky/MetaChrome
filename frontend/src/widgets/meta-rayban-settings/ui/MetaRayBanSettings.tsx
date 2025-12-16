import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomCommandStore } from '@/entities/custom-command';
import { useHaptics } from '@/shared/lib';
import { 
  bluetoothAudioManager, 
  useBluetoothStore,
  siriShortcutsService,
  BluetoothDevice,
} from '@/services';

export function MetaRayBanSettings() {
  const { metaRayBanSettings, updateMetaRayBanSettings, connectMetaRayBan, disconnectMetaRayBan } =
    useCustomCommandStore();
  const { impact, notification } = useHaptics();
  const bluetoothState = useBluetoothStore();
  
  const [isScanning, setIsScanning] = useState(false);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [editingWakeWord, setEditingWakeWord] = useState(false);
  const [tempWakeWord, setTempWakeWord] = useState(metaRayBanSettings.customWakeWord);

  // Initialize Bluetooth on mount
  useEffect(() => {
    bluetoothAudioManager.initialize();
    
    // Initialize Siri shortcuts on iOS
    if (Platform.OS === 'ios') {
      siriShortcutsService.initialize();
      siriShortcutsService.donateDefaultShortcuts();
    }
  }, []);

  // Scan for Bluetooth devices
  const handleScan = async () => {
    impact('medium');
    setIsScanning(true);
    setShowDeviceList(true);
    
    try {
      await bluetoothAudioManager.startScan(15000); // 15 second scan
    } catch (error) {
      Alert.alert('Scan Error', `Failed to scan: ${error}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Connect to a device
  const handleConnectDevice = async (device: BluetoothDevice) => {
    impact('medium');
    setIsScanning(false);
    
    try {
      const success = await bluetoothAudioManager.connect(device.id);
      
      if (success) {
        // Update app state
        connectMetaRayBan(device.name || 'Meta Ray-Ban Glasses');
        notification('success');
        setShowDeviceList(false);
        
        Alert.alert(
          'Connected!',
          `${device.name} is now connected. Voice commands will be processed through the device.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Connection Failed', 'Could not connect to the device. Please try again.');
      }
    } catch (error) {
      Alert.alert('Connection Error', `Failed to connect: ${error}`);
    }
  };

  // Disconnect from device
  const handleDisconnect = () => {
    impact('light');
    Alert.alert(
      'Disconnect Device',
      'Are you sure you want to disconnect?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await bluetoothAudioManager.disconnect();
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

  // Add Siri shortcut
  const handleAddSiriShortcut = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('iOS Only', 'Siri Shortcuts are only available on iOS devices.');
      return;
    }

    const shortcut = siriShortcutsService.createVoiceModeShortcut();
    await siriShortcutsService.presentShortcut(shortcut, (data) => {
      if (data.status === 'added') {
        notification('success');
        Alert.alert('Shortcut Added', 'You can now use Siri to start voice browsing!');
      }
    });
  };

  // Render a discovered device
  const renderDevice = ({ item }: { item: BluetoothDevice }) => (
    <TouchableOpacity
      style={[styles.deviceItem, item.isMetaGlasses && styles.deviceItemMeta]}
      onPress={() => handleConnectDevice(item)}
    >
      <View style={styles.deviceInfo}>
        <Ionicons
          name={item.isMetaGlasses ? 'glasses-outline' : 'bluetooth'}
          size={24}
          color={item.isMetaGlasses ? '#10B981' : '#8B5CF6'}
        />
        <View style={styles.deviceText}>
          <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
          <Text style={styles.deviceId}>
            {item.isMetaGlasses ? 'Meta Ray-Ban Glasses' : 'Bluetooth Device'}
          </Text>
        </View>
      </View>
      <View style={styles.deviceSignal}>
        <Ionicons
          name="cellular"
          size={16}
          color={item.rssi && item.rssi > -60 ? '#10B981' : '#71717A'}
        />
      </View>
    </TouchableOpacity>
  );

  // Check if connected
  const isConnected = bluetoothState.connectedDevice?.isConnected || metaRayBanSettings.isConnected;
  const connectedDeviceName = bluetoothState.connectedDevice?.name || metaRayBanSettings.deviceName;

  return (
    <View style={styles.container}>
      {/* Connection Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.glassesIcon, isConnected && styles.glassesIconConnected]}>
            <Ionicons
              name="glasses-outline"
              size={32}
              color={isConnected ? '#10B981' : '#71717A'}
            />
          </View>
          <View style={styles.connectionInfo}>
            <Text style={styles.connectionTitle}>
              {isConnected ? connectedDeviceName : 'Meta Ray-Ban Glasses'}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  isConnected ? styles.statusConnected : styles.statusDisconnected,
                ]}
              />
              <Text style={styles.statusText}>
                {isConnected ? 'Connected' : bluetoothState.isBluetoothEnabled ? 'Not Connected' : 'Bluetooth Off'}
              </Text>
            </View>
          </View>
          {isConnected && bluetoothState.isAudioRouted && (
            <View style={styles.audioIndicator}>
              <Ionicons name="volume-high" size={16} color="#10B981" />
              <Text style={styles.audioText}>Audio</Text>
            </View>
          )}
        </View>

        {/* Device List (when scanning) */}
        {showDeviceList && (
          <View style={styles.deviceList}>
            <View style={styles.deviceListHeader}>
              <Text style={styles.deviceListTitle}>
                {isScanning ? 'Scanning...' : 'Available Devices'}
              </Text>
              {isScanning && <ActivityIndicator size="small" color="#8B5CF6" />}
            </View>
            
            {bluetoothState.discoveredDevices.length > 0 ? (
              <FlatList
                data={bluetoothState.discoveredDevices}
                renderItem={renderDevice}
                keyExtractor={(item) => item.id}
                style={styles.deviceFlatList}
              />
            ) : (
              <Text style={styles.noDevicesText}>
                {isScanning ? 'Looking for devices...' : 'No devices found'}
              </Text>
            )}
            
            <TouchableOpacity
              style={styles.cancelScanButton}
              onPress={() => {
                bluetoothAudioManager.stopScan();
                setShowDeviceList(false);
                setIsScanning(false);
              }}
            >
              <Text style={styles.cancelScanText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Connect/Disconnect Button */}
        {!showDeviceList && (
          <TouchableOpacity
            style={[styles.connectButton, isConnected && styles.disconnectButton]}
            onPress={isConnected ? handleDisconnect : handleScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name={isConnected ? 'bluetooth' : 'search'}
                  size={20}
                  color="#FFF"
                />
                <Text style={styles.connectButtonText}>
                  {isConnected ? 'Disconnect' : 'Scan for Devices'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Bluetooth error message */}
        {bluetoothState.lastError && (
          <Text style={styles.errorText}>{bluetoothState.lastError}</Text>
        )}
      </View>

      {/* Siri Shortcuts (iOS only) */}
      {Platform.OS === 'ios' && (
        <TouchableOpacity style={styles.siriCard} onPress={handleAddSiriShortcut}>
          <View style={styles.siriIcon}>
            <Ionicons name="mic-circle" size={28} color="#FF2D55" />
          </View>
          <View style={styles.siriInfo}>
            <Text style={styles.siriTitle}>Add Siri Shortcut</Text>
            <Text style={styles.siriDescription}>
              Say &quot;Hey Siri, start voice browsing&quot; to open MetaChrome
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#71717A" />
        </TouchableOpacity>
      )}

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
              <Text style={styles.wakeWordText}>&quot;{metaRayBanSettings.customWakeWord}&quot;</Text>
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
                Speak responses through device
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
          Connect your Meta Ray-Ban glasses via Bluetooth. Voice commands are captured through the 
          glasses&apos; microphone and responses are played through the speakers. Works with Claude, 
          Cursor, ChatGPT, and other web agents.
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
    marginBottom: 16,
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
  glassesIconConnected: {
    backgroundColor: '#10B98120',
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
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  audioText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  deviceList: {
    marginBottom: 16,
  },
  deviceListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deviceListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  deviceFlatList: {
    maxHeight: 200,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A35',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  deviceItemMeta: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceText: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  deviceId: {
    fontSize: 12,
    color: '#71717A',
  },
  deviceSignal: {
    padding: 4,
  },
  noDevicesText: {
    textAlign: 'center',
    color: '#71717A',
    fontSize: 14,
    paddingVertical: 20,
  },
  cancelScanButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelScanText: {
    color: '#EF4444',
    fontSize: 14,
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
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  siriCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F28',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  siriIcon: {
    marginRight: 12,
  },
  siriInfo: {
    flex: 1,
  },
  siriTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FAFAFA',
    marginBottom: 2,
  },
  siriDescription: {
    fontSize: 12,
    color: '#71717A',
  },
  settingsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
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
