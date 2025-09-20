import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Clock, Droplets, TrendingUp, Calendar, Camera, ChartBar as BarChart3, Target, ChevronRight, Activity, LogOut, Footprints, RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { useUserRole } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import WeightMetricsCard from '@/components/WeightMetricsCard';
import { getUserMetrics } from '@/lib/metricsDatabase';
import { getCurrentUser } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';


const { width } = Dimensions.get('window');

// Sample data - in a real app, this would come from Supabase and/or Google Fit API
const SAMPLE_DATA = {
  steps: {
    data: [2341, 6423, 5243, 8675, 7654, 9876, 8543],
    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    goal: 10000,
    today: 8543,
  },
  sleep: {
    data: [6.7, 7.2, 5.8, 8.1, 7.5, 6.9, 7.8],
    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    goal: 8,
    today: 7.8,
  },
  heartRate: {
    data: [68, 72, 75, 82, 79, 76, 71, 73],
    times: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'],
    current: 73,
    resting: 65,
  },
  water: {
    goal: 8,
    current: 5,
  },
  weight: {
    data: [60, 59.5, 58.7, 57.2, 56.5, 52.5, 58.5],
    dates: ['4/5', '4/17', '4/29', '5/11', '5/23', '6/3', '6/3'],
  },
  recentWalk: {
    route: [
      { latitude: 37.78825, longitude: -122.4324 },
      { latitude: 37.78843, longitude: -122.4325 },
      { latitude: 37.78856, longitude: -122.4332 },
      { latitude: 37.78865, longitude: -122.4341 },
      { latitude: 37.78875, longitude: -122.4350 },
      { latitude: 37.78895, longitude: -122.4365 },
      { latitude: 37.78915, longitude: -122.4380 },
      { latitude: 37.78925, longitude: -122.4390 },
      { latitude: 37.78935, longitude: -122.4395 },
    ],
    distance: 1240, // meters
    duration: 15, // minutes
    date: 'Today, 8:30 AM',
  },
};

