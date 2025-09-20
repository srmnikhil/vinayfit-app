import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Users, Calendar, TrendingUp, MessageSquare, ChevronRight, LogOut, Dumbbell, Star, Award, FileText } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { useUserRole } from '../../contexts/UserContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileTrainerView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? 'light');
  const styles = createStyles(colors);
  const { userName, setUserRole } = useUserRole();
  const { user } = useAuth();

  const [userInitials] = useState('VD');
  const [activeClients, setActiveClients] = useState<number | null>(null);
  const [totalSessions, setTotalSessions] = useState<number | null>(null);
  const [successRate, setSuccessRate] = useState<number | null>(null);
  const [rating] = useState(4.8);
  const [monthlySessions, setMonthlySessions] = useState<number | null>(null);
  const [monthlyNewClients, setMonthlyNewClients] = useState<number | null>(null);
  const [monthlyCompletedSessions, setMonthlyCompletedSessions] = useState<number | null>(null);
  const [monthlyAvgRating, setMonthlyAvgRating] = useState<number | null>(null);

  useEffect(() => {
    // Fetch trainer stats from Supabase
    const fetchTrainerStats = async () => {
      if (!user?.id) return;
      // Fetch active clients and today_sessions as before
      const { data: dashData, error: dashError } = await supabase
        .from('trainer_dashboard_stats')
        .select('active_clients, today_sessions')
        .eq('trainer_id', user.id)
        .single();
      if (!dashError && dashData) {
        setActiveClients(dashData.active_clients);
        setTotalSessions(dashData.today_sessions);
      }
      // Fetch all sessions for this trainer to calculate success rate
      const { data: sessions, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('status')
        .eq('trainer_id', user.id);
      if (!sessionsError && sessions) {
        const total = sessions.length;
        const completed = sessions.filter(s => s.status === 'completed').length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        setSuccessRate(rate);
      }
    };
    fetchTrainerStats();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchMonthlyStats = async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startISO = startOfMonth.toISOString();

      // Fetch sessions this month
      const { data: sessions, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('id, status, created_at, session_rating, client_id')
        .eq('trainer_id', user.id)
        .gte('created_at', startISO);

      console.log('Monthly sessions:', { sessions, sessionsError, userId: user.id, startISO });

      if (!sessionsError && sessions) {
        setMonthlySessions(sessions.length);
        setMonthlyCompletedSessions(sessions.filter(s => s.status === 'completed').length);

        // Unique new clients this month
        const uniqueClients = new Set(sessions.map(s => s.client_id));
        setMonthlyNewClients(uniqueClients.size);

        // Average rating for completed sessions
        const ratings = sessions.filter(s => s.session_rating != null).map(s => s.session_rating);
        const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;
        setMonthlyAvgRating(avgRating);
      }
    };

    fetchMonthlyStats();
  }, [user]);

  const handleLogout = () => {
    setUserRole(null);
    router.replace('/(auth)/login');
  };

  const menuItems = [
    {
      id: 'clients',
      title: 'My clients',
      icon: Users,
      color: colors.primary,
      onPress: () => {},
    },
    {
      id: 'programs',
      title: 'Training programs',
      icon: Dumbbell,
      color: colors.success,
      onPress: () => {},
    },
    {
      id: 'schedule',
      title: 'Schedule',
      icon: Calendar,
      color: colors.warning,
      onPress: () => {},
    },
    {
      id: 'messages',
      title: 'Messages',
      icon: MessageSquare,
      color: colors.info,
      onPress: () => {},
    },
    {
      id: 'certifications',
      title: 'Certifications',
      icon: Award,
      color: colors.error,
      onPress: () => {},
    },
    {
      id: 'reports',
      title: 'Client reports',
      icon: FileText,
      color: colors.textSecondary,
      onPress: () => {},
    },
    // {
    //   id: 'logout',
    //   title: 'Logout',
    //   icon: LogOut,
    //   color: colors.error,
    //   onPress: handleLogout,
    // },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View> */}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        {/* <View style={styles.profileHeader}>
          <LinearGradient
            colors={colorScheme === 'dark' ? ['#BE185D', '#BE123C'] : ['#F093FB', '#F5576C']}
            style={styles.profileAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.profileInitials}>{userInitials}</Text>
          </LinearGradient>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Hi, {userName}!</Text>
            <Text style={styles.profileRole}>Personal Trainer</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color={colors.warning} fill={colors.warning} />
              <Text style={styles.ratingText}>{rating} rating</Text>
            </View>
          </View>
        </View> */}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Users size={20} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{activeClients !== null ? activeClients : '--'}</Text>
            <Text style={styles.statLabel}>Active Clients</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
              <Calendar size={20} color={colors.success} />
            </View>
            <Text style={styles.statNumber}>{totalSessions !== null ? totalSessions : '--'}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
              <TrendingUp size={20} color={colors.warning} />
            </View>
            <Text style={styles.statNumber}>{successRate !== null ? `${successRate}%` : '--'}</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Performance Overview */}
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.performanceCard}>
            <View style={styles.performanceGrid}>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceNumber}>
                  {monthlySessions !== null ? monthlySessions : '--'}
                </Text>
                <Text style={styles.performanceLabel}>Sessions</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceNumber}>
                  {monthlyNewClients !== null ? monthlyNewClients : '--'}
                </Text>
                <Text style={styles.performanceLabel}>New Clients</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceNumber}>
                  {monthlyCompletedSessions !== null ? monthlyCompletedSessions : '--'}
                </Text>
                <Text style={styles.performanceLabel}>Completed Sessions</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceNumber}>
                  {monthlyAvgRating !== null ? monthlyAvgRating.toFixed(1) : '0'}
                </Text>
                <Text style={styles.performanceLabel}>Avg Rating</Text>
              </View>
            </View>
          </View>
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
  profileRole: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
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
    fontSize: 20,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  performanceSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  performanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  performanceItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  performanceNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
  },
  performanceLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
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