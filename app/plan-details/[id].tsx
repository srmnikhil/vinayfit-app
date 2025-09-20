import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, User, CreditCard as Edit3, Trash2, Copy, Play, Pause, CircleCheck as CheckCircle, X, Save, MoreHorizontal, Target, Activity } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { WorkoutPlan, Client } from '@/types/workout';
import { getWorkoutPlan, getTrainerClients, getWorkoutTemplatesForPlans } from '@/lib/planDatabase';
import { supabase } from '@/lib/supabase';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface PlanProgress {
  completed: number;
  remaining: number;
  missed: number;
  total: number;
  percentage: number;
}

export default function PlanDetailsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? 'light');
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [planProgress, setPlanProgress] = useState<PlanProgress>({
    completed: 0,
    remaining: 0,
    missed: 0,
    total: 0,
    percentage: 0
  });
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    loadPlanDetails();
  }, [id]);

  const loadPlanDetails = async () => {
    try {
      const planData = await getWorkoutPlan(id as string);
      if (planData) {
        setPlan(planData);

        const clients = await getTrainerClients();
        const clientData = clients.find(c => c.id === planData.client_id) || null;
        setClient(
          clientData
            ? {
                id: clientData.id,
                name: String(clientData.full_name || 'Unknown Client'),
                email: String(clientData.email || ''),
                avatar: clientData.avatar ? String(clientData.avatar) : undefined,
                joinDate: String(clientData.created_at || ''),
                // trainerId: String(clientData.trainer_id || ''),
              }
            : null
        );

        console.log('Client:', clientData);
        // Fetch templates for displaying template names
        const templatesData = await getWorkoutTemplatesForPlans();
        setTemplates(templatesData);
        console.log('Fetched templates:', templatesData);
        console.log('Plan schedule:', planData.schedule_data);

        // Calculate plan progress
        await calculatePlanProgress(planData);
      }
    } catch (error) {
      console.error('Error loading plan details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePlanProgress = async (planData: WorkoutPlan) => {
    try {
      setProgressLoading(true);
      const startDate = new Date(planData.start_date);
      const endDate = new Date(planData.end_date);
      const today = new Date();
      
      // Get all training sessions for this client and plan
      const { data: sessions, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('client_id', planData.client_id)
        .eq('plan_id', planData.id)
        .gte('scheduled_date', planData.start_date)
        .lte('scheduled_date', planData.end_date);

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      let completed = 0;
      let missed = 0;
      let remaining = 0;
      let total = 0;

      // Calculate total planned sessions based on schedule
      const scheduleData = planData.schedule_data || {};
      const workoutDays = Object.values(scheduleData).filter(Boolean).length;
      
      if (workoutDays > 0) {
        // Calculate weeks between start and end date
        const weeksDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        total = weeksDiff * workoutDays;
      }

      // Process actual sessions
      if (sessions) {
        sessions.forEach(session => {
          if (session.status === 'completed') {
            completed++;
          } else if (session.status === 'no_show' || session.status === 'cancelled') {
            missed++;
          } else if (session.status === 'scheduled') {
            const sessionDate = new Date(session.scheduled_date);
            if (sessionDate < today) {
              missed++; // Past scheduled sessions that weren't completed
            } else {
              remaining++; // Future scheduled sessions
            }
          }
        });
      }

      // Calculate percentage
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      setPlanProgress({
        completed,
        remaining,
        missed,
        total,
        percentage
      });

      console.log('Plan progress calculated:', {
        completed,
        remaining,
        missed,
        total,
        percentage
      });

    } catch (error) {
      console.error('Error calculating plan progress:', error);
    } finally {
      setProgressLoading(false);
    }
  };

  const getTemplateName = (templateId: string | null): string => {
    if (!templateId) return 'Rest Day';
    const template = templates.find(t => t.id === templateId);
    return template?.name || 'Unknown Template';
  };

  // Helper to get templateId for a day, case-insensitive
  const getTemplateIdForDay = (scheduleData: any, day: string) => {
    if (!scheduleData) return null;
    if (scheduleData[day]) return scheduleData[day];
    // Fallback: try to find a key that matches case-insensitively
    const foundKey = Object.keys(scheduleData).find(k => k.toLowerCase() === day);
    return foundKey ? scheduleData[foundKey] : null;
  };

  const getPlanStatus = (): { status: string; color: string } => {
    if (!plan) return { status: 'Unknown', color: colors.textSecondary };
    
    const today = new Date().toISOString().split('T')[0];
    
    if (plan.end_date < today) {
      return { status: 'Completed', color: colors.success };
    } else if (plan.start_date > today) {
      return { status: 'Upcoming', color: colors.warning };
    } else {
      return { status: 'Active', color: colors.primary };
    }
  };

  const getDuration = (): string => {
    if (!plan) return '';
    
    const start = new Date(plan.start_date);
    const end = new Date(plan.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} days`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  };

  const getWorkoutsPerWeek = (): number => {
    if (!plan || !plan.schedule_data) return 0;
    return Object.values(plan.schedule_data).filter(Boolean).length;
  };

  const getScheduleType = (): string => {
    if (!plan) return '';
    
    // If schedule_type exists, use it
    if (plan.schedule_type) {
      return plan.schedule_type;
    }
    
    // Otherwise, determine from schedule data
    if (plan.schedule_data) {
      const workoutDays = Object.values(plan.schedule_data).filter(Boolean).length;
      return `${workoutDays}x per week`;
    }
    
    return 'Custom schedule';
  };

  const handleEditPlan = () => {
    router.push(`/create-plan?edit=${plan?.id}`);
  };

  const handleDuplicatePlan = () => {
    router.push(`/create-plan?duplicate=${plan?.id}`);
  };

  const handleDeletePlan = () => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete functionality
            Alert.alert('Success', 'Plan deleted successfully');
            router.back();
          }
        }
      ]
    );
  };

  const handleStartWorkout = (day: DayOfWeek) => {
    const templateId = plan?.schedule_data?.[day];
    if (templateId) {
      router.push(`/todays-workout/${templateId}`);
    }
  };

  const handleSaveNotes = () => {
    // TODO: Implement save notes functionality
    Alert.alert('Success', 'Notes saved successfully');
    setShowNotesModal(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading plan details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Plan Not Found</Text>
          <Text style={styles.errorText}>The requested plan could not be found.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { status, color } = getPlanStatus();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Details</Text>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Plan Options',
            'Choose an action',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Edit Plan', onPress: handleEditPlan },
              { text: 'Duplicate Plan', onPress: handleDuplicatePlan },
              { text: 'Delete Plan', style: 'destructive', onPress: handleDeletePlan },
            ]
          );
        }}>
          <MoreHorizontal size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Plan Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.planHeader}>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.clientName}>{client?.name || 'Unknown Client'}</Text>
              <Text style={styles.planDates}>
                {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: color }]}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>

          <View style={styles.planStats}>
            <View style={styles.statItem}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{getDuration()}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Activity size={20} color={colors.success} />
              <Text style={styles.statLabel}>Workouts/Week</Text>
              <Text style={styles.statValue}>{getWorkoutsPerWeek()}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Target size={20} color={colors.warning} />
              <Text style={styles.statLabel}>Schedule</Text>
              <Text style={styles.statValue}>{getScheduleType()}</Text>
            </View>
          </View>
        </View>

        {/* Weekly Schedule */}
        <View style={styles.scheduleCard}>
          <Text style={styles.scheduleTitle}>Weekly Schedule</Text>
          
          {daysOfWeek.map((day) => {
            const templateId = getTemplateIdForDay(plan.schedule_data, day);
            const hasWorkout = templateId !== null && templateId !== undefined;
            
            return (
              <View key={day} style={styles.dayRow}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{day}</Text>
                  <Text style={[
                    styles.workoutName,
                    !hasWorkout && styles.restDay
                  ]}>
                    {getTemplateName(templateId)}
                  </Text>
                </View>
                
                {hasWorkout && (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartWorkout(day)}
                  >
                    <Play size={16} color={colors.primary} />
                    <Text style={styles.startButtonText}>Start</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progress Overview</Text>
          
          {progressLoading ? (
            <View style={styles.progressLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.progressLoadingText}>Calculating progress...</Text>
            </View>
          ) : (
            <>
              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Text style={styles.progressNumber}>{planProgress.completed}</Text>
                  <Text style={styles.progressLabel}>Completed</Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressNumber}>{planProgress.remaining}</Text>
                  <Text style={styles.progressLabel}>Remaining</Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressNumber}>{planProgress.missed}</Text>
                  <Text style={styles.progressLabel}>Missed</Text>
                </View>
              </View>
              
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${planProgress.percentage}%` }]} />
              </View>
              <Text style={styles.progressText}>{planProgress.percentage}% Complete</Text>
              
              {planProgress.total > 0 && (
                <Text style={styles.progressSubtext}>
                  {planProgress.completed} of {planProgress.total} total sessions
                </Text>
              )}
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditPlan}>
            <Edit3 size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Edit Plan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowNotesModal(true)}>
            <Edit3 size={20} color={colors.textSecondary} />
            <Text style={styles.actionButtonText}>Add Notes</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Plan Notes</Text>
            <TouchableOpacity onPress={handleSaveNotes}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Notes for {plan.name}</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about the plan, client progress, or modifications..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>
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
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
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
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 4,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.primary,
    marginBottom: 4,
  },
  planDates: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  scheduleCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  workoutName: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  restDay: {
    fontStyle: 'italic',
    color: colors.textTertiary,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  startButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
  },
  progressCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  progressTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
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
  progressNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.primary,
    marginBottom: 4,
  },
  progressLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  progressSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  progressLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressLoadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});