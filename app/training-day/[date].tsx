import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Clock, Dumbbell, Calendar, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { WorkoutTemplate, WorkoutSession } from '@/types/workout';
import { getSessions } from '@/utils/storage';
import { getWorkoutTemplateById } from '@/lib/planDatabase';
import StatusBadge from '@/components/StatusBadge';
import { getSessionStatusColor } from '@/utils/sessionUtils';

export default function TrainingDayScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { date, templateId } = useLocalSearchParams();

  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrainingDay();
  }, []);

  const loadTrainingDay = async () => {
    try {
      if (templateId) {
        const loadedTemplate = await getWorkoutTemplateById(templateId as string);
        setTemplate(loadedTemplate);

        // Check if there's already a session for this date
        const sessions = await getSessions();
        const existingSession = sessions.find(s => 
          s.templateId === templateId && s.date === date
        );
        setSession(existingSession || null);
      }
    } catch (error) {
      console.error('Error loading training day:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDayStatus = (): 'upcoming' | 'today' | 'completed' | 'missed' => {
    const today = new Date().toISOString().split('T')[0];
    const trainingDate = date as string;
    
    if (session?.completed) return 'completed';
    if (trainingDate === today) return 'today';
    if (trainingDate < today) return 'missed';
    return 'upcoming';
  };

  const handleStartWorkout = () => {
    if (template) {
      router.push(`/start-workout/${template.id}`);
    }
  };

  const handleViewSession = () => {
    if (session) {
      router.push(`/session-details/${session.id}`);
    }
  };

  const renderStatusBadge = () => {
    const status = getDayStatus();
    let statusValue = 'scheduled';
    let badgeIcon = Calendar;

    switch (status) {
      case 'completed':
        statusValue = 'completed';
        badgeIcon = CheckCircle;
        break;
      case 'today':
        statusValue = 'ongoing';
        badgeIcon = Calendar;
        break;
      case 'missed':
        statusValue = 'missed';
        badgeIcon = AlertCircle;
        break;
    }

    const IconComponent = badgeIcon;

    return (
      <View style={styles.statusBadgeContainer}>
        <IconComponent size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
        <StatusBadge status={statusValue} variant="compact" />
      </View>
    );
  };

  const renderActionButton = () => {
    const status = getDayStatus();
    
    if (status === 'completed') {
      return (
        <TouchableOpacity style={styles.viewSessionButton} onPress={handleViewSession}>
          <Text style={styles.viewSessionButtonText}>View Session Details</Text>
        </TouchableOpacity>
      );
    }
    
    if (status === 'today') {
      return (
        <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
          <Play size={20} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      );
    }
    
    if (status === 'missed') {
      return (
        <TouchableOpacity style={styles.makeupButton} onPress={handleStartWorkout}>
          <Text style={styles.makeupButtonText}>Make Up Workout</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.upcomingButton}>
        <Text style={styles.upcomingButtonText}>Scheduled for {formatDate(date as string)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading training day...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!template) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Training not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Training</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDate(date as string)}</Text>
          {renderStatusBadge()}
        </View>

        {/* Workout Card */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#BE185D', '#BE123C'] : ['#F093FB', '#F5576C']}
          style={styles.workoutCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.workoutContent}>
            <Text style={styles.workoutName}>{template.name}</Text>
            {template.description && (
              <Text style={styles.workoutDescription}>{template.description}</Text>
            )}
            
            <View style={styles.workoutMeta}>
              <View style={styles.metaItem}>
                <Dumbbell size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.metaText}>{template.exercises.length} exercises</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.metaText}>{template.duration} min</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Exercise List */}
        <View style={styles.exerciseSection}>
          <Text style={styles.exerciseTitle}>Exercises ({template.exercises.length})</Text>
          
          {template.exercises.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseNumber}>{index + 1}</Text>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
                  <Text style={styles.exerciseCategory}>{exercise.exercise.category}</Text>
                </View>
              </View>
              
              <View style={styles.setsInfo}>
                <Text style={styles.setsText}>
                  {exercise.sets.length} sets
                </Text>
                {exercise.sets.length > 0 && (
                  <Text style={styles.setsDetail}>
                    {exercise.sets[0].reps} reps × {exercise.sets[0].weight || 0} kg
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {renderActionButton()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
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
  headerBackButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  dateText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  workoutCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
  },
  workoutContent: {
    alignItems: 'flex-start',
  },
  workoutName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  workoutDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    lineHeight: 20,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  exerciseSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  exerciseTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.primary,
    width: 24,
    textAlign: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  exerciseCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  setsInfo: {
    alignItems: 'flex-end',
  },
  setsText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  setsDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  startButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  viewSessionButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  viewSessionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  makeupButton: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  makeupButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  upcomingButton: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  upcomingButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textSecondary,
  },
});