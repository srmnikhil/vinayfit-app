import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { ChevronRight, Camera, Flame, Plus, LogOut } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { MembershipSheet } from '@/components/MembershipSheet';
import { MetricsSection } from '@/components/MetricsSection';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const [membershipOpen, setMembershipOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to log out. Please try again.', [
              { text: 'OK' },
            ]);
          }
        },
      },
    ]);
  };

  const settings = [
    { label: 'Edit Profile', isLogout: false },
    { label: 'Notification Preferences', isLogout: false },
    { label: 'Connect Health Data', isLogout: false },
    { label: 'Logout', isLogout: true, onPress: handleLogout },
  ];

  return (
    <View className="flex-1 bg-appBackground px-4 pt-2">
      {/* Header */}
      <Text className="text-textPrimary text-2xl font-inter-bold mb-4">
        Profile
      </Text>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Cards */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-cardBackground border border-cardBorder rounded-2xl p-4">
            <Text className="text-textSecondary text-sm mb-1">
              Training Minutes
            </Text>
            <Text className="text-textPrimary text-3xl font-inter-semibold">
              120
            </Text>
          </View>
          <View className="flex-1 bg-cardBackground border border-cardBorder rounded-2xl p-4">
            <Text className="text-textSecondary text-sm mb-1">Streak Days</Text>
            <Text className="text-textPrimary text-3xl font-inter-semibold">
              5
            </Text>
          </View>
        </View>

        {/* Membership */}
        <AnimatedPressable
          onPress={() => setMembershipOpen(true)}
          className="w-full bg-cardBackground border border-cardBorder rounded-2xl px-4 py-3.5 mb-5 "
        >
          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <Text className="text-textPrimary text-base font-inter-semibold">
                Membership
              </Text>
              <Text className="text-textSecondary mx-2">·</Text>
              <View className="px-2.5 py-0.5 bg-accent/10 border border-accent/20 rounded-full">
                <Text className="text-accent text-xs font-inter-semibold">
                  Premium Plan
                </Text>
              </View>
            </View>
            <ChevronRight color="#7B8493" size={18} strokeWidth={1.5} />
          </View>
        </AnimatedPressable>

        {/* Progress Metrics Header */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-textPrimary text-sm font-inter-semibold tracking-wide">
            PROGRESS METRICS
          </Text>
          <View className="flex-row items-center">
            <Text className="text-textTertiary text-sm font-inter-semibold mr-1">
              See all
            </Text>
            <ChevronRight color="#A2ACBA" size={18} strokeWidth={1.2} />
          </View>
        </View>

        {/* Progress Photos */}
        <AnimatedPressable className="bg-cardBackground border border-cardBorder rounded-2xl p-4 mb-4 ">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-3">
              <View className="flex-row gap-2">
                <View className="w-12 h-16 bg-appBackground border border-cardBorder rounded-lg items-center justify-center">
                  <Camera color="#7B8493" size={20} strokeWidth={1.5} />
                </View>
                <View className="w-12 h-16 bg-appBackground border border-cardBorder rounded-lg items-center justify-center">
                  <Text className="text-lg">📸</Text>
                </View>
              </View>
              <View>
                <Text className="text-textPrimary text-sm font-inter-semibold mb-1">
                  Progress Photos
                </Text>
                <View className="flex-row items-center gap-1.5">
                  <Flame color="#F97066" size={14} strokeWidth={1.5} />
                  <Text className="text-textSecondary text-xs">
                    Weekly streak: 3
                  </Text>
                </View>
              </View>
            </View>

            <View className="px-4 py-2 bg-accent rounded-full">
              <Text className="text-white text-xs font-inter-semibold">
                Add photo
              </Text>
            </View>
          </View>
        </AnimatedPressable>

        <MetricsSection metricsToShow={['bodyweight']} />

        {/* Pinned Metrics */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {['Bodyweight', 'Sleep', 'Steps', 'Calories'].map((metric, index) => (
            <AnimatedPressable
              key={index}
              className="px-4 py-2 bg-cardBackground border border-cardBorder rounded-full"
            >
              <Text className="text-textSecondary text-sm font-inter-semibold">
                {metric}
              </Text>
            </AnimatedPressable>
          ))}

          <AnimatedPressable className="px-4 py-2 bg-appBackground border border-cardBorder rounded-full">
            <View className="flex-row items-center">
              <Plus color="#2F6BFF" size={14} strokeWidth={2} />
              <Text className="text-accent text-sm font-inter-semibold ml-1">
                Add metric
              </Text>
            </View>
          </AnimatedPressable>
        </View>

        {/* Settings */}
        <View className="bg-cardBackground border border-cardBorder rounded-2xl overflow-hidden">
          {settings.map((item, index) => (
            <AnimatedPressable
              key={index}
              onPress={item.onPress}
              className={`w-full px-5 py-4  ${
                index !== settings.length - 1
                  ? 'border-b border-cardBorder'
                  : ''
              }`}
            >
              <View className="flex-row justify-between">
                <View className="flex-row items-center gap-2">
                  {item.isLogout && (
                    <LogOut color="#F97066" size={18} strokeWidth={1.5} />
                  )}
                  <Text
                    className={`text-sm font-inter-semibold ${
                      item.isLogout ? 'text-[#F97066]' : 'text-textPrimary'
                    }`}
                  >
                    {item.label}
                  </Text>
                </View>
                {!item.isLogout && (
                  <ChevronRight color="#7B8493" size={18} strokeWidth={1.5} />
                )}
              </View>
            </AnimatedPressable>
          ))}
        </View>
      </ScrollView>
      <MembershipSheet
        isOpen={membershipOpen}
        onClose={() => setMembershipOpen(false)}
      />
    </View>
  );
}
