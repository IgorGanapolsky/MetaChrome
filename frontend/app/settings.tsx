import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@voice_assistant_settings';

export interface AppSettings {
  hapticsEnabled: boolean;
  autoSpeak: boolean;
  speechRate: number;
}

const defaultSettings: AppSettings = {
  hapticsEnabled: true,
  autoSpeak: true,
  speechRate: 0.75,
};

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      if (newSettings.hapticsEnabled) {
        Haptics.selectionAsync();
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const toggleSetting = (key: keyof AppSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const setSpeechRate = (rate: number) => {
    const newSettings = { ...settings, speechRate: rate };
    saveSettings(newSettings);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Feedback Section */}
        <Text style={styles.sectionTitle}>Feedback</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="phone-portrait-outline" size={22} color="#8B5CF6" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <Text style={styles.settingDescription}>Vibrate on interactions</Text>
              </View>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={() => toggleSetting('hapticsEnabled')}
              trackColor={{ false: '#3F3F46', true: '#8B5CF6' }}
              thumbColor="#FAFAFA"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="volume-high-outline" size={22} color="#8B5CF6" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Auto-Speak Responses</Text>
                <Text style={styles.settingDescription}>Read responses aloud automatically</Text>
              </View>
            </View>
            <Switch
              value={settings.autoSpeak}
              onValueChange={() => toggleSetting('autoSpeak')}
              trackColor={{ false: '#3F3F46', true: '#8B5CF6' }}
              thumbColor="#FAFAFA"
            />
          </View>
        </View>

        {/* Speech Section */}
        <Text style={styles.sectionTitle}>Speech</Text>
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Speech Rate</Text>
          <Text style={styles.settingDescription}>Adjust how fast responses are spoken</Text>
          <View style={styles.rateButtons}>
            {[0.5, 0.75, 1.0, 1.25].map((rate) => (
              <TouchableOpacity
                key={rate}
                style={[
                  styles.rateButton,
                  settings.speechRate === rate && styles.rateButtonActive,
                ]}
                onPress={() => setSpeechRate(rate)}
              >
                <Text
                  style={[
                    styles.rateButtonText,
                    settings.speechRate === rate && styles.rateButtonTextActive,
                  ]}
                >
                  {rate}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingCard}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>AI Model</Text>
            <Text style={styles.aboutValue}>GPT-4o</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Platform</Text>
            <Text style={styles.aboutValue}>Expo + FastAPI</Text>
          </View>
        </View>

        {/* Integration Status */}
        <Text style={styles.sectionTitle}>Integration Status</Text>
        <View style={styles.settingCard}>
          <View style={styles.integrationRow}>
            <Ionicons name="glasses" size={20} color="#8B5CF6" />
            <Text style={styles.integrationLabel}>Meta Ray-Ban SDK</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Coming 2026</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.integrationRow}>
            <Ionicons name="logo-google" size={20} color="#34A853" />
            <Text style={styles.integrationLabel}>Google Assistant</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Simulated</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.integrationRow}>
            <Ionicons name="logo-apple" size={20} color="#A1A1AA" />
            <Text style={styles.integrationLabel}>Apple Control</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Simulated</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F28',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  settingCard: {
    backgroundColor: '#1F1F28',
    borderRadius: 16,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FAFAFA',
  },
  settingDescription: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A35',
    marginVertical: 12,
  },
  rateButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  rateButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2A2A35',
    alignItems: 'center',
  },
  rateButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  rateButtonTextActive: {
    color: '#FAFAFA',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutLabel: {
    fontSize: 15,
    color: '#A1A1AA',
  },
  aboutValue: {
    fontSize: 15,
    color: '#FAFAFA',
    fontWeight: '500',
  },
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  integrationLabel: {
    fontSize: 15,
    color: '#FAFAFA',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#2A2A35',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
});
