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
  Shield, 
  Users, 
  TrendingUp, 
  TriangleAlert as AlertTriangle, 
  Settings, 
  ChartBar as BarChart3, 
  Database, 
  Activity,
  Mail,
  UserPlus,
  Clock,
  UserCheck
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { router } from 'expo-router';

export default function TodayAdminView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [totalUsers] = useState(1247);
  const [activeUsers] = useState(892);
  const [systemHealth] = useState(98.5);
  const [pendingInvitations] = useState(8);
  const [trialUsers] = useState(23);
  const [fullyAssignedClients] = useState(89);

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }).toUpperCase();
  };

  const systemAlerts = [
    { id: 1, type: 'warning', message: 'Server load at 85%', time: '10 min ago' },
    { id: 2, type: 'info', message: 'Backup completed successfully', time: '1 hour ago' },
    { id: 3, type: 'error', message: 'Payment gateway timeout', time: '2 hours ago' },
  ];

  const recentActivity = [
    { id: 1, user: 'John Admin', action: 'Updated user permissions', time: '5 min ago' },
    { id: 2, user: 'Sarah Manager', action: 'Generated monthly report', time: '30 min ago' },
    { id: 3, user: 'Mike Support', action: 'Resolved support ticket', time: '1 hour ago' },
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return colors.error;
      case 'warning': return colors.warning;
      case 'info': return colors.info;
      default: return colors.textSecondary;
    }
  };

  const handleNavigateToUserManagement = () => {
    router.push('/admin/user-management');
  };

  const handleNavigateToInvitations = () => {
    router.push('/admin/invitations');
  };

  const handleNavigateToAssignments = () => {
    router.push('/admin/client-assignments');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
          <Text style={styles.greetingText}>
            Good Morning, Admin! 🛡️
          </Text>
        </View>

        {/* System Overview */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#DC2626', '#F59E0B'] : ['#FA709A', '#FEE140']}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.overviewContent}>
            <Text style={styles.overviewLabel}>SYSTEM HEALTH</Text>
            <Text style={styles.overviewNumber}>
              {systemHealth}%
            </Text>
            <Text style={styles.overviewMessage}>
              All systems operational
            </Text>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Users size={20} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{totalUsers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
              <Activity size={20} color={colors.success} />
            </View>
            <Text style={styles.statNumber}>{activeUsers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
        </View>

        {/* User Management Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCard} onPress={handleNavigateToInvitations}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
              <Mail size={20} color={colors.warning} />
            </View>
            <Text style={styles.statNumber}>{pendingInvitations}</Text>
            <Text style={styles.statLabel}>Pending Invites</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCard} onPress={handleNavigateToAssignments}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.info}15` }]}>
              <UserCheck size={20} color={colors.info} />
            </View>
            <Text style={styles.statNumber}>{fullyAssignedClients}</Text>
            <Text style={styles.statLabel}>Assigned Clients</Text>
          </TouchableOpacity>
        </View>

        {/* System Alerts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>System Alerts</Text>
            <AlertTriangle size={24} color={colors.warning} />
          </View>
          
          {systemAlerts.map((alert) => (
            <TouchableOpacity key={alert.id} style={styles.alertItem}>
              <View style={[styles.alertIndicator, { backgroundColor: getAlertColor(alert.type) }]} />
              <View style={styles.alertInfo}>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
              <TouchableOpacity style={styles.alertAction}>
                <Settings size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Admin Activity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Admin Activity</Text>
            <Shield size={24} color={colors.primary} />
          </View>
          
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Shield size={16} color={colors.primary} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityUser}>{activity.user}</Text>
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
            <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToUserManagement}>
              <Users size={20} color={colors.primary} />
              <Text style={styles.actionText}>User Management</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToInvitations}>
              <UserPlus size={20} color={colors.warning} />
              <Text style={styles.actionText}>Invitations</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToAssignments}>
              <UserCheck size={20} color={colors.info} />
              <Text style={styles.actionText}>Assignments</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <BarChart3 size={20} color={colors.success} />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Database size={20} color={colors.info} />
              <Text style={styles.actionText}>Database</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Settings size={20} color={colors.error} />
              <Text style={styles.actionText}>System Settings</Text>
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
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  alertIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertMessage: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  alertTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  alertAction: {
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
    backgroundColor: `${colors.primary}15`,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityUser: {
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
    minWidth: '30%',
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