export const colors = {
  // Background colors
  background: {
    primary: '#0A0A0F',
    secondary: '#14141F',
    tertiary: '#1E1E2E',
  },
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    tertiary: '#808080',
    disabled: '#505050',
  },
  // Accent colors
  accent: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
  // Border colors
  border: {
    primary: '#2C2C3E',
    secondary: '#1E1E2E',
  },
  // Overlay colors
  overlay: {
    dark: 'rgba(0, 0, 0, 0.7)',
    light: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

export type ColorKey = keyof typeof colors;
export type ColorValue = (typeof colors)[ColorKey][keyof (typeof colors)[ColorKey]];
