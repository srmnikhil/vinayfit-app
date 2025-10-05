import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { useUserRole } from '@/contexts/UserContext';
import { useTodayDataNew } from '@/hooks/useTodayDataNew';

// Import the new data-driven components
// import TodayClientViewWithData from '@/components/today/TodayClientViewWithData';
import TodayTrainerViewWithData from '@/components/today/TodayTrainerViewWithData';
import TodayNutritionistViewWithData from '@/components/today/TodayNutritionistViewWithData';
import TodayAdminViewWithData from '@/components/today/TodayAdminViewWithData';
import TodayClientViewWithData from '@/components/today/TodayClientViewWithData';
import TodayTrainerViewNew from '@/components/today/TodayTrainerViewNew';
import LeadsView from '@/components/today/LeadsView';
import Loader from '@/components/Loader';

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme || 'light');
  const { userRole } = useUserRole();
  const { loading, error } = useTodayDataNew();

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Unable to load data
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (userRole === null) {
    return <Loader label="Loading your dashboard..." />;
  }

  // Render appropriate view based on user role
  switch (userRole) {
    case 'leads':
      return <LeadsView />;
    case 'client':
      return <TodayClientViewWithData />;
    case 'trainer':
      return <TodayTrainerViewNew />;
    case 'nutritionist':
      return <TodayNutritionistViewWithData />;
    case 'admin':
    case 'hr':
      return <TodayAdminViewWithData />;
    default:
      return (
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View style={styles.errorContainer}>
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Welcome to VinayFit
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              Please complete your profile setup to continue. "You can do this
              in the Profile tab."
            </Text>
          </View>
        </SafeAreaView>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
