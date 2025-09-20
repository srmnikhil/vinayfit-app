import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, MessageSquare, Calendar, Trophy } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: any;
  enabled: boolean;
}

export default function NotificationSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: 'workout-reminders',
      title: 'Workout Reminders',
      description: 'Get notified about upcoming workouts',
      icon: Calendar,
      enabled: true,
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Notifications for new messages from trainers',
      icon: MessageSquare,
      enabled: true,
    },
    {
      id: 'achievements',
      title: 'Achievements',
      description: 'Celebrate your fitness milestones',
      icon: Trophy,
      enabled: true,
    },
    {
      id: 'general',
      title: 'General Notifications',
      description: 'App updates and general information',
      icon: Bell,
      enabled: false,
    },
  ]);

  const toggleNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, enabled: !notification.enabled }
          : notification
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            Manage your notification preferences to stay updated with what matters most to you.
          </Text>
        </View>

        <View style={styles.notificationsList}>
          {notifications.map((notification) => {
            const IconComponent = notification.icon;
            return (
              <View key={notification.id} style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <IconComponent size={20} color={colors.primary} />
                  </View>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationDescription}>
                      {notification.description}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notification.enabled}
                  onValueChange={() => toggleNotification(notification.id)}
                  trackColor={{ false: colors.borderLight, true: colors.primary }}
                  thumbColor={notification.enabled ? '#FFFFFF' : colors.textTertiary}
                />
              </View>
            );
          })}
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
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  description: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  descriptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  notificationsList: {
    paddingHorizontal: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  notificationDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});