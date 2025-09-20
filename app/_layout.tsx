import { useEffect } from 'react';
import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { UserStatsProvider } from '@/contexts/UserStatsContext';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import * as Updates from 'expo-updates';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // ✅ Update check effect
  useEffect(() => {
    const checkForUpdate = async () => {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          Alert.alert(
            'Update Available',
            'A new version of the app is available. Click to update and restart.',
            [
              {
                text: 'Click to Update',
                onPress: async () => {
                  try {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  } catch (e) {
                    console.error('Error updating app:', e);
                  }
                },
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ],
            { cancelable: true }
          );
        }
      } catch (e) {
        console.error('Failed to check for updates:', e);
      }
    };

    checkForUpdate();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <UserProvider>
        <UserStatsProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="templates" />
            <Stack.Screen name="create-template" />
            <Stack.Screen name="workout-plans" />
            <Stack.Screen name="create-plan" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar
            style={colorScheme === 'dark' ? 'light' : 'dark'}
            backgroundColor={colors.background}
          />
        </UserStatsProvider>
      </UserProvider>
    </AuthProvider>
  );
}
