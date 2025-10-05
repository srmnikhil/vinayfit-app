import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

export default function LeadsView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme || 'light'); // respects light/dark mode
  const { user } = useAuth();

  const handlePurchaseClick = () => {
    alert('Redirect to membership purchase flow!');
  };

  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const displayNameRaw =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.first_name ||
    (typeof user?.email === 'string' && user.email
      ? user.email.split('@')[0]
      : 'Guest');

  const displayName = capitalizeWords(displayNameRaw);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 16,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            alignItems: 'center',
          }}
        >
          {/* Illustration */}
          <Image
            source={require('../../assets/images/motivationIllustration.png')}
            style={{ width: 250, height: 250, }}
            resizeMode="contain"
          />

          {/* Heading & Subtitle */}
          <Text
            style={{
              fontFamily: 'Inter-Bold',
              fontSize: 22,
              color: colors.text,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Welcome, {displayName}!
          </Text>
          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 16,
              color: colors.textSecondary,
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            You currently don’t have an active membership. Start your fitness
            journey today!
          </Text>

          {/* Primary CTA */}
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              marginBottom: 24,
            }}
            onPress={handlePurchaseClick}
          >
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontSize: 16,
                color: '#fff',
              }}
            >
              Purchase Membership
            </Text>
          </TouchableOpacity>

          {/* Feature Highlights */}
          <View style={{ width: '100%', gap: 12 }}>
            {[
              {
                title: 'Track your workouts',
                subtitle: 'Log exercises & sessions easily.',
              },
              {
                title: 'Set fitness goals',
                subtitle: 'Create goals and monitor progress.',
              },
              {
                title: 'Personalized plans',
                subtitle: 'Get plans tailored to you.',
              },
            ].map((feature, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter-SemiBold',
                    fontSize: 16,
                    color: colors.text,
                    marginBottom: 4,
                  }}
                >
                  {feature.title}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter-Regular',
                    fontSize: 14,
                    color: colors.textTertiary,
                    textAlign: 'center',
                  }}
                >
                  {feature.subtitle}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
