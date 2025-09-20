import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Users, Calendar, Apple, MessageSquare, ChevronRight, LogOut, ChefHat, Star, Award, FileText, BookOpen } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { useUserRole } from '../../contexts/UserContext';
import { router } from 'expo-router';

export default function ProfileNutritionistView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { userName, setUserRole } = useUserRole();

  const [userInitials] = useState('VD');
  const [activeClients] = useState(18);
  const [mealPlans] = useState(42);
  const [rating] = useState(4.9);

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
      id: 'meal-plans',
      title: 'Meal plans',
      icon: Apple,
      color: colors.success,
      onPress: () => {},
    },
    {
      id: 'recipes',
      title: 'Recipe library',
      icon: ChefHat,
      color: colors.warning,
      onPress: () => {},
    },
    {
      id: 'consultations',
      title: 'Consultations',
      icon: Calendar,
      color: colors.info,
      onPress: () => {},
    },
    {
      id: 'messages',
      title: 'Messages',
      icon: MessageSquare,
      color: colors.error,
      onPress: () => {},
    },
    {
      id: 'education',
      title: 'Education resources',
      icon: BookOpen,
      color: colors.textSecondary,
      onPress: () => {},
    },
    {
      id: 'certifications',
      title: 'Certifications',
      icon: Award,
      color: colors.primary,
      onPress: () => {},
    },
    {
      id: 'reports',
      title: 'Client reports',
      icon: FileText,
      color: colors.success,
      onPress: () => {},
    },
 
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        {/* <View style={styles.profileHeader}>
          <LinearGradient
            colors={colorScheme === 'dark' ? ['#0284C7', '#0891B2'] : ['#4FACFE', '#00F2FE']}
            style={styles.profileAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.profileInitials}>{userInitials}</Text>
          </LinearGradient>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Hi, {userName}!</Text>
            <Text style={styles.profileRole}>Certified Nutritionist</Text>
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
            <Text style={styles.statNumber}>{activeClients}</Text>
            <Text style={styles.statLabel}>Active Clients</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
              <Apple size={20} color={colors.success} />
            </View>
            <Text style={styles.statNumber}>{mealPlans}</Text>
            <Text style={styles.statLabel}>Meal Plans</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
              <ChefHat size={20} color={colors.warning} />
            </View>
            <Text style={styles.statNumber}>87%</Text>
            <Text style={styles.statLabel}>Compliance</Text>
          </View>
        </View>

        {/* Performance Overview */}
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>This Month</Text>
          
          <View style={styles.performanceCard}>
            <View style={styles.performanceGrid}>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceNumber}>24</Text>
                <Text style={styles.performanceLabel}>Consultations</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceNumber}>8</Text>
                <Text style={styles.performanceLabel}>New Plans</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceNumber}>$1,800</Text>
                <Text style={styles.performanceLabel}>Revenue</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceNumber}>95%</Text>
                <Text style={styles.performanceLabel}>Goal Achievement</Text>
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