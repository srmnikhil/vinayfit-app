import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import {
  MessageCircle,
  Dumbbell,
  UtensilsCrossed,
  ChevronRight,
  MapPin,
  Phone,
  Upload,
  Bell,
} from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

interface CoachingClientViewProps {
  onNavigateToWorkouts: () => void;
  onNavigateToDiet: () => void;
}

const upcomingSessions = [
  {
    day: 'Thu',
    date: '09 Oct',
    time: '7:00 AM',
    type: 'workout',
    title: 'Upper Body (Gym)',
    icon: 'location',
  },
  {
    day: 'Fri',
    date: '10 Oct',
    time: '8:00 AM',
    type: 'diet',
    title: 'Breakfast Check-in',
    icon: 'phone',
  },
  {
    day: 'Sat',
    date: '11 Oct',
    time: '6:30 AM',
    type: 'workout',
    title: 'Lower Body (Gym)',
    icon: 'location',
  },
  {
    day: 'Sun',
    date: '12 Oct',
    time: '9:00 AM',
    type: 'diet',
    title: 'Weekly Review Call',
    icon: 'phone',
  },
];

export default function CoachingClientView({
  onNavigateToWorkouts,
  onNavigateToDiet,
}: CoachingClientViewProps) {
  const [loading, setLoading] = React.useState(false);
  const tabHeight = useBottomTabBarHeight();

  return (
    <View className="flex-1 bg-appBackground pt-2 px-4">
      {/* Header */}
      <Text className="text-textPrimary text-2xl font-inter-bold mb-4">
        Coaching
      </Text>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabHeight + 30, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Workouts & Diet */}
        <View className="flex-row justify-between">
          {/* Workouts Card */}
          <AnimatedPressable
            onPress={onNavigateToWorkouts}
            className="w-[48%]"
            innerClassName="bg-cardBackground border border-cardBorder rounded-2xl p-5"
          >
            <View className="flex-col gap-3">
              <View className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 items-center justify-center">
                <Dumbbell
                  size={24}
                  color="#2F6BFF"
                  strokeWidth={1.5}
                  style={{ transform: [{ rotate: '90deg' }] }}
                />
              </View>
              <Text className="text-textPrimary text-lg font-inter-semibold ">
                Workouts
              </Text>
              <Text className="text-textSecondary text-sm">
                See monthly calendar
              </Text>
              <Text className="text-textTertiary text-base">
                Thu · Upper Body · 45 min
              </Text>
              <ChevronRight
                size={18}
                color="#7B8493"
                style={{ alignSelf: 'flex-end' }}
              />
            </View>
          </AnimatedPressable>

          {/* Diet Card */}
          <AnimatedPressable
            onPress={onNavigateToDiet}
            className="w-[48%]"
            innerClassName="bg-cardBackground border border-cardBorder rounded-2xl p-5"
          >
            <View className="flex-col gap-3">
              <View className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 items-center justify-center">
                <UtensilsCrossed size={24} color="#2F6BFF" strokeWidth={1.5} />
              </View>
              <Text className="text-textPrimary text-lg font-inter-semibold">
                Diet
              </Text>
              <Text className="text-textSecondary text-sm">
                See monthly calendar
              </Text>
              <Text className="text-textTertiary text-base">
                Today: NOVA Diet · Day 3
              </Text>
              <ChevronRight
                size={18}
                color="#7B8493"
                style={{ alignSelf: 'flex-end' }}
              />
            </View>
          </AnimatedPressable>
        </View>

        {/* Coach Card */}
        <View className="bg-cardBackground border border-cardBorder rounded-2xl p-5">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
              <Text className="text-accent text-base font-inter-bold">RK</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-textPrimary text-base font-inter-semibold">
                Coach Rahul
              </Text>
              <Text className="text-textSecondary text-sm">
                Your fitness coach
              </Text>
            </View>

            <AnimatedPressable innerClassName="p-2 rounded-lg bg-transparent">
              <MessageCircle size={20} color="#2F6BFF" />
            </AnimatedPressable>
          </View>

          <View className="bg-appBackground border border-cardBorder rounded-xl px-4 py-3">
            <Text className="text-textTertiary text-sm">
              Low adherence this week — book a restart call.
            </Text>
          </View>
        </View>

        {/* Restart Call */}
        <View className="bg-cardBackground border border-cardBorder rounded-2xl p-5">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
              <Phone size={20} color="#2F6BFF" />
            </View>
            <Text className="flex-1 text-textPrimary text-[14px] font-inter-semibold ml-3">
              15-min Restart Call
            </Text>
          </View>

          <View className="flex-row gap-3">
            <AnimatedPressable
              innerClassName="border border-accent rounded-xl py-2.5 px-4 justify-center"
              style={{ flex: 1 }}
            >
              <Text className="text-textPrimary text-[14px] font-inter-semibold">
                Book
              </Text>
            </AnimatedPressable>

            <AnimatedPressable innerClassName="py-2.5 px-4 items-center justify-center">
              <Text className="text-textTertiary text-[14px] font-inter-semibold">
                Message coach
              </Text>
            </AnimatedPressable>
          </View>
        </View>

        {/* Upcoming Sessions */}
          <View>
            <Text className="text-textSecondary text-[14px] font-inter-semibold mb-3">
              Upcoming
            </Text>
            <View className="bg-cardBackground border border-cardBorder rounded-2xl overflow-hidden">
              {upcomingSessions.map((session, index) => (
                <AnimatedPressable
                  key={index}
                  innerClassName={`w-full px-5 py-4 flex-row items-center gap-3 ${
                    index !== upcomingSessions.length - 1
                      ? 'border-b border-cardBorder'
                      : ''
                  }`}
                >
                  <View
                    className={`w-2 h-2 rounded-full ${
                      session.type === 'workout'
                        ? 'bg-accent'
                        : 'bg-textTertiary'
                    }`}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      {session.type === 'workout' ? (
                        <Dumbbell size={14} color="#7B8493" />
                      ) : (
                        <UtensilsCrossed size={14} color="#7B8493" />
                      )}
                      <Text className="text-textPrimary text-[14px] font-inter-semibold">
                        {session.title}
                      </Text>
                    </View>
                    <Text className="text-textSecondary text-[12px]">
                      {session.day}, {session.date} · {session.time}
                    </Text>
                  </View>

                  {session.icon === 'location' && (
                    <MapPin size={16} color="#7B8493" />
                  )}
                  {session.icon === 'phone' && (
                    <Phone size={16} color="#7B8493" />
                  )}
                  <ChevronRight size={16} color="#7B8493" />
                </AnimatedPressable>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View>
            <Text className="text-textSecondary text-[14px] font-inter-semibold mb-3">
              Quick actions
            </Text>
            <View className="flex-row justify-between">
              {[Dumbbell, MessageCircle, Upload].map((Icon, i) => (
                <AnimatedPressable
                  key={i}
                  className="w-[31%]"
                  innerClassName="h-16 bg-cardBackground border border-cardBorder rounded-2xl items-center justify-center"
                >
                  <Icon size={20} color="#E9ECF1" />
                </AnimatedPressable>
              ))}
            </View>
          </View>
      </ScrollView>
    </View>
  );
}
