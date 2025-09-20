import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

export default function AuthLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const insets = useSafeAreaInsets();
  return (
    <>
      {/* Render a view under the status bar for background color in edge-to-edge mode */}
      <View style={{ height: insets.top, backgroundColor: colors.background }} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </>
  );
}