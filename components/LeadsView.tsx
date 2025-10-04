import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';

export default function LeadsView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme || 'light'); // respects light/dark mode

  const handlePurchaseClick = () => {
    alert('Redirect to membership purchase flow!');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1, // allows vertical centering
          justifyContent: 'center', // centers content vertically
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
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter-Bold',
              fontSize: 20,
              color: colors.text,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Welcome, Lead!
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
            You currently don’t have an active membership.
          </Text>

          {/* Dummy Membership Card */}
          <View
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter-SemiBold',
                fontSize: 18,
                color: colors.text,
                marginBottom: 4,
              }}
            >
              Membership Plan
            </Text>
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 14,
                color: colors.textTertiary,
                marginBottom: 12,
              }}
            >
              30 Days Trial
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
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
                Purchase Now
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dummy Info Cards */}
          <View
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
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
              Your Leads Info
            </Text>
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 14,
                color: colors.textTertiary,
              }}
            >
              Here you will see a summary of potential clients, follow-ups, and
              reminders.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 12,
              padding: 16,
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
              Pending Actions
            </Text>
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 14,
                color: colors.textTertiary,
              }}
            >
              No pending actions yet. Once you get leads, they will show up
              here.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
