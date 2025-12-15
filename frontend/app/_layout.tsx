import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BrowserProvider } from '../src/context/BrowserContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BrowserProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0A0A0F' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="add-tab" options={{ presentation: 'modal' }} />
          </Stack>
        </BrowserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
