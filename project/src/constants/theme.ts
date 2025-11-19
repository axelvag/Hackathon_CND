export type ThemeMode = 'dark' | 'light';

const darkColors = {
  background: {
    primary: '#0A0E1A',
    secondary: '#0F1420',
    card: '#141825',
    hover: '#1A1F2E',
  },
  accent: {
    deepBlue: '#4A90E2',
    darkBlue: '#2C4A6B',
    frenchRed: '#CE1126',
    frenchBlue: '#002395',
  },
  severity: {
    high: '#CE1126',
    medium: '#0051C3',
    low: '#546E7A',
  },
  text: {
    primary: '#E8EAF0',
    secondary: '#9BA3B5',
    muted: '#6B7280',
  },
  border: '#1E2837',
  success: '#059669',
};

const lightColors = {
  background: {
    primary: '#F5F7FA',
    secondary: '#FFFFFF',
    card: '#FFFFFF',
    hover: '#F0F2F5',
  },
  accent: {
    deepBlue: '#4A90E2',
    darkBlue: '#2C4A6B',
    frenchRed: '#CE1126',
    frenchBlue: '#002395',
  },
  severity: {
    high: '#CE1126',
    medium: '#0051C3',
    low: '#546E7A',
  },
  text: {
    primary: '#1A1F2E',
    secondary: '#4A5568',
    muted: '#718096',
  },
  border: '#E2E8F0',
  success: '#059669',
};

export const getColors = (mode: ThemeMode = 'dark') => {
  return mode === 'dark' ? darkColors : lightColors;
};

// Export des deux palettes pour référence
export { darkColors, lightColors };

// Export par défaut pour compatibilité (dark mode)
export const COLORS = darkColors;

export const TYPOGRAPHY = {
  fontFamily: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
};
