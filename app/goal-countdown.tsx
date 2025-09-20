import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Target, Calendar, Clock, TrendingUp, Share2, CreditCard as Edit3, Trash2, CircleCheck as CheckCircle, Circle, Trophy, Flame, Zap, Bell, BellOff } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { cancelGoalNotifications, getAllScheduledNotifications } from '@/utils/notificationService';
import { Platform } from 'react-native';
import { useGoal } from '@/hooks/useGoal';
import { updateGoal } from '@/lib/todayQueries';

const { width } = Dimensions.get('window');

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface FitnessGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  emoji: string;
  reminders: {
    onFinish: boolean;
    oneDayBefore: boolean;
    oneWeekBefore: boolean;
  };
  pinToToday: boolean;
  shareWithCoach: boolean;
  createdAt: string;
  completed?: boolean;
}

// Sample goal data - replace with actual data from storage
const sampleGoal: FitnessGoal = {
  id: '1',
  title: 'Lose 10kg for Summer',
  description: 'Get ready for beach season by losing 10kg through consistent workouts and healthy eating.',
  category: 'weight',
  targetDate: '2025-08-15T00:00:00.000Z',
  targetValue: 70,
  currentValue: 75,
  unit: 'kg',
  emoji: '🏖️',
  reminders: {
    onFinish: true,
    oneDayBefore: true,
    oneWeekBefore: false,
  },
  pinToToday: true,
  shareWithCoach: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  completed: false,
};

