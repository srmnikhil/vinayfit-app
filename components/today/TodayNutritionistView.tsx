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
  Apple, 
  Users, 
  Calendar, 
  TrendingUp,
  Clock,
  MessageSquare,
  Plus,
  ChefHat,
  FileText
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';

export default function TodayNutritionistView() {
 const colorScheme = useColorScheme() ?? 'light';
 
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [activeClients] = useState(18);
  const [todaysConsultations] = useState(6);
  const [completedConsultations] = useState(3);

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }).toUpperCase();
  };

  const upcomingConsultations = [
    { id: 1, client: 'Maria Garcia', time: '11:00 AM', type: 'Meal Plan Review' },
    { id: 2, client: 'David Lee', time: '1:30 PM', type: 'Initial Consultation' },
    { id: 3, client: 'Anna Smith', time: '3:00 PM', type: 'Progress Check' },
  ];

  const recentActivity = [
    { id: 1, client: 'Tom Wilson', action: 'Logged meal', time: '15 min ago' },
    { id: 2, client: 'Sarah Kim', action: 'Completed meal plan', time: '45 min ago' },
    { id: 3, client: 'Mike Johnson', action: 'Asked question', time: '1 hour ago' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
          <Text style={styles.greetingText}>
            Good Morning, Nutritionist! 🥗
          </Text>
        </View>

        {/* Today's Overview */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#0284C7', '#0891B2'] : ['#4FACFE', '#00F2FE']}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.overviewContent}>
            <Text style={styles.overviewLabel}>TODAY'S CONSULTATIONS</Text>
            <Text style={styles.overviewNumber}>
              {completedConsultations}/{todaysConsultations}
            </Text>
            <Text style={styles.overviewMessage}>
              {todaysConsultations - completedConsultations} consultations remaining
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
            <Text style={styles.statNumber}>87%</Text>
            <Text style={styles.statLabel}>Goal Achievement</Text>
          </View>
        </View>

        {/* Upcoming Consultations */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Upcoming Consultations</Text>
            <Calendar size={24} color={colors.primary} />
          </View>
          
          {upcomingConsultations.map((consultation) => (
            <TouchableOpacity key={consultation.id} style={styles.consultationItem}>
              <View style={styles.consultationTime}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.consultationTimeText}>{consultation.time}</Text>
              </View>
              <View style={styles.consultationInfo}>
                <Text style={styles.consultationClient}>{consultation.client}</Text>
                <Text style={styles.consultationType}>{consultation.type}</Text>
              </View>
              <TouchableOpacity style={styles.consultationAction}>
                <MessageSquare size={20} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Consultations</Text>
          </TouchableOpacity>
        </View>

        {/* Client Activity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Client Activity</Text>
            <Apple size={24} color={colors.warning} />
          </View>
          
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Apple size={16} color={colors.warning} />
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
              <Text style={styles.actionText}>New Meal Plan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <ChefHat size={20} color={colors.success} />
              <Text style={styles.actionText}>Recipe Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <FileText size={20} color={colors.warning} />
              <Text style={styles.actionText}>Client Reports</Text>
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
  consultationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  consultationTime: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  consultationTimeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  consultationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  consultationClient: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  consultationType: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  consultationAction: {
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