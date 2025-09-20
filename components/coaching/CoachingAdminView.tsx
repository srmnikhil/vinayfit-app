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
  Settings,
  UserPlus,
  Mail,
  Clock,
  ChartBar as BarChart3,
  Database,
  Search,
  Filter,
  UserCheck
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { router } from 'expo-router';

export default function CoachingAdminView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [selectedTab, setSelectedTab] = useState('overview');

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
      <View style={styles.header}>
        <Text style={styles.title}>Admin Management</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Search size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'users' && styles.activeTab]}
          onPress={() => setSelectedTab('users')}
        >
          <Text style={[styles.tabText, selectedTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'assignments' && styles.activeTab]}
          onPress={() => setSelectedTab('assignments')}
        >
          <Text style={[styles.tabText, selectedTab === 'assignments' && styles.activeTabText]}>
            Assignments
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' ? (
          <>
            {/* System Overview */}
            <LinearGradient
              colors={colorScheme === 'dark' ? ['#DC2626', '#F59E0B'] : ['#FA709A', '#FEE140']}
              style={styles.overviewCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.overviewContent}>
                <Text style={styles.overviewLabel}>SYSTEM STATUS</Text>
                <Text style={styles.overviewNumber}>98.5%</Text>
                <Text style={styles.overviewMessage}>All systems operational</Text>
              </View>
            </LinearGradient>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Users size={20} color={colors.primary} />
                </View>
                <Text style={styles.statNumber}>1,247</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
                  <TrendingUp size={20} color={colors.success} />
                </View>
                <Text style={styles.statNumber}>892</Text>
                <Text style={styles.statLabel}>Active Users</Text>
              </View>
            </View>

            {/* Management Actions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Management Actions</Text>
              
              <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToUserManagement}>
                  <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}15` }]}>
                    <Users size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.actionTitle}>User Management</Text>
                  <Text style={styles.actionDescription}>Manage user accounts and permissions</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToInvitations}>
                  <View style={[styles.actionIcon, { backgroundColor: `${colors.warning}15` }]}>
                    <UserPlus size={24} color={colors.warning} />
                  </View>
                  <Text style={styles.actionTitle}>Send Invitations</Text>
                  <Text style={styles.actionDescription}>Invite new users to the platform</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToAssignments}>
                  <View style={[styles.actionIcon, { backgroundColor: `${colors.info}15` }]}>
                    <UserCheck size={24} color={colors.info} />
                  </View>
                  <Text style={styles.actionTitle}>Client Assignments</Text>
                  <Text style={styles.actionDescription}>Assign trainers and nutritionists</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionCard}>
                  <View style={[styles.actionIcon, { backgroundColor: `${colors.success}15` }]}>
                    <BarChart3 size={24} color={colors.success} />
                  </View>
                  <Text style={styles.actionTitle}>Analytics</Text>
                  <Text style={styles.actionDescription}>View system analytics and reports</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionCard}>
                  <View style={[styles.actionIcon, { backgroundColor: `${colors.error}15` }]}>
                    <Settings size={24} color={colors.error} />
                  </View>
                  <Text style={styles.actionTitle}>System Settings</Text>
                  <Text style={styles.actionDescription}>Configure system preferences</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Activity</Text>
                <Shield size={24} color={colors.primary} />
              </View>
              
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <UserPlus size={16} color={colors.success} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText}>New user registered: Sarah Johnson</Text>
                  <Text style={styles.activityTime}>5 minutes ago</Text>
                </View>
              </View>
              
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Mail size={16} color={colors.warning} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText}>Invitation sent to mike@example.com</Text>
                  <Text style={styles.activityTime}>1 hour ago</Text>
                </View>
              </View>
              
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <UserCheck size={16} color={colors.info} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText}>Client assigned to trainer Mike Chen</Text>
                  <Text style={styles.activityTime}>2 hours ago</Text>
                </View>
              </View>
            </View>
          </>
        ) : selectedTab === 'users' ? (
          <>
            {/* User Management Quick Access */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>User Management</Text>
              
              <TouchableOpacity style={styles.quickActionButton} onPress={handleNavigateToUserManagement}>
                <Users size={20} color={colors.primary} />
                <Text style={styles.quickActionText}>Manage All Users</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickActionButton} onPress={handleNavigateToInvitations}>
                <Mail size={20} color={colors.warning} />
                <Text style={styles.quickActionText}>View Invitations</Text>
              </TouchableOpacity>
            </View>

            {/* User Stats */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>User Statistics</Text>
              
              <View style={styles.userStatsGrid}>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatNumber}>156</Text>
                  <Text style={styles.userStatLabel}>Clients</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatNumber}>24</Text>
                  <Text style={styles.userStatLabel}>Trainers</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatNumber}>8</Text>
                  <Text style={styles.userStatLabel}>Nutritionists</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatNumber}>12</Text>
                  <Text style={styles.userStatLabel}>HR Staff</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Assignment Management */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Assignment Management</Text>
              
              <TouchableOpacity style={styles.quickActionButton} onPress={handleNavigateToAssignments}>
                <UserCheck size={20} color={colors.primary} />
                <Text style={styles.quickActionText}>Manage Client Assignments</Text>
              </TouchableOpacity>
            </View>

            {/* Assignment Stats */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Assignment Statistics</Text>
              
              <View style={styles.userStatsGrid}>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatNumber}>89</Text>
                  <Text style={styles.userStatLabel}>Fully Assigned</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatNumber}>124</Text>
                  <Text style={styles.userStatLabel}>Have Trainer</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatNumber}>98</Text>
                  <Text style={styles.userStatLabel}>Have Nutritionist</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatNumber}>32</Text>
                  <Text style={styles.userStatLabel}>Unassigned</Text>
                </View>
              </View>
            </View>
          </>
        )}

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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
  },
  scrollView: {
    flex: 1,
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
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
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
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  activityTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  userStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  userStatItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 16,
  },
  userStatNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
  },
  userStatLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});