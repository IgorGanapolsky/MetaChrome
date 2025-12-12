import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface CommandResponse {
  id: string;
  original_command: string;
  interpreted_action: string;
  action_type: string;
  response_text: string;
  simulated: boolean;
  timestamp: string;
}

export default function VoiceAssistant() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<CommandResponse | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation for the mic button
  const pulseAnim = useState(new Animated.Value(1))[0];
  
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const processCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/command`, {
        command: command.trim(),
        context: null,
      });
      
      const data: CommandResponse = response.data;
      setLastResponse(data);
      
      // Speak the response
      speakResponse(data.response_text);
    } catch (err: any) {
      console.error('Error processing command:', err);
      setError(err.response?.data?.detail || 'Failed to process command');
    } finally {
      setIsProcessing(false);
      setInputText('');
    }
  };

  const speakResponse = async (text: string) => {
    // Clean up the text for speech
    const cleanText = text.replace(/\[SIMULATED\]/g, 'Simulated:').replace(/\n/g, ' ');
    
    console.log('[TTS] Attempting to speak:', cleanText.substring(0, 50) + '...');
    setIsSpeaking(true);
    
    // Use Web Speech API for web
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      console.log('[TTS] Using Web Speech API');
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.onend = () => {
          console.log('[TTS] Speech ended');
          setIsSpeaking(false);
        };
        utterance.onerror = (e) => {
          console.error('[TTS] Speech error:', e);
          setIsSpeaking(false);
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('[TTS] Web Speech failed:', e);
        setIsSpeaking(false);
      }
    } else {
      // Native expo-speech - NOTE: Only works in development builds, NOT Expo Go
      console.log('[TTS] Using expo-speech (native) - requires dev build, not Expo Go');
      try {
        // Check if speech is available
        const isAvailable = await Speech.isSpeakingAsync().catch(() => false);
        console.log('[TTS] Speech available check passed');
        
        Speech.speak(cleanText, {
          language: 'en-US',
          rate: 0.9,
          onDone: () => {
            console.log('[TTS] Native speech done');
            setIsSpeaking(false);
          },
          onStopped: () => {
            console.log('[TTS] Native speech stopped');
            setIsSpeaking(false);
          },
          onError: (error) => {
            console.error('[TTS] Native speech error:', error);
            setIsSpeaking(false);
          },
        });
      } catch (e) {
        console.error('[TTS] expo-speech failed (expected in Expo Go):', e);
        setIsSpeaking(false);
      }
    }
  };

  const stopSpeaking = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    } else {
      Speech.stop();
    }
    setIsSpeaking(false);
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      // In a real implementation, this would stop the speech recognition
    } else {
      setIsListening(true);
      // Note: Real speech-to-text would require native modules
      // For now, we'll use text input as fallback
      setTimeout(() => {
        setIsListening(false);
      }, 5000);
    }
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    processCommand(inputText);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'browser_control':
        return 'globe-outline';
      case 'app_control':
        return 'apps-outline';
      case 'ai_query':
        return 'sparkles-outline';
      case 'device_control':
        return 'phone-portrait-outline';
      case 'note_taking':
        return 'document-text-outline';
      case 'reading':
        return 'book-outline';
      default:
        return 'chatbox-outline';
    }
  };

  const exampleCommands = [
    'Open my Google Chrome tab with Claude Code',
    'Open Google Keep and tell me my notes',
    'Read me the last paragraph',
    'Ask Grok to review my public repo',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="glasses-outline" size={28} color="#8B5CF6" />
            <Text style={styles.headerTitle}>Voice Command AI</Text>
          </View>
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => router.push('/history')}
          >
            <Ionicons name="time-outline" size={24} color="#A1A1AA" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Integration Badges */}
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Ionicons name="glasses" size={16} color="#8B5CF6" />
              <Text style={styles.badgeText}>Ray-Ban Meta</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="logo-google" size={16} color="#34A853" />
              <Text style={styles.badgeText}>Google Assistant</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="logo-apple" size={16} color="#A1A1AA" />
              <Text style={styles.badgeText}>Apple Control</Text>
            </View>
          </View>

          {/* Main Voice Button */}
          <View style={styles.voiceSection}>
            <Animated.View style={[styles.voiceButtonOuter, { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity
                style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
                onPress={toggleListening}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <Ionicons 
                    name={isListening ? 'mic' : 'mic-outline'} 
                    size={48} 
                    color="#fff" 
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.voiceHint}>
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Tap to speak or type below'}
            </Text>
          </View>

          {/* Text Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your command here..."
              placeholderTextColor="#71717A"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSubmit}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSubmit}
              disabled={!inputText.trim() || isProcessing}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Last Response */}
          {lastResponse && (
            <View style={styles.responseCard}>
              <View style={styles.responseHeader}>
                <View style={styles.responseHeaderLeft}>
                  <Ionicons 
                    name={getActionIcon(lastResponse.action_type)} 
                    size={20} 
                    color="#8B5CF6" 
                  />
                  <Text style={styles.actionType}>
                    {lastResponse.action_type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                {isSpeaking ? (
                  <TouchableOpacity onPress={stopSpeaking}>
                    <Ionicons name="stop-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => speakResponse(lastResponse.response_text)}>
                    <Ionicons name="volume-high" size={24} color="#8B5CF6" />
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={styles.originalCommand}>
                "{lastResponse.original_command}"
              </Text>
              
              <View style={styles.responseBody}>
                <Text style={styles.responseText}>{lastResponse.response_text}</Text>
              </View>
              
              {lastResponse.simulated && (
                <View style={styles.simulatedBadge}>
                  <Ionicons name="flask" size={14} color="#F59E0B" />
                  <Text style={styles.simulatedText}>Simulated Response</Text>
                </View>
              )}
            </View>
          )}

          {/* Example Commands */}
          {!lastResponse && (
            <View style={styles.examplesSection}>
              <Text style={styles.examplesTitle}>Try saying:</Text>
              {exampleCommands.map((cmd, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.exampleItem}
                  onPress={() => setInputText(cmd)}
                >
                  <Ionicons name="chatbubble-outline" size={16} color="#8B5CF6" />
                  <Text style={styles.exampleText}>{cmd}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by Claude AI • Demo Mode
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F28',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  historyButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1F1F28',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '500',
  },
  voiceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  voiceButtonOuter: {
    marginBottom: 16,
  },
  voiceButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#7C3AED',
  },
  voiceHint: {
    color: '#71717A',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1F1F28',
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    color: '#FAFAFA',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#8B5CF6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#3F3F46',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    flex: 1,
  },
  responseCard: {
    backgroundColor: '#1F1F28',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  responseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionType: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
  originalCommand: {
    color: '#71717A',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  responseBody: {
    backgroundColor: '#0A0A0F',
    padding: 12,
    borderRadius: 12,
  },
  responseText: {
    color: '#FAFAFA',
    fontSize: 15,
    lineHeight: 22,
  },
  simulatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  simulatedText: {
    color: '#F59E0B',
    fontSize: 12,
  },
  examplesSection: {
    marginTop: 8,
  },
  examplesTitle: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1F1F28',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  exampleText: {
    color: '#FAFAFA',
    fontSize: 14,
    flex: 1,
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1F1F28',
  },
  footerText: {
    color: '#52525B',
    fontSize: 12,
  },
});
