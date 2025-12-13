import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface CommandHistory {
  id: string;
  original_command: string;
  interpreted_action: string;
  action_type: string;
  response_text: string;
  simulated: bool;
  timestamp: string;
}

function SwipeableItem({ item, onDelete, getActionIcon, formatDate }: {
  item: CommandHistory;
  onDelete: (id: string) => void;
  getActionIcon: (type: string) => string;
  formatDate: (ts: string) => string;
}) {
  const translateX = useSharedValue(0);
  const DELETE_THRESHOLD = -80;

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -120);
      }
    })
    .onEnd((event) => {
      if (event.translationX < DELETE_THRESHOLD) {
        runOnJS(onDelete)(item.id);
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.deleteBackground}>
        <Ionicons name="trash" size={24} color="#FFF" />
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.historyItem, animatedStyle]}>
          <View style={styles.itemHeader}>
            <View style={styles.itemHeaderLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name={getActionIcon(item.action_type) as any} size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.actionType}>
                {item.action_type.replace('_', ' ')}
              </Text>
            </View>
            <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
          </View>
          
          <Text style={styles.command}>"{item.original_command}"</Text>
          
          <Text style={styles.response} numberOfLines={3}>
            {item.response_text.replace(/\[SIMULATED\]/g, '').trim()}
          </Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.selectionAsync();
    fetchHistory();
  }, []);

  const handleClearHistory = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all command history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/history`);
              setHistory([]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteItem = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // For now, just remove from local state
    // In a real app, you'd call an API to delete
    setHistory((prev) => prev.filter((item) => item.id !== id));
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

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Command History</Text>
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={handleClearHistory}
          disabled={history.length === 0}
        >
          <Ionicons 
            name="trash-outline" 
            size={22} 
            color={history.length === 0 ? '#3F3F46' : '#EF4444'} 
          />
        </TouchableOpacity>
      </View>

      {/* Swipe hint */}
      {history.length > 0 && (
        <View style={styles.hintContainer}>
          <Ionicons name="arrow-back" size={14} color="#52525B" />
          <Text style={styles.hintText}>Swipe left to delete</Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#3F3F46" />
          <Text style={styles.emptyText}>No command history yet</Text>
          <Text style={styles.emptySubtext}>
            Your voice commands will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={({ item }) => (
            <SwipeableItem
              item={item}
              onDelete={handleDeleteItem}
              getActionIcon={getActionIcon}
              formatDate={formatDate}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#8B5CF6"
              colors={['#8B5CF6']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  clearButton: {
    padding: 8,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#52525B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#71717A',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  swipeContainer: {
    marginBottom: 12,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyItem: {
    backgroundColor: '#1F1F28',
    borderRadius: 16,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionType: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  timestamp: {
    color: '#52525B',
    fontSize: 11,
  },
  command: {
    color: '#8B5CF6',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  response: {
    color: '#A1A1AA',
    fontSize: 14,
    lineHeight: 20,
  },
});
