import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCurrentUserProfile,
  getTodayStats,
  getTodayWorkoutSessions,
  getTrainerTodaySessions,
  getNutritionistTodayConsultations,
  getActiveGoals,
  getClientAssignments,
  getTrainerClients,
  getNutritionistClients,
  getSystemStats,
  Profile,
  DailyStats,
  WorkoutSession,
  TrainingSession,
  Consultation,
  Goal,
  ClientAssignment,
} from '@/lib/database';

export interface TodayData {
  profile: Profile | null;
  todayStats: DailyStats | null;
  workoutSessions: WorkoutSession[];
  trainingSessions: TrainingSession[];
  consultations: Consultation[];
  activeGoals: Goal[];
  clientAssignment: ClientAssignment | null;
  clients: Profile[];
  systemStats: any;
  loading: boolean;
  error: string | null;
}

export function useTodayData() {
  const { user } = useAuth();
  const [data, setData] = useState<TodayData>({
    profile: null,
    todayStats: null,
    workoutSessions: [],
    trainingSessions: [],
    consultations: [],
    activeGoals: [],
    clientAssignment: null,
    clients: [],
    systemStats: null,
    loading: true,
    error: null,
  });

  const loadTodayData = async () => {
    if (!user) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Get user profile first
      const profile = await getCurrentUserProfile();
      if (!profile) {
        setData(prev => ({ ...prev, loading: false, error: 'Profile not found' }));
        return;
      }

      // Load data based on user role
      const promises: Promise<any>[] = [
        getTodayStats(profile.id),
        getActiveGoals(profile.id),
      ];

      if (profile.role === 'client') {
        promises.push(
          getTodayWorkoutSessions(profile.id),
          getClientAssignments(profile.id)
        );
      } else if (profile.role === 'trainer') {
        promises.push(
          getTrainerTodaySessions(profile.id),
          getTrainerClients(profile.id)
        );
      } else if (profile.role === 'nutritionist') {
        promises.push(
          getNutritionistTodayConsultations(profile.id),
          getNutritionistClients(profile.id)
        );
      } else if (profile.role === 'admin' || profile.role === 'hr') {
        promises.push(getSystemStats());
      }

      const results = await Promise.all(promises);

      const newData: Partial<TodayData> = {
        profile,
        todayStats: results[0],
        activeGoals: results[1],
        loading: false,
      };

      if (profile.role === 'client') {
        newData.workoutSessions = results[2] || [];
        newData.clientAssignment = results[3];
      } else if (profile.role === 'trainer') {
        newData.trainingSessions = results[2] || [];
        newData.clients = results[3] || [];
      } else if (profile.role === 'nutritionist') {
        newData.consultations = results[2] || [];
        newData.clients = results[3] || [];
      } else if (profile.role === 'admin' || profile.role === 'hr') {
        newData.systemStats = results[2];
      }

      setData(prev => ({ ...prev, ...newData }));
    } catch (error) {
      console.error('Error loading today data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load data',
      }));
    }
  };

  useEffect(() => {
    loadTodayData();
  }, [user]);

  const refreshData = () => {
    loadTodayData();
  };

  return {
    ...data,
    refreshData,
  };
}