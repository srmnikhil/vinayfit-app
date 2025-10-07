import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Settings,
  Clock,
  Droplets,
  TrendingUp,
  Calendar,
  Star,
  Camera,
  ChartBar as BarChart3,
  Target,
  ChevronRight,
  Activity,
  LogOut,
  Footprints,
  Download,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { useUserRole } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as Updates from 'expo-updates';

// Import role-specific profile views
import ProfileClientView from '@/components/profile/ProfileClientView';
import ProfileTrainerView from '@/components/profile/ProfileTrainerView';
import ProfileNutritionistView from '@/components/profile/ProfileNutritionistView';
import ProfileAdminView from '@/components/profile/ProfileAdminView';
import ProfileHRView from '@/components/profile/ProfileHRView';

const { width } = Dimensions.get('window');

const weightData = [
  { date: '4/24', weight: 72 },
  { date: '5/6', weight: 71.5 },
  { date: '5/18', weight: 71 },
  { date: '5/30', weight: 70.5 },
  { date: '6/11', weight: 70 },
  { date: '6/22', weight: 69.5 },
];

export default function ProfileView() {
  // ✅ ALL HOOKS AT THE TOP - BEFORE ANY CONDITIONAL LOGIC
  const { user, signOut, loading } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const { userRole, userName, setUserRole } = useUserRole();

  // State hooks
  const [trainingMinutes] = useState(184);
  const [streakDays] = useState(0);
  const [currentWeight] = useState(69.5);
  const [goalWeight] = useState(68);
  const [rating] = useState(4.8);
  const [trainerRating, setTrainerRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);


  useEffect(() => {
    const fetchTrainerRating = async () => {
      if (userRole === 'trainer' && user) {
        // Example Supabase query, adjust table/column names as needed
        const { data, error } = await supabase
          .from('trainer_ratings')
          .select('average_rating, review_count')
          .eq('trainer_id', user.id)
          .single();

        if (!error && data) {
          setTrainerRating(data.average_rating);
          setReviewCount(data.review_count);
        }
      }
    };
    fetchTrainerRating();
  }, [userRole, user]);

  // 🟢 Create styles after hooks but before conditional logic
  const styles = createStyles(colors);

  // ✅ CONDITIONAL LOGIC AFTER ALL HOOKS
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Signing out...</Text>
      </View>
    );
  }

  // Compute user display values
  const userInitials =
    user?.user_metadata?.first_name && user?.user_metadata?.last_name
      ? `${user.user_metadata.first_name[0].toUpperCase()}${user.user_metadata.last_name[0].toUpperCase()}`
      : user?.email?.[0]?.toUpperCase() || 'U';

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'User';

  // Checking for update manually
  const checkForUpdateManual = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          'A new version of the app is available. Click to update and restart.',
          [
            {
              text: 'Click to Update',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                } catch (e) {
                  console.error('Error updating app:', e);
                }
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
          { cancelable: true }
        );
      }
      Alert.alert(
        'Latest Version',
        'You are already using the latest version of the app.'
      );
    } catch (e) {
      console.error('Failed to check for updates:', e);
    }
  };

  // Handle logout function
  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out. Please try again.', [
              { text: 'OK' },
            ]);
          }
        },
      },
    ]);
  };

  // Get gradient colors based on user role
  const getGradientColors = () => {
    const baseColors = {
      trainer:
        colorScheme === 'dark'
          ? ['#1E40AF', '#3730A3']
          : ['#667EEA', '#764BA2'],
      hr:
        colorScheme === 'dark'
          ? ['#059669', '#EC4899']
          : ['#A8EDEA', '#FED6E3'],
      admin:
        colorScheme === 'dark'
          ? ['#DC2626', '#F59E0B']
          : ['#FA709A', '#FEE140'],
      nutritionist:
        colorScheme === 'dark'
          ? ['#0284C7', '#0891B2']
          : ['#4FACFE', '#00F2FE'],
      client:
        colorScheme === 'dark'
          ? ['#1E40AF', '#3730A3']
          : ['#667EEA', '#764BA2'],
    };
    return (
      baseColors[(userRole ?? 'client') as keyof typeof baseColors] ||
      baseColors.client
    );
  };

  // Get role display name
  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'hr':
        return 'HR Manager';
      case 'trainer':
        return 'Personal Trainer';
      case 'nutritionist':
        return 'Certified Nutritionist';
      case 'admin':
        return 'Admin Manager';
      case 'client':
      case 'leads':
        return 'Guest';
      default:
        return 'Client';
    }
  };

  // Render role-specific profile content
  const renderProfileContent = () => {
    switch (userRole) {
      case 'client':
        return <ProfileClientView />;
      case 'trainer':
        return <ProfileTrainerView />;
      case 'nutritionist':
        return <ProfileNutritionistView />;
      case 'admin':
        return <ProfileAdminView />;
      case 'hr':
        return <ProfileHRView />;
      default:
        return <ProfileClientView />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>You</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Settings size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={getGradientColors() as [string, string]}
            style={styles.profileAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.profileInitials}>{userInitials}</Text>
          </LinearGradient>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Hi, {displayName}!</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileRole}>{getRoleDisplayName()}</Text>
          </View>
        </View>

        {/* Role-specific stats */}
        <View style={styles.statsContainer}>
          {userRole === 'trainer' && (
            <View style={styles.ratingContainer}>
              <Star size={16} color={colors.warning} fill={colors.warning} />
              <Text style={styles.ratingText}>
                {trainerRating !== null
                  ? `${trainerRating.toFixed(1)} / 5.0`
                  : 'No rating yet'}
              </Text>
              {reviewCount !== null && (
                <Text style={styles.ratingText}>({reviewCount} reviews)</Text>
              )}
            </View>
          )}

          {userRole === 'client' && (
            <TouchableOpacity
              style={styles.goalButton}
              onPress={() => router.push('/set-fitness-goal')}
            >
              <Text style={styles.goalButtonText}>
                Set your fitness goal{' '}
                <Text style={styles.goalButtonLink}>(add)</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Role-specific content */}
        <View style={styles.roleContentContainer}>
          {renderProfileContent()}
        </View>

        {/* Menu Items - Only logout for now */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={checkForUpdateManual}
          >
            <View
              style={[
                styles.menuIcon,
                { backgroundColor: `${colors.error}15` },
              ]}
            >
              <Download size={20} color={colors.warning} />
            </View>
            <Text style={styles.menuText}>Check for Updates</Text>
            <ChevronRight size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View
              style={[
                styles.menuIcon,
                { backgroundColor: `${colors.error}15` },
              ]}
            >
              <LogOut size={20} color={colors.error} />
            </View>
            <Text style={styles.menuText}>Sign Out</Text>
            <ChevronRight size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      color: colors.text,
      fontSize: 18,
      fontFamily: 'Inter-Medium',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
    },
    title: {
      fontFamily: 'Inter-Bold',
      fontSize: 28,
      color: colors.text,
    },
    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    profileAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    profileInitials: {
      fontFamily: 'Inter-Bold',
      fontSize: 24,
      color: '#FFFFFF',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontFamily: 'Inter-Bold',
      fontSize: 20,
      color: colors.text,
      marginBottom: 4,
    },
    profileEmail: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    profileRole: {
      fontFamily: 'Inter-Medium',
      fontSize: 14,
      color: colors.primary,
    },
    statsContainer: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      fontFamily: 'Inter-Medium',
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    goalButton: {
      paddingVertical: 2,
    },
    goalButtonText: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      color: colors.textSecondary,
    },
    goalButtonLink: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    roleContentContainer: {
      marginBottom: 24,
    },
    menuSection: {
      paddingHorizontal: 20,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 1,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    menuText: {
      flex: 1,
      fontFamily: 'Inter-Medium',
      fontSize: 16,
      color: colors.text,
    },
  });
