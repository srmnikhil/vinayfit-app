import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, Calendar, Phone } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  sender: string;
  text: string;
  time: string;
  isCoach: boolean;
}

interface Thread {
  name: string;
  messages: Message[];
}

const conversations: Thread[] = [
  {
    name: 'Coach Rahul',
    messages: [
      { sender: 'Coach Rahul', text: 'Hey!', time: '10:30 AM', isCoach: true },
      { sender: 'You', text: 'Hello!', time: '10:35 AM', isCoach: false },
      {
        sender: 'Coach Rahul',
        text: 'Great job!',
        time: '10:40 AM',
        isCoach: true,
      },
    ],
  },
  {
    name: 'Nutrition Team',
    messages: [
      {
        sender: 'Nutrition Team',
        text: 'Meal plan ready!',
        time: 'Yesterday',
        isCoach: true,
      },
    ],
  },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const threadIndex = Number(id); // convert param to number
  const thread = conversations[threadIndex];
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');

  if (!thread) {
    return (
      <View className="flex-1 items-center justify-center bg-appBackground">
        <Text className="text-textPrimary text-base">Thread not found</Text>
      </View>
    );
  }

  const isCoachThread = threadIndex === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 60 : 0}
    >
      <View className="flex-1 bg-appBackground">
        {/* Top Safe Area */}
        <View style={{ height: insets.top }} />

        {/* Header */}
        <View className="flex-row items-center gap-3 px-4 pt-4 pb-3 border-b border-cardBorder">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-xl bg-accent/5"
          >
            <ChevronLeft color="#E9ECF1" size={20} strokeWidth={1.5} />
          </TouchableOpacity>
          <View>
            <Text className="text-textPrimary text-base font-semibold">
              {thread.name}
            </Text>
            <Text className="text-textSecondary text-xs">Active now</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {thread.messages.map((msg, index) => (
            <View
              key={index}
              className={`flex ${msg.isCoach ? 'items-start' : 'items-end'} mb-4`}
            >
              <View
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.isCoach
                    ? 'bg-cardBackground border border-cardBorder'
                    : 'bg-accent/10 border border-accent/20'
                }`}
              >
                <Text className="text-textPrimary text-sm">{msg.text}</Text>
              </View>
              <Text className="text-textSecondary text-xs italic mt-1">
                {msg.time}
              </Text>
            </View>
          ))}

          {/* Quick Actions */}
          {isCoachThread && (
            <View className="mt-4 border-t border-cardBorder pt-4">
              <Text className="text-textSecondary text-xs mb-3 font-semibold">
                Quick actions
              </Text>
              <View className="flex-row gap-3">
                <AnimatedPressable
                  onPress={() => console.log('Book restart call')}
                  style={{ flex: 1 }}
                >
                  <View className="flex-1 flex-row items-center justify-center gap-2 bg-cardBackground border border-cardBorder rounded-xl py-3">
                    <Phone color="#E9ECF1" size={16} strokeWidth={1.5} />
                    <Text className="text-textPrimary text-sm font-semibold">
                      Book restart call
                    </Text>
                  </View>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => console.log('View session')}
                  style={{ flex: 1 }}
                >
                  <View className="flex-1 flex-row items-center justify-center gap-2 bg-cardBackground border border-cardBorder rounded-xl py-3">
                    <Calendar color="#E9ECF1" size={16} strokeWidth={1.5} />
                    <Text className="text-textPrimary text-sm font-semibold">
                      View sessions
                    </Text>
                  </View>
                </AnimatedPressable>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="px-4 py-3 bg-appBackground border-t border-cardBorder">
          <View className="flex-row gap-2">
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#7B8493"
              className="flex-1 bg-cardBackground border border-cardBorder rounded-xl px-4 py-3 text-textPrimary"
            />
            <TouchableOpacity
              onPress={() => {
                console.log('Send message:', message);
                setMessage('');
              }}
              className="bg-accent rounded-xl px-4 py-3"
            >
              <Text className="text-white font-semibold text-sm">Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
