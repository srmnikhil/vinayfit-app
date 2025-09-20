import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Users, Calendar, UserCheck, MessageSquare, ChevronRight, LogOut, FileText, Award, Briefcase, Clock, UserPlus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { useUserRole } from '../../contexts/UserContext';
import { router } from 'expo-router';

export default function ProfileHRView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { userName, setUserRole } = useUserRole();

  const [userInitials] = useState('VD');
  const [totalEmployees] = useState(156);
  const [todaysInterviews] = useState(4);
  const [pendingTasks] = useState(12);

  const handleLogout = () => {
    setUserRole(null);
    router.replace('/(auth)/login');
  };

  const menuItems = [
    {
      id: 'employees',
      title: 'Employee management',
      icon: Users,
      color: colors.primary,
      onPress: () => {},
    },
    {
      id: 'recruitment',
      title: 'Recruitment',
      icon: UserPlus,
      color: colors.success,
      onPress: () => {},
    },
    {
      id: 'interviews',
      title: 'Interview schedule',
      icon: Calendar,
      color: colors.warning,
      onPress: () => {},
    },
    {
      id: 'performance',
      title: 'Performance reviews',
      icon: Award,
      color: colors.info,
      onPress: () => {},
    },
    {
      id: 'payroll',
      title: 'Payroll & benefits',
      icon: Briefcase,
      color: colors.error,
      onPress: () => {},
    },
    {
      id: 'documents',
      title: 'HR documents',
      icon: FileText,
      color: colors.textSecondary,
      onPress: () => {},
    },
    {
      id: 'attendance',
      title: 'Attendance tracking',
      icon: Clock,
      color: colors.primary,
      onPress: () => {},
    },
    {
      id: 'messages',
      title: 'Messages',
      icon: MessageSquare,
      color: colors.success,
      onPress: () => {},
    },
   
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>HR Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color={colors.textSecondary} />
        </TouchableOpacity> 
      </View>
        */}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        {/* <View style={styles.profileHeader}>
          <LinearGradient
            colors={colorScheme === 'dark' ? ['#059669', '#EC4899'] : ['#A8EDEA', '#FED6E3']}
            style={styles.profileAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.profileInitials}>{userInitials}</Text>
          </LinearGradient>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Hi, {userName}!</Text>
            <Text style={styles.profileRole}>HR Manager</Text>
            <View style={styles.statusContainer}>
              <UserCheck size={16} color={colors.success} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
        </View> */}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Users size={20} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{totalEmployees}</Text>
            <Text style={styles.statLabel}>Total Employees</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
              <Calendar size={20} color={colors.warning} />
            </View>
            <Text style={styles.statNumber}>{todaysInterviews}</Text>
            <Text style={styles.statLabel}>Today's Interviews</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.error}15` }]}>
              <FileText size={20} color={colors.error} />
            </View>
            <Text style={styles.statNumber}>{pendingTasks}</Text>
            <Text style={styles.statLabel}>Pending Tasks</Text>
          </View>
        </View>

        {/* HR Overview */}
        <View style={styles.hrSection}>
          <Text style={styles.sectionTitle}>HR Overview</Text>
          
          <View style={styles.hrCard}>
            <View style={styles.hrGrid}>
              <View style={styles.hrItem}>
                <Text style={styles.hrNumber}>94%</Text>
                <Text style={styles.hrLabel}>Employee Satisfaction</Text>
              </View>
              <View style={styles.hrItem}>
                <Text style={styles.hrNumber}>8</Text>
                <Text style={styles.hrLabel}>Open Positions</Text>
              </View>
              <View style={styles.hrItem}>
                <Text style={styles.hrNumber}>15</Text>
                <Text style={styles.hrLabel}>New Hires (Month)</Text>
              </View>
              <View style={styles.hrItem}>
                <Text style={styles.hrNumber}>2.1%</Text>
                <Text style={styles.hrLabel}>Turnover Rate</Text>
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
  hrSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  hrCard: {
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
  hrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  hrItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  hrNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
  },
  hrLabel: {
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