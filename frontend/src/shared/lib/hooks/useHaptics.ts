import * as Haptics from 'expo-haptics';

export function useHaptics() {
  return {
    impact: (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      const styleMap = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      Haptics.impactAsync(styleMap[style]);
    },
    notification: (type: 'success' | 'warning' | 'error' = 'success') => {
      const typeMap = {
        success: Haptics.NotificationFeedbackType.Success,
        warning: Haptics.NotificationFeedbackType.Warning,
        error: Haptics.NotificationFeedbackType.Error,
      };
      Haptics.notificationAsync(typeMap[type]);
    },
  };
}
