import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Users, Shield, Database, ChevronRight, LogOut, UserPlus, Mail, ChartBar as BarChart3, Activity, Lock, Server } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { useUserRole } from '../../contexts/UserContext';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileAdminView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { userName, setUserRole } = useUserRole();
  const { signOut } = useAuth();

  const [userInitials] = useState('VD');
  const [totalUsers] = useState(1247);
  const [systemHealth] = useState(98.5);
  const [pendingInvites] = useState(8);

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
             signOut();
           }
         }
       ]
     );
   };

  const menuItems = [
    {
      id: 'user-management',
      title: 'User management',
      icon: Users,
      color: colors.primary,
      onPress: () => router.push('/admin/user-management'),
    },
    {
      id: 'invitations',
      title: 'Send invitations',
      icon: UserPlus,
      color: colors.success,
      onPress: () => router.push('/admin/invitations'),
    },
    {
      id: 'analytics',
      title: 'System analytics',
      icon: BarChart3,
      color: colors.warning,
      onPress: () => {},
    },
    {
      id: 'database',
      title: 'Database management',
      icon: Database,
      color: colors.info,
      onPress: () => {},
    },
    {
      id: 'security',
      title: 'Security settings',
      icon: Lock,
      color: colors.error,
      onPress: () => {},
    },
    {
      id: 'system',
      title: 'System configuration',
      icon: Server,
      color: colors.textSecondary,
      onPress: () => {},
    },
    {
      id: 'activity',
      title: 'Activity logs',
      icon: Activity,
      color: colors.primary,
      onPress: () => {},
    },
   
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={colorScheme === 'dark' ? ['#DC2626', '#F59E0B'] : ['#FA709A', '#FEE140']}
            style={styles.profileAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.profileInitials}>{userInitials}</Text>
          </LinearGradient>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Hi, {userName}!</Text>
            <Text style={styles.profileRole}>System Administrator</Text>
            <View style={styles.statusContainer}>
              <Shield size={16} color={colors.success} />
              <Text style={styles.statusText}>Full Access</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
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
            <Text style={styles.statNumber}>{systemHealth}%</Text>
            <Text style={styles.statLabel}>System Health</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
              <Mail size={20} color={colors.warning} />
            </View>
            <Text style={styles.statNumber}>{pendingInvites}</Text>
            <Text style={styles.statLabel}>Pending Invites</Text>
          </View>
        </View>

        {/* System Overview */}
        <View style={styles.systemSection}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          
          <View style={styles.systemCard}>
            <View style={styles.systemGrid}>
              <View style={styles.systemItem}>
                <Text style={styles.systemNumber}>892</Text>
                <Text style={styles.systemLabel}>Active Users</Text>
              </View>
              <View style={styles.systemItem}>
                <Text style={styles.systemNumber}>23</Text>
                <Text style={styles.systemLabel}>Trial Users</Text>
              </View>
              <View style={styles.systemItem}>
                <Text style={styles.systemNumber}>99.9%</Text>
                <Text style={styles.systemLabel}>Uptime</Text>
              </View>
              <View style={styles.systemItem}>
                <Text style={styles.systemNumber}>0</Text>
                <Text style={styles.systemLabel}>Critical Alerts</Text>
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.success,
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
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  systemSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  systemCard: {
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
  systemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  systemItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  systemNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
  },
  systemLabel: {
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
