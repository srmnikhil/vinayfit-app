import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { AnimatedPressable } from '../components/AnimatedPressable'; // 👈 use your custom one

export default function NotificationScreen() {
  const notifications = [
    {
      id: 1,
      title: 'Workout Reminder',
      message: 'Time for your Upper Body session 💪',
      time: '2h ago',
      type: 'reminder',
      read: false,
    },
    {
      id: 2,
      title: 'New Message from Coach',
      message: '“Don’t forget to stretch before your cardio.”',
      time: '5h ago',
      type: 'message',
      read: false,
    },
    {
      id: 3,
      title: 'Goal Achieved 🎉',
      message: 'You’ve completed 5 workouts this week!',
      time: '1d ago',
      type: 'achievement',
      read: true,
    },
    {
      id: 4,
      title: 'Missed Workout',
      message: 'You skipped your Thursday session. Reschedule now.',
      time: '2d ago',
      type: 'alert',
      read: true,
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Bell color="#2F6BFF" size={20} strokeWidth={1.5} />;
      case 'message':
        return <CheckCircle2 color="#2F6BFF" size={20} strokeWidth={1.5} />;
      case 'achievement':
        return <CheckCircle2 color="#10B981" size={20} strokeWidth={1.5} />;
      case 'alert':
        return <XCircle color="#EF4444" size={20} strokeWidth={1.5} />;
      default:
        return <Bell color="#A2ACBA" size={20} strokeWidth={1.5} />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-appBackground px-5">
      {/* Header */}
      <View className="flex-row items-center justify-between py-4">
        <Text className="text-textPrimary text-2xl font-inter-bold">
          Notifications
        </Text>
        <AnimatedPressable
          onPress={() => console.log('Clear all pressed')}
          className="p-2"
          innerClassName="items-center justify-center"
        >
          <Text className="text-accent text-base font-semibold">Clear All</Text>
        </AnimatedPressable>
      </View>

      {/* Notifications List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {notifications.map((item) => (
          <AnimatedPressable
            key={item.id}
            onPress={() => console.log(`${item.title} pressed`)}
            className="mb-3"
            innerClassName={`flex-row items-start gap-4 p-4 rounded-2xl border ${
              item.read
                ? 'border-cardBorder bg-cardBackground/60'
                : 'border-accent/40 bg-cardBackground'
            }`}
          >
            {/* Icon */}
            <View className="p-2 rounded-full bg-accent/10">
              {getIcon(item.type)}
            </View>

            {/* Texts */}
            <View className="flex-1">
              <Text className="text-textPrimary text-base font-inter-semibold mb-1">
                {item.title}
              </Text>
              <Text className="text-textTertiary text-sm mb-2 leading-5">
                {item.message}
              </Text>
              <View className="flex-row items-center gap-1">
                <Clock color="#7B8493" size={14} strokeWidth={1.5} />
                <Text className="text-textSecondary text-xs">{item.time}</Text>
              </View>
            </View>
          </AnimatedPressable>
        ))}

        {/* Empty State */}
        {notifications.length === 0 && (
          <View className="items-center justify-center mt-20">
            <Bell color="#7B8493" size={40} strokeWidth={1.5} />
            <Text className="text-textTertiary text-base mt-3">
              No new notifications
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
