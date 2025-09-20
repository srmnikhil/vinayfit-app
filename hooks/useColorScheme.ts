import { useColorScheme as useNativeColorScheme } from 'react-native';

export function useColorScheme() {
  return useNativeColorScheme();
}

export const Colors = {
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#1D4ED8',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
    shadow: 'rgba(0, 0, 0, 0.05)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    primary: '#60A5FA',
    primaryLight: '#93C5FD',
    primaryDark: '#3B82F6',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    border: '#475569',
    borderLight: '#334155',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#22D3EE',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export function getColors(colorScheme: 'light' | 'dark' | undefined | null) {
  return Colors[colorScheme === 'dark' ? 'dark' : 'light'];
}