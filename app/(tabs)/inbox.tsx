import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { MessageCircle, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { AnimatedPressable } from '@/components/AnimatedPressable';

const conversations = [
  {
    name: 'Coach Rahul',
    message: "Great job on today's workout! Keep it up.",
    time: '2h ago',
    unread: true,
    messages: [
      {
        sender: 'Coach Rahul',
        text: 'Hey Vinay! How are you feeling after yesterday’s session?',
        time: '10:30 AM',
        isCoach: true,
      },
      {
        sender: 'You',
        text: 'Feeling good! A bit sore but in a good way 💪',
        time: '10:45 AM',
        isCoach: false,
      },
      {
        sender: 'Coach Rahul',
        text: 'Perfect! That means we’re hitting the right intensity.',
        time: '11:00 AM',
        isCoach: true,
      },
      {
        sender: 'Coach Rahul',
        text: 'Great job on today’s workout! Keep it up.',
        time: '2h ago',
        isCoach: true,
      },
    ],
  },
  {
    name: 'Nutrition Team',
    message: 'Your meal plan for next week is ready',
    time: '1d ago',
    unread: false,
    messages: [
      {
        sender: 'Nutrition Team',
        text: 'Hi! Your customized meal plan for next week is ready.',
        time: 'Yesterday',
        isCoach: true,
      },
      {
        sender: 'Nutrition Team',
        text: 'Your meal plan for next week is ready',
        time: '1d ago',
        isCoach: true,
      },
    ],
  },
  {
    name: 'Support',
    message: 'Thanks for your feedback!',
    time: '3d ago',
    unread: false,
    messages: [
      {
        sender: 'Support',
        text: 'Thanks for your feedback!',
        time: '3d ago',
        isCoach: true,
      },
    ],
  },
];

export default function InboxScreen() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="flex-1 bg-appBackground pt-2 px-4">
      {/* Header */}
      <View className="pb-3">
        <Text className="text-textPrimary text-2xl font-inter-bold mb-3">
          Inbox
        </Text>
        <View
          className={`flex-row items-center bg-cardBackground rounded-xl px-3 py-1 border ${
            isFocused ? 'border-accent' : 'border-cardBorder'
          }`}
        >
          <Search color="#7B8493" size={15} strokeWidth={1.5} />
          <TextInput
            placeholder="Search messages"
            placeholderTextColor="#7B8493"
            className="flex-1 text-textPrimary px-2 py-2"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>
      </View>

      {/* Conversations */}
      <FlatList
        data={conversations}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          const isLast = index === conversations.length - 1;

          return (
            <AnimatedPressable
              onPress={() => router.push(`/chat/${index}`)}
              className={`
                flex-row items-start gap-3 p-4
                bg-cardBackground border border-cardBorder
                ${isFirst ? 'rounded-t-2xl' : ''}
                ${isLast ? 'rounded-b-2xl' : ''}
                ${!isLast ? 'border-b-0' : ''}
              `}
              innerClassName="flex-row items-start gap-3 flex-1" // only the row content scales
            >
              {/* Avatar */}
              <View className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 items-center justify-center">
                <MessageCircle color="#2F6BFF" size={20} strokeWidth={1.5} />
              </View>

              {/* Message Content */}
              <View className="flex-1">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-textPrimary text-sm font-semibold">
                    {item.name}
                  </Text>
                  <Text className="text-textSecondary text-xs">
                    {item.time}
                  </Text>
                </View>
                <Text numberOfLines={1} className="text-textSecondary text-sm">
                  {item.message}
                </Text>
              </View>

              {/* Unread Indicator */}
              {item.unread && (
                <View className="w-2 h-2 rounded-full bg-accent mt-2" />
              )}
            </AnimatedPressable>
          );
        }}
      />
    </View>
  );
}
