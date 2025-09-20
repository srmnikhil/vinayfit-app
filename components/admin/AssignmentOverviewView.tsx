import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Users, Dumbbell, Apple, TrendingUp, UserCheck, CircleAlert as AlertCircle, ChevronRight, Calendar, Star } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { router } from 'expo-router';

interface AssignmentStats {
  totalClients: number;
  fullyAssigned: number;
  trainerAssigned: number;
  nutritionistAssigned: number;
  unassigned: number;
  activeTrainers: number;
  activeNutritionists: number;
}

interface RecentAssignment {
  id: string;
  clientName: string;
  professionalName: string;
  type: 'trainer' | 'nutritionist';
  assignedDate: string;
  assignedBy: string;
}

const mockStats: AssignmentStats = {
  totalClients: 156,
  fullyAssigned: 89,
  trainerAssigned: 124,
  nutritionistAssigned: 98,
  unassigned: 32,
  activeTrainers: 12,
  activeNutritionists: 8,
};

const mockRecentAssignments: RecentAssignment[] = [
  {
    id: '1',
    clientName: 'Sarah Johnson',
    professionalName: 'Mike Chen',
    type: 'trainer',
    assignedDate: '2024-06-10',
    assignedBy: 'Admin User'
  },
  {
    id: '2',
    clientName: 'David Wilson',
    professionalName: 'Emma Davis',
    type: 'nutritionist',
    assignedDate: '2024-06-09',
    assignedBy: 'HR Manager'
  },
  {
    id: '3',
    clientName: 'Lisa Park',
    professionalName: 'Alex Rodriguez',
    type: 'trainer',
    assignedDate: '2024-06-08',
    assignedBy: 'Admin User'
  }
];

export default function AssignmentOverviewView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const assignmentRate = Math.round((mockStats.fullyAssigned / mockStats.totalClients) * 100);

  const handleNavigateToAssignments = () => {
    router.push('/admin/client-assignments');
  };

  const getAssignmentTypeIcon = (type: 'trainer' | 'nutritionist') => {
    return type === 'trainer' ? Dumbbell : Apple;
  };

  const getAssignmentTypeColor = (type: 'trainer' | 'nutritionist') => {
    return type === 'trainer' ? colors.primary : colors.success;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Assignment Overview</Text>
          <TouchableOpacity 
            style={styles.manageButton}
            onPress={handleNavigateToAssignments}
          >
            <Text style={styles.manageButtonText}>Manage Assignments</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Assignment Rate Card */}
        <View style={styles.rateCard}>
          <View style={styles.rateHeader}>
            <Text style={styles.rateTitle}>Assignment Rate</Text>
            <View style={[
              styles.rateIndicator,
              { backgroundColor: assignmentRate >= 80 ? colors.success : assignmentRate >= 60 ? colors.warning : colors.error }
            ]}>
              <Text style={styles.ratePercentage}>{assignmentRate}%</Text>
            </View>
          </View>
          <Text style={styles.rateDescription}>
            {mockStats.fullyAssigned} out of {mockStats.totalClients} clients have both trainer and nutritionist assigned
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Users size={20} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{mockStats.totalClients}</Text>
            <Text style={styles.statLabel}>Total Clients</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
              <UserCheck size={20} color={colors.success} />
            </View>
            <Text style={styles.statNumber}>{mockStats.fullyAssigned}</Text>
            <Text style={styles.statLabel}>Fully Assigned</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
              <AlertCircle size={20} color={colors.warning} />
            </View>
            <Text style={styles.statNumber}>{mockStats.unassigned}</Text>
            <Text style={styles.statLabel}>Unassigned</Text>
          </View>
        </View>

        {/* Assignment Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assignment Breakdown</Text>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownInfo}>
              <Dumbbell size={20} color={colors.primary} />
              <Text style={styles.breakdownLabel}>Trainer Assignments</Text>
            </View>
            <View style={styles.breakdownStats}>
              <Text style={styles.breakdownNumber}>{mockStats.trainerAssigned}</Text>
              <Text style={styles.breakdownPercentage}>
                {Math.round((mockStats.trainerAssigned / mockStats.totalClients) * 100)}%
              </Text>
            </View>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownInfo}>
              <Apple size={20} color={colors.success} />
              <Text style={styles.breakdownLabel}>Nutritionist Assignments</Text>
            </View>
            <View style={styles.breakdownStats}>
              <Text style={styles.breakdownNumber}>{mockStats.nutritionistAssigned}</Text>
              <Text style={styles.breakdownPercentage}>
                {Math.round((mockStats.nutritionistAssigned / mockStats.totalClients) * 100)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Professional Availability */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Professional Availability</Text>
          
          <View style={styles.availabilityGrid}>
            <View style={styles.availabilityCard}>
              <View style={styles.availabilityHeader}>
                <Dumbbell size={16} color={colors.primary} />
                <Text style={styles.availabilityTitle}>Trainers</Text>
              </View>
              <Text style={styles.availabilityNumber}>{mockStats.activeTrainers}</Text>
              <Text style={styles.availabilityLabel}>Active</Text>
            </View>
            
            <View style={styles.availabilityCard}>
              <View style={styles.availabilityHeader}>
                <Apple size={16} color={colors.success} />
                <Text style={styles.availabilityTitle}>Nutritionists</Text>
              </View>
              <Text style={styles.availabilityNumber}>{mockStats.activeNutritionists}</Text>
              <Text style={styles.availabilityLabel}>Active</Text>
            </View>
          </View>
        </View>

        {/* Recent Assignments */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Assignments</Text>
            <TouchableOpacity onPress={handleNavigateToAssignments}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {mockRecentAssignments.map((assignment) => {
            const IconComponent = getAssignmentTypeIcon(assignment.type);
            const iconColor = getAssignmentTypeColor(assignment.type);
            
            return (
              <View key={assignment.id} style={styles.assignmentItem}>
                <View style={[styles.assignmentIcon, { backgroundColor: `${iconColor}15` }]}>
                  <IconComponent size={16} color={iconColor} />
                </View>
                
                <View style={styles.assignmentInfo}>
                  <Text style={styles.assignmentText}>
                    <Text style={styles.assignmentClient}>{assignment.clientName}</Text>
                    {' assigned to '}
                    <Text style={styles.assignmentProfessional}>{assignment.professionalName}</Text>
                    {' as '}
                    <Text style={styles.assignmentType}>{assignment.type}</Text>
                  </Text>
                  <Text style={styles.assignmentMeta}>
                    {new Date(assignment.assignedDate).toLocaleDateString()} • by {assignment.assignedBy}
                  </Text>
                </View>
              </View>
            );
          })}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  manageButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
  rateCard: {
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
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rateTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  rateIndicator: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ratePercentage: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  rateDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
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
    shadowRadius: 4,
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
  viewAllText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  breakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  breakdownStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  breakdownPercentage: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  availabilityGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  availabilityCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  availabilityTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  availabilityNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 4,
  },
  availabilityLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  assignmentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  assignmentClient: {
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
  },
  assignmentProfessional: {
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
  },
  assignmentType: {
    fontFamily: 'Inter-SemiBold',
    color: colors.success,
  },
  assignmentMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});