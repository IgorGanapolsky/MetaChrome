// Analytics and event tracking
// Lightweight analytics for production

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

let analyticsEnabled = !__DEV__;

export const initAnalytics = () => {
  analyticsEnabled = !__DEV__;
  // Initialize analytics service here if needed
};

export const trackEvent = (event: AnalyticsEvent) => {
  if (!analyticsEnabled) {
    return;
  }

  // Track event
  // Example: Analytics.track(event.name, event.properties);
  if (__DEV__) {
    console.log('[Analytics]', event.name, event.properties);
  }
};

export const trackScreen = (screenName: string) => {
  trackEvent({ name: 'screen_view', properties: { screen: screenName } });
};

export const trackError = (error: Error, context?: Record<string, unknown>) => {
  trackEvent({
    name: 'error',
    properties: {
      message: error.message,
      stack: error.stack,
      ...context,
    },
  });
};

// Common events
export const AnalyticsEvents = {
  TAB_ADDED: 'tab_added',
  TAB_REMOVED: 'tab_removed',
  TAB_SWITCHED: 'tab_switched',
  VOICE_COMMAND_EXECUTED: 'voice_command_executed',
  CUSTOM_COMMAND_CREATED: 'custom_command_created',
  META_RAYBAN_CONNECTED: 'meta_rayban_connected',
  META_RAYBAN_DISCONNECTED: 'meta_rayban_disconnected',
  APP_OPENED: 'app_opened',
  APP_CLOSED: 'app_closed',
} as const;
