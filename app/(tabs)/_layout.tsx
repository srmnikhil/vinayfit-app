import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Chrome as Home, Dumbbell, MessageSquare, Play, User, Users, Apple, Shield, Briefcase, House, HouseIcon } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { useUserRole } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { requestNotificationPermissions, addNotificationResponseReceivedListener, cleanupExpiredNotifications } from '@/utils/notificationService';
import { View, Text } from 'react-native';

function NotificationListener() {
  const { user } = useAuth();
  useEffect(() => {
    let subscription: { remove: () => void } | undefined;
    if (user) {
      (async () => {
        await requestNotificationPermissions();
        await cleanupExpiredNotifications();
        subscription = addNotificationResponseReceivedListener(response => {
          const data = response.notification.request.content.data;
          if (user && data && data.goalId) {
            router.push(`/goal-countdown?goalId=${data.goalId}`);
          }
        });
      })();
    }
    return () => {
      if (subscription) subscription.remove();
    };
  }, [user]);
  return null;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? 'light');
  const { userRole } = useUserRole();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== '/(auth)/welcome') {
      router.replace('/(auth)/login');
    }
  }, [user, loading, pathname]);

  // Define role-specific tab configurations
  const getTabsForRole = () => {
    const baseTabs = [
      {
        name: 'index',
        title: 'Today',
        icon: House,
      },
    ];

    const roleTabs = {
      client: [
        ...baseTabs,
        {
          name: 'coaching',
          title: 'Coaching',
          icon: Dumbbell,
        },
        {
          name: 'on-demand',
          title: 'On-demand',
          icon: Play,
        },
        {
          name: 'inbox',
          title: 'Inbox',
          icon: MessageSquare,
        },
        {
          name: 'profile',
          title: 'You',
          icon: User,
        },
      ],
      trainer: [
        ...baseTabs,
        {
          name: 'coaching',
          title: 'Clients',
          icon: Users,
        },
        {
          name: 'on-demand',
          title: 'Programs',
          icon: Play,
        },
        {
          name: 'inbox',
          title: 'Messages',
          icon: MessageSquare,
        },
        {
          name: 'profile',
          title: 'Profile',
          icon: User,
        },
      ],
      nutritionist: [
        ...baseTabs,
        {
          name: 'coaching',
          title: 'Clients',
          icon: Users,
        },
        {
          name: 'on-demand',
          title: 'Meal Plans',
          icon: Apple,
        },
        {
          name: 'inbox',
          title: 'Messages',
          icon: MessageSquare,
        },
        {
          name: 'profile',
          title: 'Profile',
          icon: User,
        },
      ],
      admin: [
        ...baseTabs,
        {
          name: 'coaching',
          title: 'Management',
          icon: Shield,
        },
        {
          name: 'on-demand',
          title: 'System',
          icon: Play,
        },
        {
          name: 'inbox',
          title: 'Alerts',
          icon: MessageSquare,
        },
        {
          name: 'profile',
          title: 'Admin',
          icon: User,
        },
      ],
      hr: [
        ...baseTabs,
        {
          name: 'coaching',
          title: 'Staff',
          icon: Briefcase,
        },
        {
          name: 'on-demand',
          title: 'Resources',
          icon: Play,
        },
        {
          name: 'inbox',
          title: 'Messages',
          icon: MessageSquare,
        },
        {
          name: 'profile',
          title: 'Profile',
          icon: User,
        },
      ],
    };

    // return roleTabs[userRole || 'client'] || roleTabs.client;
    return roleTabs[(userRole as keyof typeof roleTabs) || 'client'] || roleTabs.client;
  };

  const tabs = getTabsForRole();

  // Memoize tabBarStyle to ensure it updates with color scheme and remains consistent
  const tabBarStyle = React.useMemo(() => ({
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    height: 64, // fixed height
    borderTopColor: colors.border,
    paddingBottom: 0,
    backgroundColor: colors.surface,
    zIndex: 100,
  }), [colors]);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
      {/* Only mount NotificationListener when user is authenticated and navigation is ready */}
      <NotificationListener />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: tabBarStyle,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: styles.tabBarLabel,
        }}>
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                title: tab.title,
                tabBarIcon: ({ size, color }) => (
                  <IconComponent size={size} color={color} />
                ),
              }}
            />
          );
        })}
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginTop: 0, // remove extra margin
  },
});