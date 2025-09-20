import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Settings, 
  Calendar,
  Play,
  X,
  Clock,
  Dumbbell,
  RotateCcw
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { WorkoutTemplate, Exercise } from '@/types/workout';
import { getWorkoutTemplateById } from '@/lib/planDatabase';
import { supabase } from '@/lib/supabase';
import { formatDuration } from '@/utils/workoutUtils';
import { getValidImageUrl, getWorkoutImageByCategory, getExerciseImage } from '@/utils/imageUtils';

const { width, height } = Dimensions.get('window');

interface ExerciseWithDetails extends Exercise {
  sets: number;
  reps: string;
  image: string;
  equipment?: string;
}

export default function WorkoutDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme || 'light');
  const styles = createStyles(colors);
  const { workoutId } = useLocalSearchParams();

  const [workout, setWorkout] = useState<WorkoutTemplate | null>(null);
  const [exercises, setExercises] = useState<ExerciseWithDetails[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [workoutDate, setWorkoutDate] = useState<Date>(new Date());
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutDetails();
  }, []);

  const loadWorkoutDetails = async () => {
    try {
      console.log('workoutId:', workoutId);
      let workoutTemplate = await getWorkoutTemplateById(workoutId as string);
      
      if (!workoutTemplate) {
        // Fallback: maybe workoutId refers to a training session; fetch and construct minimal template
        const { data: session, error } = await supabase
          .from('training_sessions')
          .select('*, workout_templates(*)')
          .eq('id', workoutId as string)
          .maybeSingle();
        if (!error && session) {
          if (session.workout_templates) {
            workoutTemplate = session.workout_templates as WorkoutTemplate;
          } else {
            // construct simple template placeholder
            workoutTemplate = {
              id: session.id,
              name: session.session_type ?? 'Workout',
              description: session.notes ?? '',
              category: 'General',
              estimated_duration_minutes: session.duration ?? 0,
              exercises: [],
              created_by: '',
              is_public: false,
              created_at: session.created_at ?? '',
              updated_at: session.updated_at ?? ''
            } as WorkoutTemplate;
          }
        }
      }

      if (workoutTemplate) {
        setWorkout(workoutTemplate);
        
        // Set the workout date
        if (workoutTemplate.created_at) {
          setWorkoutDate(new Date(workoutTemplate.created_at));
        }
        
        // Transform exercises with additional details
        const exercisesWithDetails: ExerciseWithDetails[] = (workoutTemplate.exercises || []).map((templateExercise: any, index: number) => {
          // Handle sets_config properly
          let setsConfig = templateExercise.sets_config;
          if (setsConfig === null || setsConfig === undefined) {
            console.warn('sets_config is null/undefined, using default sets:', templateExercise.exercise?.name);
            setsConfig = [
              { reps: 10, weight: 0, rest_time: 60 },
              { reps: 10, weight: 0, rest_time: 60 },
              { reps: 10, weight: 0, rest_time: 60 }
            ];
          } else if (typeof setsConfig === 'string') {
            try {
              setsConfig = JSON.parse(setsConfig);
            } catch (e) {
              console.warn('Failed to parse sets_config as JSON:', setsConfig, e);
              setsConfig = [
                { reps: 10, weight: 0, rest_time: 60 },
                { reps: 10, weight: 0, rest_time: 60 },
                { reps: 10, weight: 0, rest_time: 60 }
              ];
            }
          }
          
          // Ensure setsConfig is an array
          if (!Array.isArray(setsConfig)) {
            console.warn('sets_config is not an array after parsing:', setsConfig);
            setsConfig = [
              { reps: 10, weight: 0, rest_time: 60 },
              { reps: 10, weight: 0, rest_time: 60 },
              { reps: 10, weight: 0, rest_time: 60 }
            ];
          }
          
          const sets = setsConfig.length;
          const reps = setsConfig.map((set: any) => set.reps || 10).filter(Boolean).join(', ') || '10';
          
          return {
            ...templateExercise.exercise,
            sets,
            reps,
            image: templateExercise.exercise.image_url || getExerciseImage(templateExercise.exercise.name, index),
            equipment: templateExercise.exercise.equipment || 'None',
          };
        });
        
        setExercises(exercisesWithDetails);
        
        // Extract unique equipment from exercises
        const uniqueEquipment = [...new Set(exercisesWithDetails.map(ex => ex.equipment).filter((eq): eq is string => Boolean(eq)))];
        setEquipment(uniqueEquipment.length > 0 ? uniqueEquipment : ['Barbell', 'Dumbbell', 'Bodyweight']);
      }
    } catch (error) {
      console.error('Error loading workout details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormattedDate = (): string => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const dayName = days[workoutDate.getDay()];
    const month = months[workoutDate.getMonth()];
    const date = workoutDate.getDate();
    
    return `${dayName}, ${month} ${date}`;
  };

  const handleStartWorkout = () => {
    if (workout) {
      router.push(`/start-workout/${workout.id}`);
    }
  };

  const handleReschedule = () => {
    setShowRescheduleModal(true);
  };

  const handleMoveToToday = () => {
    setShowRescheduleModal(false);
    Alert.alert('Success', 'Workout moved to today!');
  };

  const renderExerciseItem = (exercise: ExerciseWithDetails, index: number) => (
    <TouchableOpacity key={exercise.id} style={styles.exerciseItem}>
      <View style={styles.exerciseImageContainer}>
        <Image source={{ uri: getValidImageUrl(exercise.image, getExerciseImage(exercise.name, index)) }} style={styles.exerciseImage} />
        <View style={styles.exercisePlayButton}>
          <Play size={16} color="#FFFFFF" />
        </View>
      </View>
      
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseDetails}>
          {exercise.reps} reps • {exercise.equipment}
        </Text>
      </View>
      
      <View style={styles.exerciseSets}>
        <Text style={styles.exerciseSetCount}>x{exercise.sets}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEquipmentItem = (equipment: string, index: number) => (
    <View key={index} style={styles.equipmentItem}>
      <Text style={styles.equipmentIcon}>
        {equipment === 'Barbell' ? '🏋️' : equipment === 'Dumbbell' ? '🏋️‍♀️' : equipment === 'Bodyweight' ? '💪' : '🔗'}
      </Text>
      <Text style={styles.equipmentName}>{equipment}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Workout not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero Section with Background Image */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: getValidImageUrl(workout.thumbnail_url || workout.image_url, getWorkoutImageByCategory(workout.category)) }}
          style={styles.heroImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.heroOverlay}
        >
          <SafeAreaView style={styles.heroContent}>
            {/* Header */}
            <View style={styles.heroHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.heroBackButton}>
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.heroActionButton}>
                  <RotateCcw size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroActionButton}>
                  <Settings size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Workout Info */}
            <View style={styles.heroInfo}>
              <Text style={styles.heroDate}>{getFormattedDate()}</Text>
              <Text style={styles.heroTitle}>{workout.name}</Text>
              <TouchableOpacity style={styles.startWorkoutButton} onPress={handleStartWorkout}>
                <Text style={styles.startWorkoutText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Equipment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment</Text>
          <View style={styles.equipmentList}>
            {equipment.map(renderEquipmentItem)}
          </View>
        </View>

        {/* Warm Up Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PHYSIQUE Dynamic Warm Up</Text>
          <TouchableOpacity style={styles.warmUpItem}>
            <View style={styles.warmUpImageContainer}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                style={styles.warmUpImage}
              />
              <View style={styles.warmUpPlayButton}>
                <Play size={16} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.warmUpInfo}>
              <Text style={styles.warmUpName}>Dynamic Warm Up Routine</Text>
              <Text style={styles.warmUpDuration}>1 round</Text>
            </View>
            <Text style={styles.warmUpCount}>x1</Text>
          </TouchableOpacity>
        </View>

        {/* Strength Training Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strength Training</Text>
          {exercises.length > 0 ? (
            exercises.map(renderExerciseItem)
          ) : (
            <View style={styles.noExercisesContainer}>
              <Text style={styles.noExercisesText}>No exercises found in this workout</Text>
            </View>
          )}
        </View>

        {/* Cool Down Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stretching & Cool Down</Text>
          <TouchableOpacity style={styles.coolDownItem}>
            <View style={styles.coolDownImageContainer}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                style={styles.coolDownImage}
              />
              <View style={styles.coolDownPlayButton}>
                <Play size={16} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.coolDownInfo}>
              <Text style={styles.coolDownName}>Post-Workout Stretches</Text>
              <Text style={styles.coolDownDuration}>1 round</Text>
            </View>
            <Text style={styles.coolDownCount}>x1</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Calendar size={32} color={colors.primary} />
            </View>
            
            <Text style={styles.modalTitle}>Workout reschedule</Text>
            <Text style={styles.modalMessage}>
              This workout is scheduled for Monday, Jun 23. Do you want to move the workout to today?
            </Text>
            
            <TouchableOpacity style={styles.modalButton} onPress={handleMoveToToday}>
              <Text style={styles.modalButtonText}>Move to today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowRescheduleModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowRescheduleModal(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  errorText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  heroSection: {
    height: height * 0.5,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  heroBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 24,
    lineHeight: 38,
  },
  startWorkoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'flex-start',
  },
  startWorkoutText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  noExercisesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  noExercisesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  equipmentList: {
    flexDirection: 'row',
    gap: 16,
  },
  equipmentItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    minWidth: 80,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  equipmentIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  equipmentName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  warmUpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  warmUpImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  warmUpImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  warmUpPlayButton: {
    position: 'absolute',
    top: 22,
    left: 22,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warmUpInfo: {
    flex: 1,
  },
  warmUpName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  warmUpDuration: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  warmUpCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  exercisePlayButton: {
    position: 'absolute',
    top: 22,
    left: 22,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  exerciseSets: {
    alignItems: 'center',
  },
  exerciseSetCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  coolDownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  coolDownImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  coolDownImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  coolDownPlayButton: {
    position: 'absolute',
    top: 22,
    left: 22,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coolDownInfo: {
    flex: 1,
  },
  coolDownName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  coolDownDuration: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  coolDownCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modalButton: {
    backgroundColor: colors.textSecondary,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 16,
  },
  modalButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalCancelText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});