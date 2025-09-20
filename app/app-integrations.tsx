import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

interface HealthApp {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  color: string;
}

export default function AppIntegrationsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [healthApps, setHealthApps] = useState<HealthApp[]>([
    {
      id: 'health-connect',
      name: 'Health Connect',
      icon: '💙',
      connected: false,
      color: '#4285F4',
    },
    {
      id: 'google-fit',
      name: 'Google Fit',
      icon: '❤️',
      connected: true,
      color: '#4285F4',
    },
    {
      id: 'fitbit',
      name: 'Fitbit',
      icon: '⚡',
      connected: false,
      color: '#00B0B9',
    },
    {
      id: 'myfitnesspal',
      name: 'MyFitnessPal',
      icon: '🏃',
      connected: false,
      color: '#0066CC',
    },
    {
      id: 'cronometer',
      name: 'Cronometer',
      icon: '🎯',
      connected: false,
      color: '#FF6B35',
    },
    {
      id: 'garmin',
      name: 'Garmin',
      icon: '⚫',
      connected: false,
      color: '#007CC3',
    },
    {
      id: 'oura',
      name: 'Oura',
      icon: '⚫',
      connected: false,
      color: '#1A1A1A',
    },
  ]);

  const handleAppPress = (app: HealthApp) => {
    if (app.connected) {
      router.push('/data-source');
    } else {
      router.push(`/connect-app/${app.id}`);
    }
  };

  const handleDataSourcePress = () => {
    router.push('/data-source');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>App integration</Text>
          <Text style={styles.subtitle}>Data Source</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Floating Icons */}
        <View style={styles.floatingIcons}>
          <View style={[styles.floatingIcon, { top: 20, right: 60 }]}>
            <Text style={styles.iconEmoji}>🎯</Text>
          </View>
          <View style={[styles.floatingIcon, { top: 60, left: 40 }]}>
            <Text style={styles.iconEmoji}>❤️</Text>
          </View>
          <View style={[styles.floatingIcon, { top: 100, right: 100 }]}>
            <Text style={styles.iconEmoji}>🏃</Text>
          </View>
          <View style={[styles.floatingIcon, { top: 140, left: 80 }]}>
            <Text style={styles.iconEmoji}>⚡</Text>
          </View>
          <View style={[styles.floatingIcon, { top: 180, right: 40 }]}>
            <Text style={styles.iconEmoji}>⚫</Text>
          </View>
          <View style={[styles.floatingIcon, { top: 220, left: 120 }]}>
            <Text style={styles.iconEmoji}>💙</Text>
          </View>
          <View style={[styles.floatingIcon, { top: 260, right: 80 }]}>
            <Text style={styles.iconEmoji}>❤️</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.mainTitle}>Connect Your Health Data</Text>
          <Text style={styles.description}>
            Sync your data from apps like Health Connect, Google Fit, Fitbit, MyFitnessPal, 
            Cronometer, Garmin and Oura to update and share fitness data with your coach seamlessly.
          </Text>

          {/* Health Apps List */}
          <View style={styles.appsList}>
            {healthApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={styles.appItem}
                onPress={() => handleAppPress(app)}
              >
                <View style={styles.appLeft}>
                  <View style={styles.appIconContainer}>
                    <Text style={styles.appIcon}>{app.icon}</Text>
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <View style={styles.statusContainer}>
                      {app.connected ? (
                        <>
                          <Check size={14} color={colors.success} />
                          <Text style={[styles.statusText, { color: colors.success }]}>
                            Connected
                          </Text>
                        </>
                      ) : (
                        <Text style={[styles.statusText, { color: colors.textTertiary }]}>
                          Connect Now
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  floatingIcons: {
    position: 'relative',
    height: 300,
    marginBottom: 20,
  },
  floatingIcon: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconEmoji: {
    fontSize: 20,
  },
  mainContent: {
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  appsList: {
    gap: 12,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  appLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appIcon: {
    fontSize: 24,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginLeft: 4,
  },
});