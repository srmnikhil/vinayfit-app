import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Dumbbell,
  Clock,
  Flame,
  Trophy,
  Play,
  Calendar,
  TrendingUp,
  ChevronRight,
  Users,
  Target,
  Award,
  Activity,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTodayDataNew } from '../../hooks/useTodayDataNew';
import { getWorkoutTemplates, initializeDefaultTemplates } from '../../lib/workoutTemplates';
import { supabase } from '@/lib/supabase'; // Import supabase
import { getClientTrainingSessions } from '../../lib/trainingSessionQueries'; // Import getClientTrainingSessions
import { markPastSessionsAsMissed } from '../../lib/trainingSessionQueries';
import { TrainingSession } from '../../lib/database'; // Import TrainingSession type
import Loader from '../Loader';

const { width } = Dimensions.get('window');

interface WeeklyWorkout {
  dayName: string;
  dayNumber: number;
  template: { id: string; name: string } | null;
  completed: boolean;
  missed: boolean;
  sessionId?: string;
  scheduledTime?: string; // was string | undefined
  isTrainingSession?: boolean;
  workoutType?: 'training' | 'personal';
  status?: string; // add status for training sessions
}

export default function CoachingClientView() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { data, loading, error, refreshData } = useTodayDataNew();

  const [selectedTab, setSelectedTab] = useState('workouts');
  const [refreshing, setRefreshing] = useState(false);
  const [workoutTemplates, setWorkoutTemplates] = useState<any[]>([]);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WeeklyWorkout[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [missedSessions, setMissedSessions] = useState<any[]>([]);

  useEffect(() => {
    loadWorkoutTemplates();
  }, []);

  useEffect(() => {
    if (data?.profile?.id) {
      loadWeeklyWorkouts(data.profile.id);
      loadMissedSessions(data.profile.id);
    }
  }, [data?.profile?.id]);

  // Refresh weekly workouts every time the screen comes into focus (e.g., user navigates back after trainer edited plan)
  useFocusEffect(
    React.useCallback(() => {
      if (data?.profile?.id) {
        loadWeeklyWorkouts(data.profile.id);
      }
    }, [data?.profile?.id, workoutTemplates])
  );

  const loadWorkoutTemplates = async () => {
    try {
      const templates = await getWorkoutTemplates();
      setWorkoutTemplates(templates);
    } catch (error) {
      console.error('Error loading workout templates:', error);
    }
  };

  const loadWeeklyWorkouts = async (clientId: string) => {
    try {
      setLoadingWeekly(true);

      const today = new Date();
      const currentDay = today.getDay();
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);

      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        weekDates.push(date);
      }

      const startDate = weekDates[0] && typeof weekDates[0].toISOString === 'function' ? weekDates[0].toISOString().split('T')[0] : '';
      const endDate = weekDates[6] && typeof weekDates[6].toISOString === 'function' ? weekDates[6].toISOString().split('T')[0] : '';

      // Fetch active workout plans to show personal workout schedules only
      const { data: activePlans } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active');
      
      // Fetch training sessions for the week
      const trainingSessions = await getClientTrainingSessions(clientId, startDate, endDate);

      const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      const dayNamesLong = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      const weeklyData: WeeklyWorkout[] = weekDates.map((date, index) => {
        const dateString = date && typeof date.toISOString === 'function' ? date.toISOString().split('T')[0] : '';
        const dayNumber = date.getDate();
        const dayName = dayNamesLong[index];
        
        // Check for a training session on this day
        const sessionForDay = trainingSessions.find(s => s.scheduled_date === dateString);
        if (sessionForDay) {
          return {
            dayName: dayNames[index],
            dayNumber,
            template: sessionForDay.template
              ? { id: sessionForDay.template.id || '', name: sessionForDay.template.name }
              : { id: sessionForDay.template_id || '', name: 'Training Session' },
            completed: sessionForDay.status === 'completed',
            missed: sessionForDay.status === 'missed' || sessionForDay.status === 'no_show',
            sessionId: sessionForDay.id,
            scheduledTime: sessionForDay.scheduled_time === null ? undefined : sessionForDay.scheduled_time, // fix null
            isTrainingSession: true,
            workoutType: 'training',
            status: sessionForDay.status, // add status
          };
        }

        // Otherwise, check for a personal workout
        let template = null;
        let sessionId = undefined;
        let completed = false;
        let missed = false;
        let scheduledTime = undefined;
        let isTrainingSession = false;
        let workoutType: 'training' | 'personal' = 'personal';
        
        if (activePlans && activePlans.length > 0) {
          const activePlansOnDate = activePlans.filter(plan => {
            const planStartDate = new Date(plan.start_date);
            const planEndDate = new Date(plan.end_date);
            const currentDate = new Date(dateString);
            return currentDate >= planStartDate && currentDate <= planEndDate;
          });
          
          if (activePlansOnDate.length > 0) {
            const plan = activePlansOnDate[0];
            const templateId = plan.schedule_data?.[dayName] || plan.schedule_data?.[dayName.toLowerCase()];
            if (templateId && typeof templateId === 'string' && templateId.trim()) {
              const templateData = workoutTemplates.find(t => t.id === templateId);
              if (templateData) {
                template = { id: templateData.id, name: templateData.name };
              } else {
                template = { id: templateId, name: 'Personal Workout' };
              }
              sessionId = `plan-${templateId}-${dateString}`;
              isTrainingSession = false;
              workoutType = 'personal';
            }
          }
        }
        
        return {
          dayName: dayNames[index],
          dayNumber,
          template,
          completed,
          missed,
          sessionId,
          scheduledTime,
          isTrainingSession,
          workoutType,
        };
      });
      
      setWeeklyWorkouts(weeklyData);
    } catch (error) {
      console.error('❌ Error loading weekly workouts:', error);
    } finally {
      setLoadingWeekly(false);
    }
  };

  const loadMissedSessions = async (clientId: string) => {
    try {
      console.log('🔍 Loading missed sessions for client:', clientId);
      
      // First, mark any past scheduled sessions as missed
      await markPastSessionsAsMissed(clientId);
      
      // Get sessions from the last 30 days that are missed
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      
      const { data: sessions, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('client_id', clientId)
        .gte('scheduled_date', startDate)
        .in('status', ['no_show', 'cancelled'])
        .order('scheduled_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching missed sessions:', error);
        return;
      }

      console.log('📊 Found missed sessions:', sessions?.length || 0);
      console.log('📋 Missed sessions:', sessions?.map(s => ({
        id: s.id,
        date: s.scheduled_date,
        status: s.status,
        template_id: s.template_id
      })));

      setMissedSessions(sessions || []);
    } catch (error) {
      console.error('❌ Error in loadMissedSessions:', error);
    }
  };


  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await loadWorkoutTemplates();
    if (data?.profile?.id) {
      await loadWeeklyWorkouts(data.profile.id);
    }
    setRefreshing(false);
  };

  const handleTrainingCalendarPress = () => {
    router.push('/training-calendar');
  };
  // const handleDayPress = (workout: WeeklyWorkout) => {

  // router.push(`/workout-detail/${workout.sessionId}`);
  // }
  const handleDayPress = (workout: WeeklyWorkout) => {
    console.log('🔍 Pressed workout:', {
      dayName: workout.dayName,
      template: workout.template,
      sessionId: workout.sessionId,
      completed: workout.completed,
      workoutType: workout.workoutType,
      isTrainingSession: workout.isTrainingSession
    });
  
    if (!workout.template && !workout.sessionId) {
      console.log('❌ No workout scheduled for this day');
      return;
    }
  
0    // For personal workouts, we should navigate directly with the template ID
    // since the sessionId is synthetic and doesn't exist in the database
    if (workout.workoutType === 'personal' && workout.template && workout.template.id) {
      console.log('🎯 Personal workout - navigating with template ID:', workout.template.id);
      if (workout.completed) {
        // For completed personal workouts, try to find the actual session record
        // For now, just use template ID
        router.push(`/workout-detail/${workout.template.id}`);
      } else {
        // For incomplete personal workouts, start a new session with the template
        router.push(`/todays-workout/${workout.template.id}`);
      }
      return;
    }
    
    // If we have a session ID, always use that for navigation (for training sessions)
    if (workout.sessionId && workout.isTrainingSession) {
      console.log('🏃 Training session - navigating with session ID:', workout.sessionId);
      if (workout.completed) {
        router.push(`/workout-detail/${workout.sessionId}`);
      } else {
        // For incomplete sessions, go to today's workout with the session ID
        router.push(`/todays-workout/${workout.sessionId}`);
      }
    } 
    // Fallback: If we only have a template ID (no session ID)
    else if (workout.template && workout.template.id) {
      console.log('📋 Template fallback - navigating with template ID:', workout.template.id);
      if (workout.completed) {
        router.push(`/workout-detail/${workout.template.id}`);
      } else {
        router.push(`/todays-workout/${workout.template.id}`);
      }
    } else {
      console.log('❌ No valid ID found for navigation');
      Alert.alert('Info', 'No workout details available for this day.');
    }
  };


  const getWorkoutCount = () => {
    // Count only personal workouts (which is all we have now since we excluded training sessions)
    return weeklyWorkouts.filter(w => w.template !== null).length;
  };

  function getTrainingSessionColor(status: string, colors: any) {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'missed':
      case 'no_show':
        return colors.error;
      case 'confirmed':
        return colors.primary;
      case 'scheduled':
      default:
        return colors.info;
    }
  }

  function getTrainingSessionTimeColor(status: string, colors: any) {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'missed':
      case 'no_show':
        return colors.error;
      case 'confirmed':
        return colors.primary;
      case 'scheduled':
      default:
        return colors.info;
    }
  }

  const renderWeeklyCalendar = () => (
    <View style={styles.calendarSection}>
      <TouchableOpacity
        style={styles.calendarHeader}
        onPress={handleTrainingCalendarPress}
        activeOpacity={0.7}
      >
        <Text style={styles.calendarTitle}>Workout (this week)</Text>
        <ChevronRight size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {loadingWeekly ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workouts...</Text>
        </View>
      ) : (
        <>
          <View style={styles.weekContainer}>
            {(weeklyWorkouts || []).map((workout, index) => {
              const isTraining = workout.isTrainingSession;
              const status = workout.completed
                ? 'completed'
                : workout.missed
                ? 'missed'
                : workout.status || 'scheduled';
              return (
              <TouchableOpacity
                key={index}
style={[
                  styles.dayButton,
                  // For training sessions: green if completed, red if missed
                  isTraining && status === 'completed' && { backgroundColor: colors.success, borderColor: colors.success },
                  isTraining && (status === 'missed' || status === 'no_show') && { backgroundColor: colors.error, borderColor: colors.error },
                  // For personal workouts, keep original
                  !isTraining && workout.template && !workout.completed && !workout.missed && styles.activeDayButton,
                  !isTraining && workout.completed && styles.completedDayButton,
                  !isTraining && workout.missed && styles.missedDayButton,
                ]}
                  onPress={() => !isTraining && handleDayPress(workout)}
                  disabled={isTraining || (!workout.template && !workout.sessionId)}
                activeOpacity={0.7}
              >
                  <Text style={styles.dayName}>{workout.dayName}</Text>
                  <Text style={styles.dayNumber}>{workout.dayNumber.toString().padStart(2, '0')}</Text>
{isTraining && workout.scheduledTime && (
  <Text
    style={[
      styles.dayTime,
      { color: getTrainingSessionTimeColor(status, colors), marginTop: 4 }
    ]}
  >
    {workout.scheduledTime.slice(0, 5)}
  </Text>
)}
{/* For personal workouts only, show status label fill inside the day button (handled by button styles) + the label below */}
{!isTraining && (
  <Text style={{
    fontSize: 10,
    fontWeight: 'bold',
    color: status === 'completed' ? colors.success : (status === 'missed' || status === 'no_show') ? colors.error : colors.textTertiary,
    textTransform: 'uppercase',
    marginTop: 2,
  }}>
    {status === 'completed' ? 'COMPLETED' : (status === 'missed' || status === 'no_show') ? 'MISSED' : 'INCOMPLETE'}
  </Text>
)}
                  {/* Only show workout name for personal workouts */}
                  {!isTraining && workout.template && (
                    <Text style={styles.workoutName} numberOfLines={1}>
                    {workout.template.name.length > 8 ? workout.template.name.substring(0, 8) + '...' : workout.template.name}
                  </Text>
                )}
              </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.weekSummary}>
            You have {getWorkoutCount()} workouts this week!
          </Text>
        </>
      )}
    </View>
  );

  const renderTaskSection = () => (
      <View style={styles.calendarSection}>
      <TouchableOpacity
        style={styles.calendarHeader}
        onPress={handleTrainingCalendarPress}
        activeOpacity={0.7}
      >
      <Text style={styles.taskTitle}>Task (last 7 days)</Text>
        <ChevronRight size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {loadingWeekly ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workouts...</Text>
        </View>
      ) : (
        <>
          <View style={styles.weekContainer}>
            {(weeklyWorkouts || []).map((workout, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  // Show blue for active workouts that aren't completed or missed
                  workout.template && !workout.completed && !workout.missed && styles.activeDayButton,
                  // Show green for completed workouts
                  workout.completed && styles.completedDayButton,
                  // Show red only for explicitly missed workouts
                  workout.missed && styles.missedDayButton
                ]}
                onPress={() => handleDayPress(workout)}
                disabled={!workout.template && !workout.sessionId}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayName,
                  // White text for active workouts that aren't completed or missed
                  workout.template && !workout.completed && !workout.missed && styles.activeDayName,
                  // White text for completed workouts
                  workout.completed && styles.completedDayName,
                  // White text for missed workouts
                  workout.missed && styles.missedDayName
                ]}>
                  {workout.dayName}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  // White text for active workouts that aren't completed or missed
                  workout.template && !workout.completed && !workout.missed && styles.activeDayNumber,
                  // White text for completed workouts
                  workout.completed && styles.completedDayNumber,
                  // White text for missed workouts
                  workout.missed && styles.missedDayNumber
                ]}>
                  {workout.dayNumber.toString().padStart(2, '0')}
                </Text>
                {/* Show workout name for personal workouts */}
                {workout.template && (
                  <Text style={[
                    styles.workoutName,
                    // White text for active workouts that aren't completed or missed
                    workout.template && !workout.completed && !workout.missed && styles.activeWorkoutName,
                    // White text for completed workouts
                    workout.completed && styles.completedWorkoutName,
                    // White text for missed workouts
                    workout.missed && styles.missedWorkoutName
                  ]} numberOfLines={1}>
                    {workout.template.name.length > 8 ? workout.template.name.substring(0, 8) + '...' : workout.template.name}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.weekSummary}>
            You have {getWorkoutCount()} workouts this week!
          </Text>
        </>
      )}
    </View>
  );

  const renderMacrosSection = () => (
    <View style={styles.macrosSection}>
      <Text style={styles.macrosTitle}>Macros</Text>
      <View style={styles.macrosContent}>
        <View style={styles.macrosText}>
          <Text style={styles.macrosDescription}>
            Start by setting your daily goal
          </Text>
          <TouchableOpacity
            style={styles.macrosButton}
            onPress={() => router.push('/food-journal')}
          >
            <Text style={styles.macrosButtonText}>Set daily goal</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.macrosEmoji}>🥗🍎🥕</Text>
      </View>
    </View>
  );

  const renderResourcesSection = () => (
    <View style={styles.resourcesSection}>
      <Text style={styles.resourcesTitle}>Resources</Text>
      <View style={styles.resourcesGrid}>
        <TouchableOpacity style={styles.resourceCard}>
          <Text style={styles.resourceTitle}>Welcome Kit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resourceCard}>
          <Text style={styles.resourceTitle}>Nutrition Resources</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resourceCard}>
          <Text style={styles.resourceTitle}>Other Resources</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAchievementsTab = () => {
    const achievements = [
      { name: '7-Day Streak', icon: '🔥', completed: false, progress: 3 },
      { name: 'First Workout', icon: '💪', completed: true, progress: 1 },
      { name: '100 Workouts', icon: '🏆', completed: false, progress: 23 },
    ];

    return (
      <>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your Progress</Text>
            <Trophy size={24} color={colors.warning} />
          </View>

          <Text style={styles.achievementSummary}>
            You've unlocked 1 out of 3 achievements. Keep going!
          </Text>

          <View style={styles.achievementProgressBar}>
            <View style={[styles.achievementProgress, { width: '33.33%' }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Achievements</Text>

        {achievements.map((achievement, index) => (
          <View key={index} style={styles.achievementCard}>
            <View style={styles.achievementIcon}>
              <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
            </View>

            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>{achievement.name}</Text>
              <Text style={styles.achievementProgressText}>
                {achievement.completed
                  ? 'Completed!'
                  : `${achievement.progress}/${achievement.name === '7-Day Streak' ? 7 : achievement.name === '100 Workouts' ? 100 : 1}`
                }
              </Text>
            </View>

            {achievement.completed && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✓</Text>
              </View>
            )}
          </View>
        ))}
      </>
    );
  };

  const renderMissedSessions = () => {
    if (missedSessions.length === 0) {
      return null;
    }

    return (
      <View style={styles.missedSessionsSection}>
        <View style={styles.sectionHeader}>
          <AlertCircle size={20} color={colors.error} />
          <Text style={styles.sectionTitle}>Missed Sessions</Text>
        </View>
        
        {missedSessions.slice(0, 3).map((session, index) => {
          const sessionDate = new Date(session.scheduled_date);
          const daysAgo = Math.floor((new Date().getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <View key={session.id || index} style={styles.missedSessionItem}>
              <View style={styles.missedSessionInfo}>
                <Text style={styles.missedSessionDate}>
                  {sessionDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
                <Text style={styles.missedSessionTime}>
                  {session.scheduled_time ? session.scheduled_time.slice(0, 5) : 'No time set'}
                </Text>
                <Text style={styles.missedSessionStatus}>
                  {daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.rescheduleButton}
                onPress={() => {
                  // Navigate to reschedule or workout detail
                  if (session.template_id) {
                    router.push(`/workout-detail/${session.template_id}`);
                  } else {
                    router.push(`/workout-detail/${session.id}`);
                  }
                }}
              >
                <Text style={styles.rescheduleButtonText}>Reschedule</Text>
              </TouchableOpacity>
            </View>
          );
        })}
        
        {missedSessions.length > 3 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllButtonText}>
              View all {missedSessions.length} missed sessions
            </Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
     <Loader label='Loading your coaching sessions...' />
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load data</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Coaching</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'workouts' && styles.activeTab]}
            onPress={() => setSelectedTab('workouts')}
          >
            <Text style={[styles.tabText, selectedTab === 'workouts' && styles.activeTabText]}>
              Workouts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'achievements' && styles.activeTab]}
            onPress={() => setSelectedTab('achievements')}
          >
            <Text style={[styles.tabText, selectedTab === 'achievements' && styles.activeTabText]}>
              Achievements
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {selectedTab === 'workouts' ? (
          <>
            {renderWeeklyCalendar()}
            {renderTaskSection()}
            {renderMacrosSection()}
            {renderResourcesSection()}
            {data && 'clientAssignment' in data && data.clientAssignment && (
              <TouchableOpacity
               
                onPress={() => router.push('/team')}
              >

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Your Team</Text>
                  <Users size={24} color={colors.info} />
                </View>

                {data.clientAssignment.trainer && (
                  <View style={styles.teamMember}>
                    <Text style={styles.teamMemberRole}>Trainer</Text>
                    <Text style={styles.teamMemberName}>{data.clientAssignment.trainer.full_name}</Text>
                  </View>
                )}

                {data.clientAssignment.nutritionist && (
                  <View style={styles.teamMember}>
                    <Text style={styles.teamMemberRole}>Nutritionist</Text>
                    <Text style={styles.teamMemberName}>{data.clientAssignment.nutritionist.full_name}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            )}
            {renderMissedSessions()}
          </>
        ) : (
          renderAchievementsTab()
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
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
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
    marginBottom: 8,
    textAlign: 'center',
    color: colors.text,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: colors.textSecondary,
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 4,
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
  calendarSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  calendarTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayButton: {
    width: 40,
    height: 70,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeDayButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  completedDayButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  missedDayButton: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dayName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  activeDayName: {
    color: '#FFFFFF',
  },
  completedDayName: {
    color: '#FFFFFF',
  },
  missedDayName: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  activeDayNumber: {
    color: '#FFFFFF',
  },
  completedDayNumber: {
    color: '#FFFFFF',
  },
  missedDayNumber: {
    color: '#FFFFFF',
  },
  dayTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 8,
    color: colors.textTertiary,
  },
  activeDayTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  completedDayTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  missedDayTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  workoutName: {
    fontFamily: 'Inter-Medium',
    fontSize: 8,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  activeWorkoutName: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  completedWorkoutName: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  missedWorkoutName: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  weekSummary: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  taskSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  taskTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  taskMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  macrosSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  macrosTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  macrosContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macrosText: {
    flex: 1,
  },
  macrosDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  macrosButton: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  macrosButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  macrosEmoji: {
    fontSize: 32,
    marginLeft: 16,
  },
  resourcesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  resourcesTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resourceCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  resourceTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
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
  achievementSummary: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  achievementProgressBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  achievementProgress: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  achievementCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  achievementProgressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  completedBadge: {
    width: 24,
    height: 24,
    backgroundColor: colors.success,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  teamMember: {
    marginBottom: 12,
  },
  teamMemberRole: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  teamMemberName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  missedSessionsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: `${colors.error}05`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${colors.error}20`,
    shadowColor: colors.error,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  missedSessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.error}20`,
  },
  missedSessionInfo: {
    flex: 1,
  },
  missedSessionDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.error,
    marginBottom: 2,
  },
  missedSessionTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  missedSessionStatus: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  rescheduleButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  rescheduleButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  viewAllButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
    marginRight: 8,
  },
});