export default function ProfileClientView() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { userRole, userName, setUserRole } = useUserRole();
  const { user, signOut, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);


  if (loading) return null; // Prevent hook mismatch by not rendering until auth is ready

  const [userInitials] = useState(user?.user_metadata?.first_name?.[0] + user?.user_metadata?.last_name?.[0] || 'VD');
  const [trainingMinutes, setTrainingMinutes] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [goalWeight, setGoalWeight] = useState(0);
  const [weightData, setWeightData] = useState<any[]>([]); // Changed type to any[] as MetricDataPoint is removed
  const [chestData, setChestData] = useState<any[]>([]); // Changed type to any[] as MetricDataPoint is removed
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const calculateTrainingStats = async (userId: string) => {
    try {
      // Get training sessions for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: sessions, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('client_id', userId)
        .gte('scheduled_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: false });
      
      if (error) throw error;
      
      // Calculate total training minutes
      const totalMinutes = sessions?.reduce((total, session) => {
        return total + (session.duration || 0);
      }, 0) || 0;
      
      // Calculate streak days
      let streakDays = 0;
      const today = new Date();
      const sessionDates = sessions
        ?.filter(session => session.scheduled_date && session.scheduled_date !== '')
        ?.map(s => {
          const date = safeParseDate(s.scheduled_date);
          return date ? date.toDateString() : null;
        })
        ?.filter(date => date !== null) || [];
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateString = checkDate.toDateString();
        
        if (sessionDates.includes(dateString)) {
          streakDays++;
        } else {
          break; // Streak broken
        }
      }
      
      return { totalMinutes, streakDays };
    } catch (error) {
      console.error('Error calculating training stats:', error);
      return { totalMinutes: 0, streakDays: 0 };
    }
  };

  const fetchUserGoals = async (userId: string) => {
    try {
      const { data: goals, error } = await supabase
        .from('client_goals')
        .select('*')
        .eq('client_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Find weight goal
      const weightGoal = goals?.find(goal => goal.category === 'weight' || goal.title.toLowerCase().includes('weight'));
      return weightGoal?.target_value || 0;
    } catch (error) {
      console.error('Error fetching user goals:', error);
      return 0;
    }
  };

  const safeParseDate = (dateString: string | null | undefined): Date | null => {
    if (!dateString || dateString === '') {
      return null;
    }
    
    try {
      // Try parsing as ISO string first
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Try parsing as YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        const parsedDate = new Date(year, month - 1, day);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      
      // Try parsing as MM/DD/YYYY format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
        const [month, day, year] = dateString.split('/').map(Number);
        const parsedDate = new Date(year, month - 1, day);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      
      console.warn('Could not parse date:', dateString);
      return null;
    } catch (error) {
      console.warn('Error parsing date:', dateString, error);
      return null;
    }
  };

  const loadMetrics = async () => {
    try {
      setMetricsLoading(true);
      setError(null);
      
      const { user } = await getCurrentUser();
      if (user) {
        const entries = await getUserMetrics(user.id);
        
        // Debug: Log the first few entries to see the date format
        if (entries.length > 0) {
          console.log('Sample metric entry:', entries[0]);
          console.log('Date format from Supabase:', typeof entries[0].date, entries[0].date);
          console.log('All entries:', entries.slice(0, 3));
        } else {
          console.log('No metric entries found for user');
        }
        
        // Transform entries into chart data
        const weightEntries = entries.filter(entry => entry.metric_type === 'weight').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const chestEntries = entries.filter(entry => entry.metric_type === 'chest').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Transform to MetricDataPoint format
        const weightChartData: any[] = weightEntries
          .filter(entry => entry.date && entry.date !== '') // Filter out invalid dates
          .map(entry => {
            const date = safeParseDate(entry.date);
            if (!date) {
              console.warn('Invalid date for weight entry:', entry.date);
              return null;
            }
            return {
              date: date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
              value: entry.value,
              time: entry.time // Include time field
            };
          })
          .filter(item => item !== null) as any[];
        
        const chestChartData: any[] = chestEntries
          .filter(entry => entry.date && entry.date !== '') // Filter out invalid dates
          .map(entry => {
            const date = safeParseDate(entry.date);
            if (!date) {
              console.warn('Invalid date for chest entry:', entry.date);
              return null;
            }
            return {
              date: date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
              value: entry.value
            };
          })
          .filter(item => item !== null) as any[];
        
        setWeightData(weightChartData);
        setChestData(chestChartData);
        
        // Set current values
        if (weightChartData.length > 0) {
          setCurrentWeight(weightChartData[weightChartData.length - 1].value);
        } else {
          // Set a default value if no weight data
          setCurrentWeight(0);
        }
        
        // Add fallback data if no entries exist
        if (weightChartData.length === 0) {
          console.log('No weight data found, using fallback');
          setWeightData([{ date: '1/1', value: 0 }]);
        }
        
        if (chestChartData.length === 0) {
          console.log('No chest data found, using fallback');
          setChestData([{ date: '1/1', value: 0 }]);
        }
        
        // Calculate real training statistics
        const { totalMinutes, streakDays } = await calculateTrainingStats(user.id);
        setTrainingMinutes(totalMinutes);
        setStreakDays(streakDays);
        setGoalWeight(await fetchUserGoals(user.id));
        
        console.log('✅ Metrics loaded successfully:', {
          weightEntries: weightChartData.length,
          chestEntries: chestChartData.length,
          totalEntries: entries.length
        });
        
        // Show brief success message
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      setError('Failed to load metrics data');
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // Reload metrics when screen comes into focus (e.g., after adding new metrics)
  useFocusEffect(
    React.useCallback(() => {
      console.log('ProfileClientView focused - reloading metrics');
      loadMetrics();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMetrics();
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const displayName = user?.user_metadata?.full_name || (typeof user?.email === 'string' && user.email ? user.email.split('@')[0] : 'User');

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // Just call signOut; let auth context handle navigation and errors
            signOut();
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      id: 'steps',
      title: 'Steps',
      icon: Footprints,
      color: colors.success,
      onPress: () => router.push('/step-tracker'),
    },
    {
      id: 'activity',
      title: 'Activity history',
      icon: Activity,
      color: colors.primary,
      onPress: () => router.push('/activity-history'),
    },
    {
      id: 'my-plans',
      title: 'My Workout Plans',
      icon: Calendar,
      color: colors.primary,
      onPress: () => router.push('/my-plan'),
    },

    {
      id: 'exercises',
      title: 'Your exercises',
      icon: Target,
      color: colors.success,
      onPress: () => {},
    },
    {
      id: 'progress',
      title: 'Progress photo',
      icon: Camera,
      color: colors.warning,
      onPress: () => router.push('/progress-photo'),
    },
    // Add fitness goals menu item for clients
    ...(userRole === 'client' ? [{
      id: 'goals',
      title: 'Fitness Goals',
      icon: Target,
      color: colors.info,
      onPress: () => router.push('/fitness-goals'),
    }] : []),
  
  ];

  const handleMetricPointPress = (point: any, index: number) => {
    console.log('Metric point pressed:', point, 'at index:', index);
    // You can add haptic feedback or show a tooltip here
  };

  const weightDates = weightData.map(item => item.date);

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>You</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
          <Settings size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View> */}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
      }>
        {/* Profile Header */}
        {/* <View style={styles.profileHeader}>
          <LinearGradient
            colors={colorScheme === 'dark' ? ['#1E40AF', '#3730A3'] : ['#667EEA', '#764BA2']}
            style={styles.profileAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.profileInitials}>{userInitials}</Text>
          </LinearGradient>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Hi, {displayName}!</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileRole}>Role: {userRole}</Text>
            {userRole === 'client' && (
              <TouchableOpacity 
                style={styles.goalButton}
                onPress={() => router.push('/set-fitness-goal')}
              >
                <Text style={styles.goalButtonText}>
                  Set your fitness goal <Text style={styles.goalButtonLink}>(add)</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View> */}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Clock size={20} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{trainingMinutes}</Text>
            <Text style={styles.statLabel}>Training min</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.info}15` }]}>
              <Droplets size={20} color={colors.info} />
            </View>
            <Text style={styles.statNumber}>{streakDays}</Text>
            <Text style={styles.statLabel}>Streak days</Text>
          </View>
        </View>
        <View style={styles.metricsSection}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Metrics</Text>
            <View style={styles.sectionActions}>
              {/* <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw 
                  size={16} 
                  color={colors.primary} 
                  style={refreshing ? { transform: [{ rotate: '360deg' }] } : undefined}
                />
              </TouchableOpacity> */}
              <TouchableOpacity onPress={() => router.push('/client-metrics')}>
                <Text style={styles.viewMoreText}>View more</Text>
              </TouchableOpacity>
            </View>
          </View>
        <WeightMetricsCard
          weightData={weightData.map(item => item.value)}
          dates={weightData.map(item => item.date)}
          // times={weightData.map(item => item.time || '')}
          unit="KG"
          isLoading={isLoading}
        />
</View>


      

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                  <IconComponent size={20} color={item.color} />
                </View>
                <Text style={styles.menuText}>{item.title}</Text>
                <ChevronRight size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: 4,
    textTransform: 'capitalize',
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  metricsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  viewMoreText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
  },
  metricsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  metricsHeader: {
    marginBottom: 12,
  },
  currentValueContainer: {
    marginTop: 8,
  },
  metricsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  currentWeight: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: colors.text,
  },
  weightProgress: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
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
  weightSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewDetailsText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  successContainer: {
    backgroundColor: colors.successLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  successText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.successDark,
  },
  refreshButton: {
    marginRight: 10,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});