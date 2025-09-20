import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  Calendar, 
  TrendingUp,
  Clock,
  MessageSquare,
  Plus,
  UserCheck,
  FileText,
  Award,
  UserPlus
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { router } from 'expo-router';

export default function TodayHRView() {
  const colorScheme = useColorScheme() ?? 'light';
  
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [totalEmployees] = useState(156);
  const [todaysInterviews] = useState(4);
  const [completedInterviews] = useState(2);
  const [fullyAssignedClients] = useState(89);

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }).toUpperCase();
  };

  const upcomingInterviews = [
    { id: 1, candidate: 'Alex Johnson', time: '10:30 AM', position: 'Senior Trainer' },
    { id: 2, candidate: 'Maria Rodriguez', time: '2:00 PM', position: 'Nutritionist' },
  ];

  const recentActivity = [
    { id: 1, employee: 'Sarah Wilson', action: 'Submitted timesheet', time: '20 min ago' },
    { id: 2, employee: 'Mike Chen', action: 'Requested vacation', time: '1 hour ago' },
    { id: 3, employee: 'Emma Davis', action: 'Completed training', time: '2 hours ago' },
  ];

  const pendingTasks = [
    { id: 1, task: 'Review performance evaluations', count: 8 },
    { id: 2, task: 'Process new hire paperwork', count: 3 },
    { id: 3, task: 'Update employee handbook', count: 1 },
  ];

  const handleNavigateToAssignments = () => {
    router.push('/admin/client-assignments');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
          <Text style={styles.greetingText}>
            Good Morning, HR! 👥
          </Text>
        </View>

        {/* Today's Overview */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#059669', '#EC4899'] : ['#A8EDEA', '#FED6E3']}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.overviewContent}>
            <Text style={styles.overviewLabel}>TODAY'S INTERVIEWS</Text>
            <Text style={styles.overviewNumber}>
              {completedInterviews}/{todaysInterviews}
            </Text>
            <Text style={styles.overviewMessage}>
              {todaysInterviews - completedInterviews} interviews remaining
            </Text>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Users size={24} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{totalEmployees}</Text>
            <Text style={styles.statLabel}>Total Employees</Text>
          </View>
          
          <TouchableOpacity style={styles.statCard} onPress={handleNavigateToAssignments}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
              <UserCheck size={24} color={colors.success} />
            </View>
            <Text style={styles.statNumber}>{fullyAssignedClients}</Text>
            <Text style={styles.statLabel}>Client Assignments</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Interviews */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Upcoming Interviews</Text>
            <Calendar size={24} color={colors.primary} />
          </View>
          
          {upcomingInterviews.map((interview) => (
            <TouchableOpacity key={interview.id} style={styles.interviewItem}>
              <View style={styles.interviewTime}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.interviewTimeText}>{interview.time}</Text>
              </View>
              <View style={styles.interviewInfo}>
                <Text style={styles.interviewCandidate}>{interview.candidate}</Text>
                <Text style={styles.interviewPosition}>{interview.position}</Text>
              </View>
              <TouchableOpacity style={styles.interviewAction}>
                <MessageSquare size={20} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Interviews</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Tasks */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pending Tasks</Text>
            <FileText size={24} color={colors.warning} />
          </View>
          
          {pendingTasks.map((task) => (
            <TouchableOpacity key={task.id} style={styles.taskItem}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskName}>{task.task}</Text>
                <Text style={styles.taskCount}>{task.count} items</Text>
              </View>
              <View style={styles.taskBadge}>
                <Text style={styles.taskBadgeText}>{task.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Employee Activity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Employee Activity</Text>
            <UserCheck size={24} color={colors.info} />
          </View>
          
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <UserCheck size={16} color={colors.info} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityEmployee}>{activity.employee}</Text>
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
              <Text style={styles.actionText}>New Employee</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToAssignments}>
              <UserPlus size={20} color={colors.success} />
              <Text style={styles.actionText}>Assignments</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Award size={20} color={colors.warning} />
              <Text style={styles.actionText}>Performance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Calendar size={20} color={colors.error} />
              <Text style={styles.actionText}>Schedule</Text>
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
  interviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  interviewTime: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  interviewTimeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  interviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  interviewCandidate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  interviewPosition: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  interviewAction: {
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
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  taskCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  taskBadge: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  taskBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
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
    backgroundColor: `${colors.info}15`,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityEmployee: {
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