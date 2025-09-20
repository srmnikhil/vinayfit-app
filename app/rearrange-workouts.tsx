import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Menu } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { WorkoutPlan, WorkoutTemplate, DayOfWeek } from '@/types/workout';
import { getClientPlans, savePlan } from '@/utils/storage';
import { getWeekDates } from '@/utils/workoutUtils';
import { getWorkoutTemplateById } from '@/lib/planDatabase';

interface WeeklyWorkout {
  date: string;
  dayName: string;
  dayNumber: number;
  dayShort: string;
  template: WorkoutTemplate | null;
  templateId: string | null;
}

export default function RearrangeWorkoutsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WeeklyWorkout[]>([]);
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [animatedValues] = useState(
    Array.from({ length: 7 }, () => new Animated.Value(1))
  );

  useEffect(() => {
    loadWeeklySchedule();
  }, []);

  const loadWeeklySchedule = async () => {
    try {
      const clientId = 'client-1'; // TODO: Get from user context
      const plans = await getClientPlans(clientId);
      
      // Find active plan for this week
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const activePlan = plans.find(plan => 
        plan.startDate <= todayString && plan.endDate >= todayString
      );

      if (activePlan) {
        setCurrentPlan(activePlan);
        
        // Generate this week's schedule
        const weekDates = getWeekDates(today);
        const weeklySchedule: WeeklyWorkout[] = [];
        
        const dayNames: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const shortDayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        
        for (let i = 0; i < 7; i++) {
          const dayName = dayNames[i];
          const date = weekDates[dayName];
          const dayNumber = new Date(date).getDate();
          const templateId = activePlan.schedule[dayName];
          
          let template = null;
          if (templateId) {
            template = await getWorkoutTemplateById(templateId);
          }
          
          weeklySchedule.push({
            date,
            dayName: shortDayNames[i],
            dayNumber,
            dayShort: dayName.substring(0, 3).toUpperCase(),
            template,
            templateId
          });
        }
        
        setWeeklyWorkouts(weeklySchedule);
      }
    } catch (error) {
      console.error('Error loading weekly schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const animateItem = (index: number, scale: number) => {
    Animated.spring(animatedValues[index], {
      toValue: scale,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };

  const handleWorkoutPress = (workout: WeeklyWorkout, index: number) => {
    if (selectedItem === null) {
      setSelectedItem(index);
      animateItem(index, 1.05);
    } else if (selectedItem === index) {
      setSelectedItem(null);
      animateItem(index, 1);
    } else {
      // Swap workouts
      const newWorkouts = [...weeklyWorkouts];
      const selectedWorkout = newWorkouts[selectedItem];
      const targetWorkout = newWorkouts[index];
      
      // Swap the template IDs and templates
      newWorkouts[selectedItem] = {
        ...selectedWorkout,
        template: targetWorkout.template,
        templateId: targetWorkout.templateId,
      };
      
      newWorkouts[index] = {
        ...targetWorkout,
        template: selectedWorkout.template,
        templateId: selectedWorkout.templateId,
      };
      
      setWeeklyWorkouts(newWorkouts);
      
      // Reset animations
      animateItem(selectedItem, 1);
      animateItem(index, 1);
      setSelectedItem(null);
    }
  };

  const handleSave = async () => {
    if (!currentPlan) return;

    try {
      const updatedSchedule: { [key: string]: string | null } = {};
      const dayNames: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      weeklyWorkouts.forEach((workout, index) => {
        const dayName = dayNames[index];
        updatedSchedule[dayName] = workout.templateId;
      });

      const updatedPlan: WorkoutPlan = {
        ...currentPlan,
        schedule: updatedSchedule,
        updatedAt: new Date().toISOString(),
      };

      await savePlan(updatedPlan);
      setCurrentPlan(updatedPlan);
      
      Alert.alert('Success', 'Schedule updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to save schedule changes');
    }
  };

  const renderWorkoutItem = (workout: WeeklyWorkout, index: number) => {
    const isSelected = selectedItem === index;
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.workoutItemContainer,
          {
            transform: [{ scale: animatedValues[index] }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.workoutItem,
            isSelected && styles.selectedWorkoutItem,
            !workout.template && styles.restDayItem
          ]}
          onPress={() => handleWorkoutPress(workout, index)}
          activeOpacity={0.8}
        >
          <View style={styles.workoutItemLeft}>
            <View style={styles.workoutDateContainer}>
              <Text style={styles.workoutDayShort}>{workout.dayName}</Text>
              <Text style={styles.workoutDayNumber}>{workout.dayNumber}</Text>
            </View>
            
            <View style={styles.workoutInfoContainer}>
              <Text style={styles.workoutName}>
                {workout.template?.name || 'Rest Day'}
              </Text>
              {workout.template && (
                <Text style={styles.workoutExercises}>
                  {workout.template.exercises.length} exercises
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.dragHandle}>
            <Menu size={20} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
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
        
        <Text style={styles.headerTitle}>Rearrange</Text>
        
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Tap on a workout to select it, then tap on another day to swap their positions.
          </Text>
        </View>

        {/* Workout List */}
        <View style={styles.workoutsList}>
          {weeklyWorkouts.map((workout, index) => renderWorkoutItem(workout, index))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  instructionsContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  workoutsList: {
    paddingHorizontal: 20,
  },
  workoutItemContainer: {
    marginBottom: 12,
  },
  workoutItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedWorkoutItem: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  restDayItem: {
    opacity: 0.6,
    backgroundColor: colors.surfaceSecondary,
  },
  workoutItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutDateContainer: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 50,
  },
  workoutDayShort: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutDayNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  workoutInfoContainer: {
    flex: 1,
  },
  workoutName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  workoutExercises: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  dragHandle: {
    padding: 8,
    marginLeft: 12,
  },
});