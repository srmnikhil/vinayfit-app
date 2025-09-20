import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  Calendar, 
  TrendingUp,
  Clock,
  MessageSquare,
  Plus,
  Star,
  Activity
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';

export default function TodayTrainerView() {
  const colorScheme = useColorScheme() ?? 'light';
  
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [activeClients] = useState(24);
  const [todaysSessions] = useState(8);
  const [completedSessions] = useState(5);

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }).toUpperCase();
  };

  const upcomingSessions = [
    { id: 1, client: 'Sarah Johnson', time: '10:00 AM', type: 'Strength Training' },
    { id: 2, client: 'Mike Chen', time: '11:30 AM', type: 'HIIT Session' },
    { id: 3, client: 'Emma Wilson', time: '2:00 PM', type: 'Personal Training' },
  ];

  const recentActivity = [
    { id: 1, client: 'John Doe', action: 'Completed workout', time: '30 min ago' },
    { id: 2, client: 'Lisa Park', action: 'Sent message', time: '1 hour ago' },
    { id: 3, client: 'Alex Kim', action: 'Updated progress', time: '2 hours ago' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
          <Text style={styles.greetingText}>
            Good Morning, Trainer! 💪
          </Text>
        </View>

        {/* Today's Overview */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#BE185D', '#BE123C'] : ['#F093FB', '#F5576C']}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.overviewContent}>
            <Text style={styles.overviewLabel}>TODAY'S SESSIONS</Text>
            <Text style={styles.overviewNumber}>
              {completedSessions}/{todaysSessions}
            </Text>
            <Text style={styles.overviewMessage}>
              {todaysSessions - completedSessions} sessions remaining
            </Text>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Users size={24} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{activeClients}</Text>
            <Text style={styles.statLabel}>Active Clients</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
              <TrendingUp size={24} color={colors.success} />
            </View>
            <Text style={styles.statNumber}>92%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Upcoming Sessions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Upcoming Sessions</Text>
            <Calendar size={24} color={colors.primary} />
          </View>
          
          {upcomingSessions.map((session) => (
            <TouchableOpacity key={session.id} style={styles.sessionItem}>
              <View style={styles.sessionTime}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.sessionTimeText}>{session.time}</Text>
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionClient}>{session.client}</Text>
                <Text style={styles.sessionType}>{session.type}</Text>
              </View>
              <TouchableOpacity style={styles.sessionAction}>
                <MessageSquare size={20} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Sessions</Text>
          </TouchableOpacity>
        </View>

        {/* Client Activity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Client Activity</Text>
            <Activity size={24} color={colors.warning} />
          </View>
          
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Star size={16} color={colors.warning} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityClient}>{activity.client}</Text>
                <Text style={styles.activityAction}>{activity.action}</Text>
              </View>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Plus size={20} color={colors.primary} />
              <Text style={styles.actionText}>New Session</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Users size={20} color={colors.success} />
              <Text style={styles.actionText}>View Clients</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <MessageSquare size={20} color={colors.warning} />
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <TrendingUp size={20} color={colors.error} />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  dateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  greetingText: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
    marginTop: 4,
  },
  overviewCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
  },
  overviewContent: {
    alignItems: 'flex-start',
  },
  overviewLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  overviewNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overviewMessage: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  sessionTimeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionClient: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  sessionType: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sessionAction: {
    padding: 8,
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  activityIcon: {
    width: 32,
    height: 32,
    backgroundColor: `${colors.warning}15`,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityClient: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  activityAction: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
});