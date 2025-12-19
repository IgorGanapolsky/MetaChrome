import React, { useEffect } from 'react';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/theme';
import { initMonitoring, initAnalytics, trackEvent, AnalyticsEvents } from '@/shared/lib';

const isDevToolsEnabled = __DEV__ && process.env.NODE_ENV !== 'test';

if (isDevToolsEnabled) {
  require('@/shared/lib/reactotron');
}

const RozeniteDevTools = isDevToolsEnabled
  ? require('@/shared/lib/rozenite').RozeniteDevTools
  : null;

export default function RootLayout() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    // Initialize monitoring and analytics
    initMonitoring();
    initAnalytics();
    trackEvent({ name: AnalyticsEvents.APP_OPENED });
  }, []);

  return (
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
        {RozeniteDevTools ? <RozeniteDevTools navigationRef={navigationRef} /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
