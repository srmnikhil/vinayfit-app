import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell } from 'lucide-react-native';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;

  const logoSize = isTablet ? 140 : 120;
  const appNameSize = isTablet ? 48 : 40;
  const taglineSize = isTablet ? 20 : 18;

  return (
    <SafeAreaView className="flex-1 bg-[#0F1115]">
      <View
        className={`flex-1 justify-between items-center px-${
          isTablet ? '10' : '16'
        } py-${isLandscape ? '10' : '16'}`}
      >
        {/* Logo Section */}
        <View className="flex-1 justify-center items-center mb-48">
          <View className="mb-12">
            <LinearGradient
              colors={['#5C6BC0', '#6B4BA2', '#D67FFB']} // tweaked gradient shades
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: logoSize,
                height: logoSize,
                borderRadius: logoSize / 2,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#5C6BC0',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 16,
              }}
            >
              <Dumbbell size={48} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </View>

          <Text
            className="text-white text-center font-inter-bold"
            style={{
              fontSize: appNameSize,
              marginBottom: 16,
              letterSpacing: -1,
            }}
          >
            BODIQU
          </Text>

          <Text
            className="text-[#A2ACBA] text-center font-inter-regular"
            style={{ fontSize: taglineSize, lineHeight: 26 }}
          >
            Transform Your Fitness Journey
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="w-full max-w-[320px] space-y-4">
          <TouchableOpacity
            className="rounded-[16px]"
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#5C6BC0', '#6B4BA2']} // tweaked gradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16 }}
              className="py-6 mb-6 items-center"
            >
              <Text className="text-white font-inter-bold text-xl">
                Get Started
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-4 items-center rounded-[16px] border-2 border-[#7B8493] bg-[#12151B]"
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.8}
          >
            <Text className="text-white font-inter-semibold text-[18px]">
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="items-center pb-5">
          <Text className="text-[#A2ACBA] text-center font-inter-regular text-[14px]">
            Start your fitness transformation today
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
