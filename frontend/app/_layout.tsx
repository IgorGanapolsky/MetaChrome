import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '@/shared/ui';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background.primary },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="add-tab" options={{ presentation: 'modal' }} />
            <Stack.Screen
              name="meta-rayban"
              options={{
                presentation: 'modal',
                headerShown: true,
                headerTitle: 'Meta Ray-Ban',
                headerStyle: { backgroundColor: '#1F1F28' },
                headerTintColor: '#FAFAFA',
                headerTitleStyle: { fontWeight: '600' },
              }}
            />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
