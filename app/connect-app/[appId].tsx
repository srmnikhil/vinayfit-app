import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';

export default function ConnectAppScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { appId } = useLocalSearchParams();

  const getAppInfo = (id: string) => {
    const apps = {
      'health-connect': {
        name: 'Health Connect',
        icon: '❤️',
        description: 'Everfit will automatically sync data for selected metrics with Apple Health upon launch of the app. You can also manually sync below.',
      },
      'google-fit': {
        name: 'Google Fit',
        icon: '❤️',
        description: 'Connect with Google Fit to sync your fitness data automatically.',
      },
      'fitbit': {
        name: 'Fitbit',
        icon: '⚡',
        description: 'Connect with Fitbit to sync your activity and health data.',
      },
      'myfitnesspal': {
        name: 'MyFitnessPal',
        icon: '🏃',
        description: 'Connect with MyFitnessPal to sync your nutrition data.',
      },
      'cronometer': {
        name: 'Cronometer',
        icon: '🎯',
        description: 'Connect with Cronometer to sync your nutrition tracking.',
      },
      'garmin': {
        name: 'Garmin',
        icon: '⚫',
        description: 'Connect with Garmin to sync your fitness and activity data.',
      },
      'oura': {
        name: 'Oura',
        icon: '⚫',
        description: 'Connect with Oura to sync your sleep and recovery data.',
      },
    };
    return apps[id as keyof typeof apps] || apps['health-connect'];
  };

  const appInfo = getAppInfo(appId as string);

  const handleConnect = () => {
    // Simulate connection process
    Alert.alert(
      'Connection Successful',
      `Successfully connected to ${appInfo.name}!`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>App Integration</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* App Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.appIconCircle}>
            <Text style={styles.appIcon}>{appInfo.icon}</Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.appName}>Connect to {appInfo.name}</Text>
          <Text style={styles.appDescription}>{appInfo.description}</Text>
        </View>

        {/* Connect Button */}
        <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  appIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  appIcon: {
    fontSize: 48,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  appDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 60,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  connectButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});