import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, ChevronRight, Target, TrendingUp } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getWorkoutPlans, WorkoutPlan } from '@/lib/planDatabase';

// Enhanced types for better date handling
interface PlanWithStatus extends WorkoutPlan {
  status: 'upcoming' | 'active' | 'completed';
  daysRemaining?: number;
  daysUntilStart?: number;
  daysSinceCompleted?: number;
  progressPercentage: number;
}

export default function MyPlansScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? 'light');
  const styles = createStyles(colors);
  const { user, loading: authLoading } = useAuth();

  const [plans, setPlans] = useState<PlanWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Explicit date handling utilities
  const normalizeDate = useCallback((dateString: string): Date => {
    const date = new Date(dateString);
    // Set to midnight to avoid timezone issues
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const getCurrentDate = useCallback((): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const calculateDaysDifference = useCallback((date1: Date, date2: Date): number => {
    const timeDifference = date2.getTime() - date1.getTime();
    return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  }, []);

  // Process plans with explicit date handling and status calculation
  const processPlansWithStatus = useCallback((rawPlans: WorkoutPlan[]): PlanWithStatus[] => {
    const currentDate = getCurrentDate();

    return rawPlans.map(plan => {
      const startDate = normalizeDate(plan.start_date);
      const endDate = normalizeDate(plan.end_date);
      
      let status: 'upcoming' | 'active' | 'completed';
      let daysRemaining: number | undefined;
      let daysUntilStart: number | undefined;
      let daysSinceCompleted: number | undefined;
      let progressPercentage = 0;

      // Explicit date comparison logic
      if (currentDate < startDate) {
        // Plan hasn't started yet
        status = 'upcoming';
        daysUntilStart = calculateDaysDifference(currentDate, startDate);
        progressPercentage = 0;
      } else if (currentDate >= startDate && currentDate <= endDate) {
        // Plan is currently active
        status = 'active';
        daysRemaining = calculateDaysDifference(currentDate, endDate);
        
        // Calculate progress based on days elapsed
        const totalDays = calculateDaysDifference(startDate, endDate) + 1;
        const daysElapsed = calculateDaysDifference(startDate, currentDate) + 1;
        progressPercentage = Math.min((daysElapsed / totalDays) * 100, 100);
      } else {
        // Plan has ended
        status = 'completed';
        daysSinceCompleted = calculateDaysDifference(endDate, currentDate);
        progressPercentage = 100;
      }

      return {
        ...plan,
        status,
        daysRemaining,
        daysUntilStart,
        daysSinceCompleted,
        progressPercentage,
      };
    });
  }, [normalizeDate, getCurrentDate, calculateDaysDifference]);

  // Sort plans by priority: active first, then upcoming, then completed
  const sortPlansByStatus = useCallback((plans: PlanWithStatus[]): PlanWithStatus[] => {
    const statusPriority = { active: 1, upcoming: 2, completed: 3 };
    
    return [...plans].sort((a, b) => {
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort within same status
      if (a.status === 'upcoming' && b.status === 'upcoming') {
        return (a.daysUntilStart || 0) - (b.daysUntilStart || 0);
      }
      if (a.status === 'active' && b.status === 'active') {
        return (a.daysRemaining || 0) - (b.daysRemaining || 0);
      }
      if (a.status === 'completed' && b.status === 'completed') {
        return (a.daysSinceCompleted || 0) - (b.daysSinceCompleted || 0);
      }
      
      return 0;
    });
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadPlans();
    } else if (!authLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, authLoading]);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedPlans = await getWorkoutPlans();
      const plansWithStatus = processPlansWithStatus(fetchedPlans);
      const sortedPlans = sortPlansByStatus(plansWithStatus);
      setPlans(sortedPlans);
    } catch (err: any) {
      console.error('Error loading workout plans:', err);
      setError('Failed to load workout plans.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [processPlansWithStatus, sortPlansByStatus]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlans();
  }, [loadPlans]);

  const handleViewPlan = useCallback((planId: string) => {
    router.push(`/plan-details/${planId}`);
  }, []);

  // Enhanced status color logic
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'active': return colors.success;
      case 'upcoming': return colors.primary;
      case 'completed': return colors.textTertiary;
      default: return colors.textTertiary;
    }
  }, [colors]);

  // Enhanced duration calculation with better formatting
  const getDuration = useCallback((startDate: string, endDate: string): string => {
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    const diffDays = calculateDaysDifference(start, end) + 1; // Include both start and end days
    
    if (diffDays === 1) {
      return '1 day';
    } else if (diffDays < 7) {
      return `${diffDays} days`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      if (remainingDays === 0) {
        return `${weeks} week${weeks > 1 ? 's' : ''}`;
      } else {
        return `${weeks}w ${remainingDays}d`;
      }
    } else {
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      if (remainingDays === 0) {
        return `${months} month${months > 1 ? 's' : ''}`;
      } else {
        return `${months}m ${remainingDays}d`;
      }
    }
  }, [normalizeDate, calculateDaysDifference]);

  // Format status text with explicit date information
  const formatStatusText = useCallback((plan: PlanWithStatus): string => {
    switch (plan.status) {
      case 'active':
        if (plan.daysRemaining === 0) {
          return 'Last day!';
        } else if (plan.daysRemaining === 1) {
          return '1 day remaining';
        } else {
          return `${plan.daysRemaining} days remaining`;
        }
      case 'upcoming':
        if (plan.daysUntilStart === 0) {
          return 'Starts today!';
        } else if (plan.daysUntilStart === 1) {
          return 'Starts tomorrow';
        } else {
          return `Starts in ${plan.daysUntilStart} days`;
        }
      case 'completed':
        if (plan.daysSinceCompleted === 0) {
          return 'Completed today!';
        } else if (plan.daysSinceCompleted === 1) {
          return 'Completed yesterday';
        } else {
          return `Completed ${plan.daysSinceCompleted} days ago`;
        }
      default:
        return '';
    }
  }, []);

  // Get summary statistics
  const getStatsSummary = useCallback(() => {
    const active = plans.filter(p => p.status === 'active').length;
    const upcoming = plans.filter(p => p.status === 'upcoming').length;
    const completed = plans.filter(p => p.status === 'completed').length;
    return { active, upcoming, completed };
  }, [plans]);

  if (loading || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your workout plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error loading plans</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPlans}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const stats = getStatsSummary();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>My Workout Plans</Text>
        <View style={{ width: 24 }} />
      </View>

      {plans.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>
            {stats.active} active • {stats.upcoming} upcoming • {stats.completed} completed
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No workout plans found</Text>
            <Text style={styles.emptyText}>
              It looks like you don't have any assigned workout plans yet.
            </Text>
          </View>
        ) : (
          plans.map((plan) => {
            const statusColor = getStatusColor(plan.status);
            const duration = getDuration(plan.start_date, plan.end_date);
            const statusText = formatStatusText(plan);
            
            return (
              <TouchableOpacity
                key={plan.id}
                style={styles.planCard}
                onPress={() => handleViewPlan(plan.id)}
                activeOpacity={0.7}
              >
                <View style={styles.planContent}>
                  <View style={styles.planHeader}>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planDates}>
                        {normalizeDate(plan.start_date).toLocaleDateString()} - {normalizeDate(plan.end_date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.planMeta}>
                    <View style={styles.metaItem}>
                      <Calendar size={14} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{duration}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={styles.metaText}>
                        {plan.schedule_type} schedule
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar for active plans */}
                  {plan.status === 'active' && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${plan.progressPercentage}%`,
                              backgroundColor: statusColor
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(plan.progressPercentage)}% complete
                      </Text>
                    </View>
                  )}

                  {/* Status information */}
                  <View style={styles.statusContainer}>
                    <View style={styles.statusInfo}>
                      <Target size={14} color={statusColor} />
                      <Text style={[styles.statusInfoText, { color: statusColor }]}>
                        {statusText}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <ChevronRight size={20} color={colors.textTertiary} style={styles.chevron} />
              </TouchableOpacity>
            );
          })
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planContent: {
    flex: 1,
    marginRight: 12,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planInfo: {
    flex: 1,
    marginRight: 12,
  },
  planName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  planDates: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  planMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusInfoText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  chevron: {
    marginLeft: 8,
  },
});