export default function GoalCountdownScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { goalId } = useLocalSearchParams();
  const { goal, loading, error, refresh } = useGoal(goalId as string);

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [hasActiveNotifications, setHasActiveNotifications] = useState(false);

  useEffect(() => {
    if (!goal) return;
    const updateCountdown = () => {
      if (!goal) return;
      const now = new Date().getTime();
      const targetTime = new Date(goal.targetDate).getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds });
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [goal?.targetDate]);

  useEffect(() => {
    if (!goal) return;
    checkNotificationStatus();
  }, [goal?.id]);

  const checkNotificationStatus = async () => {
    if (!goal) return;
    if (Platform.OS === 'web') {
      setHasActiveNotifications(false);
      return;
    }

    try {
      const scheduledNotifications = await getAllScheduledNotifications();
      const goalNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.goalId === goal.id
      );
      setHasActiveNotifications(goalNotifications.length > 0);
    } catch (error) {
      console.error('Error checking notification status:', error);
      setHasActiveNotifications(false);
    }
  };

  const getProgressPercentage = () => {
    if (!goal || !goal.targetValue || !goal.currentValue) return 0;
    
    if (goal.category === 'weight') {
      // For weight loss, calculate how much has been lost
      const totalToLose = Math.abs(goal.targetValue - parseFloat(goal.createdAt.split('T')[0].split('-')[2])); // Simplified
      const currentLoss = Math.abs(goal.currentValue - goal.targetValue);
      return Math.min((currentLoss / totalToLose) * 100, 100);
    }
    
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  const getDaysUntilTarget = () => {
    if (!goal) return 0;
    const now = new Date();
    const target = new Date(goal.targetDate);
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleMarkComplete = () => {
    if (!goal) return;
    Alert.alert(
      'Mark as Complete',
      'Are you sure you want to mark this goal as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            await updateGoal(goal.id, { status: 'completed' });
            refresh();
            // Cancel notifications when goal is completed
            if (Platform.OS !== 'web') {
              try {
                await cancelGoalNotifications(goal.id);
                setHasActiveNotifications(false);
                console.log('Cancelled notifications for completed goal');
              } catch (error) {
                console.error('Error cancelling notifications:', error);
              }
            }
          }
        }
      ]
    );
  };

  const handleDeleteGoal = () => {
    if (!goal) return;
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Cancel notifications before deleting
            if (Platform.OS !== 'web') {
              try {
                await cancelGoalNotifications(goal.id);
                console.log('Cancelled notifications for deleted goal');
              } catch (error) {
                console.error('Error cancelling notifications:', error);
              }
            }
            
            // Delete from storage
            router.back();
          }
        }
      ]
    );
  };

  const handleToggleNotifications = async () => {
    if (!goal) return;
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Push notifications are not available on web platform.');
      return;
    }

    if (hasActiveNotifications) {
      Alert.alert(
        'Disable Notifications',
        'Are you sure you want to disable all notifications for this goal?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                await cancelGoalNotifications(goal.id);
                setHasActiveNotifications(false);
                Alert.alert('Success', 'Notifications have been disabled for this goal.');
              } catch (error) {
                console.error('Error cancelling notifications:', error);
                Alert.alert('Error', 'Failed to disable notifications.');
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Enable Notifications',
        'To enable notifications, please edit this goal and configure your reminder preferences.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit Goal', onPress: () => router.push('/set-fitness-goal') }
        ]
      );
    }
  };

  const handleShareGoal = () => {
    if (!goal) return;
    // Implement share functionality
    Alert.alert('Share Goal', 'Share functionality would be implemented here');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMotivationalMessage = () => {
    if (!goal) return '';
    const daysLeft = getDaysUntilTarget();
    const progress = getProgressPercentage();
    
    if (goal.completed) {
      return "🎉 Congratulations! You've achieved your goal!";
    }
    
    if (daysLeft <= 0) {
      return "⏰ Your target date has arrived! How did you do?";
    }
    
    if (progress >= 80) {
      return "🔥 You're so close! Keep pushing!";
    } else if (progress >= 50) {
      return "💪 Great progress! You're halfway there!";
    } else if (progress >= 25) {
      return "🚀 Good start! Keep up the momentum!";
    } else {
      return "🎯 Every journey begins with a single step!";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary, fontSize: 18 }}>Loading goal...</Text>
      </SafeAreaView>
    );
  }

  if (error || !goal) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.error, fontSize: 18 }}>Unable to load goal</Text>
        {error && <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{error}</Text>}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Goal Countdown</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleToggleNotifications}>
            {hasActiveNotifications ? (
              <Bell size={20} color={colors.primary} />
            ) : (
              <BellOff size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleShareGoal}>
            <Share2 size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/set-fitness-goal')}>
            <Edit3 size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Goal Header */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1E40AF', '#3730A3'] : ['#667EEA', '#764BA2']}
          style={styles.goalHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.goalHeaderContent}>
            <Text style={styles.goalEmoji}>{goal.emoji}</Text>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalDescription}>{goal.description}</Text>
            <Text style={styles.targetDate}>Target: {formatDate(goal.targetDate)}</Text>
            
            {/* Notification Status */}
            {Platform.OS !== 'web' && (
              <View style={styles.notificationStatus}>
                {hasActiveNotifications ? (
                  <View style={styles.notificationBadge}>
                    <Bell size={12} color={colors.success} />
                    <Text style={styles.notificationText}>Reminders Active</Text>
                  </View>
                ) : (
                  <View style={[styles.notificationBadge, styles.notificationBadgeInactive]}>
                    <BellOff size={12} color={colors.textSecondary} />
                    <Text style={[styles.notificationText, styles.notificationTextInactive]}>
                      No Reminders
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Countdown Timer */}
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownTitle}>Time Remaining</Text>
          
          {getDaysUntilTarget() > 0 ? (
            <View style={styles.countdownGrid}>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownNumber}>{timeRemaining.days}</Text>
                <Text style={styles.countdownLabel}>Days</Text>
              </View>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownNumber}>{timeRemaining.hours}</Text>
                <Text style={styles.countdownLabel}>Hours</Text>
              </View>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownNumber}>{timeRemaining.minutes}</Text>
                <Text style={styles.countdownLabel}>Minutes</Text>
              </View>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownNumber}>{timeRemaining.seconds}</Text>
                <Text style={styles.countdownLabel}>Seconds</Text>
              </View>
            </View>
          ) : (
            <View style={styles.timeUpContainer}>
              <Text style={styles.timeUpText}>⏰ Time's Up!</Text>
              <Text style={styles.timeUpSubtext}>Your target date has arrived</Text>
            </View>
          )}
        </View>

        {/* Progress Section */}
        {goal.targetValue && goal.currentValue && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>Progress Tracking</Text>
            
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatNumber}>{goal.currentValue}</Text>
                <Text style={styles.progressStatLabel}>Current</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatNumber}>{goal.targetValue}</Text>
                <Text style={styles.progressStatLabel}>Target</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatNumber}>
                  {Math.abs(goal.targetValue - goal.currentValue).toFixed(1)}
                </Text>
                <Text style={styles.progressStatLabel}>To Go</Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getProgressPercentage()}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressPercentage}>
                {getProgressPercentage().toFixed(0)}%
              </Text>
            </View>
          </View>
        )}

        {/* Motivational Message */}
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationMessage}>{getMotivationalMessage()}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Calendar size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{getDaysUntilTarget()}</Text>
            <Text style={styles.statLabel}>Days Left</Text>
          </View>
          
          <View style={styles.statCard}>
            <TrendingUp size={24} color={colors.success} />
            <Text style={styles.statNumber}>{getProgressPercentage().toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
          
          <View style={styles.statCard}>
            <Target size={24} color={colors.warning} />
            <Text style={styles.statNumber}>
              {Math.ceil((new Date(goal.targetDate).getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
            </Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!goal.completed && (
            <TouchableOpacity style={styles.completeButton} onPress={handleMarkComplete}>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Mark as Complete</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.updateButton} onPress={() => router.push('/update-progress')}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={styles.updateButtonText}>Update Progress</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteGoal}>
            <Trash2 size={20} color={colors.error} />
            <Text style={styles.deleteButtonText}>Delete Goal</Text>
          </TouchableOpacity>
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
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
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
  content: {
    flex: 1,
  },
  goalHeader: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
  },
  goalHeaderContent: {
    alignItems: 'center',
  },
  goalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  goalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  goalDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  targetDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  notificationStatus: {
    marginTop: 8,
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  notificationBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  notificationTextInactive: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  countdownContainer: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  countdownTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  countdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  countdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  countdownNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: colors.primary,
    marginBottom: 4,
  },
  countdownLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeUpContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  timeUpText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.error,
    marginBottom: 8,
  },
  timeUpSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressContainer: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressStat: {
    alignItems: 'center',
    flex: 1,
  },
  progressStatNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 4,
  },
  progressStatLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressPercentage: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: colors.success,
    minWidth: 40,
  },
  motivationContainer: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  motivationMessage: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
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
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  completeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  updateButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  deleteButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.error,
  },
});