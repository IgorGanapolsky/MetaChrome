import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTabStore } from '@/entities/tab';
import { useTabActions } from '@/features/tab-management';

export function TabBar() {
  const router = useRouter();
  const { tabs, activeTabId } = useTabStore();
  const { switchTab, closeTab } = useTabActions();

  return (
    <View style={styles.tabBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroll}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTabId === tab.id && styles.tabActive]}
            onPress={() => switchTab(tab.id)}
            onLongPress={() => closeTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTabId === tab.id ? '#8B5CF6' : '#71717A'}
            />
            <Text
              style={[styles.tabText, activeTabId === tab.id && styles.tabTextActive]}
              numberOfLines={1}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          testID="add-tab-button"
          style={styles.addTab}
          onPress={() => router.push('/add-tab' as any)}
        >
          <Ionicons name="add" size={20} color="#71717A" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1F1F28',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A35',
  },
  tabScroll: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0A0A0F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 6,
  },
  tabActive: {
    backgroundColor: '#2A2A35',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 13,
    color: '#71717A',
    maxWidth: 80,
  },
  tabTextActive: {
    color: '#FAFAFA',
    fontWeight: '500',
  },
  addTab: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
