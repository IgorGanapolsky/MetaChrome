// Error tracking and monitoring
// Initialize Sentry in production builds only

let sentryInitialized = false;

export const initMonitoring = () => {
  if (__DEV__ || sentryInitialized) {
    return;
  }

  try {
    // Sentry will be initialized via app.json plugin in production
    // This is a placeholder for manual initialization if needed
    sentryInitialized = true;
  } catch (error) {
    console.error('Failed to initialize monitoring:', error);
  }
};

export const captureException = (error: Error, context?: Record<string, unknown>) => {
  if (__DEV__) {
    console.error('Error captured:', error, context);
    return;
  }
  // Sentry.captureException(error, { extra: context });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (__DEV__) {
    console.log(`[${level.toUpperCase()}]`, message);
    return;
  }
  // Sentry.captureMessage(message, level);
};
