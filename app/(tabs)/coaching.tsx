import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useUserRole } from '@/contexts/UserContext';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

// Import role-specific views
import CoachingClientView from '@/components/coaching/CoachingClientView';
import CoachingTrainerView from '@/components/coaching/CoachingTrainerView';
import Loader from '@/components/Loader';
import RestrictedAccess from '@/components/RestrictedAccess';

export default function CoachingScreen() {
  const { userRole } = useUserRole();
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? 'light');

  // Show loading screen until userRole is defined
  if (userRole === null) {
    return <Loader label="Loading Coaching Screen..." />;
  }

  if (userRole === 'leads') {
    return (
      <RestrictedAccess message="You do not have access to the Coaching section." />
    );
  }

  // Redirect to login if somehow userRole is undefined/invalid
  useEffect(() => {
    if (!userRole) {
      router.replace('/(auth)/login');
    }
  }, [userRole]);

  // Render based on role
  switch (userRole) {
    case 'client':
      return <CoachingClientView />;
    case 'trainer':
      return <CoachingTrainerView />;
    case 'nutritionist':
      return <CoachingClientView />; // TODO
    case 'admin':
      return <CoachingClientView />; // TODO
    case 'hr':
      return <CoachingClientView />; // TODO
    default:
      return <CoachingClientView />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
});
