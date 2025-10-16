import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {
  X,
  CreditCard,
  PauseCircle,
  ArrowUpCircle,
  HelpCircle,
} from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';

const { height } = Dimensions.get('window');

interface MembershipSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MembershipSheet = ({ isOpen, onClose }: MembershipSheetProps) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : height,
      duration: isOpen ? 300 : 250,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <View className="absolute inset-0 z-50">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="absolute inset-0 bg-black/60" />
      </TouchableWithoutFeedback>

      {/* Bottom Sheet */}
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
          height: height * 0.85,
        }}
        className="absolute bottom-0 w-full bg-cardBackground border-t border-cardBorder rounded-t-3xl"
      >
        {/* Handle */}
        <View className="flex justify-center pt-3 pb-2 items-center">
          <View className="w-10 h-1 bg-textSecondary/20 rounded-full" />
        </View>

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-cardBorder">
          <Text className="text-textPrimary text-xl font-inter-bold">
            Membership
          </Text>
          <AnimatedPressable
            onPress={onClose}
            className="p-2 rounded-lg bg-accent/5"
            scaleTo={0.9}
            innerClassName=""
          >
            <X color="#A2ACBA" size={20} strokeWidth={1.5} />
          </AnimatedPressable>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1 px-5 py-5"
          showsVerticalScrollIndicator={false}
        >
          {/* Plan Card */}
          <View className="bg-cardBackground border border-cardBorder rounded-2xl p-5 mb-5">
            <View className="flex-row justify-between mb-4">
              <View>
                <Text className="text-textPrimary text-base font-inter-semibold">
                  Premium Plan
                </Text>
                <View className="items-center px-3 py-1 bg-[#32D583]/10 border border-[#32D583]/20 rounded-full mt-1">
                  <Text className="text-[#32D583] text-xs font-inter-semibold">
                    Active
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-textPrimary text-2xl font-inter-semibold">
                  83
                </Text>
                <Text className="text-textSecondary text-xs">Days left</Text>
              </View>
            </View>

            <View className="border-t border-cardBorder pt-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-textSecondary text-sm">Start date</Text>
                <Text className="text-textPrimary text-sm font-inter-semibold">
                  01 Jan 2025
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-textSecondary text-sm">End date</Text>
                <Text className="text-textPrimary text-sm font-inter-semibold">
                  31 Dec 2025
                </Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          {[
            {
              icon: CreditCard,
              title: 'View invoices',
              desc: 'See payment history',
            },
            {
              icon: PauseCircle,
              title: 'Pause membership',
              desc: 'Take a break anytime',
            },
            {
              icon: ArrowUpCircle,
              title: 'Upgrade',
              desc: 'Explore premium features',
            },
            { icon: HelpCircle, title: 'Need help?', desc: 'Contact support' },
          ].map((item, index) => (
            <AnimatedPressable key={index} scaleTo={0.95}>
              <View className="flex-row items-center gap-3 px-5 py-4 bg-cardBackground border border-cardBorder rounded-2xl mb-3">
                <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
                  <item.icon color="#2F6BFF" size={20} strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-textPrimary text-sm font-inter-semibold">
                    {item.title}
                  </Text>
                  <Text className="text-textSecondary text-xs">
                    {item.desc}
                  </Text>
                </View>
              </View>
            </AnimatedPressable>
          ))}

          {/* Footer Links */}
          <View className="flex-row justify-center items-center gap-3 mt-6">
            {['Terms', 'Privacy', 'Refunds'].map((t, i) => (
              <React.Fragment key={t}>
                <AnimatedPressable scaleTo={0.95}>
                  <Text className="text-textSecondary text-xs">{t}</Text>
                </AnimatedPressable>
                {i < 2 && <Text className="text-textSecondary text-xs">·</Text>}
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};
