import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WorkoutSession {
  id: string;
  date: string;
  duration: number; // in minutes
  type: string;
  completed: boolean;
}

interface UserStatsContextType {
  streakDays: number;
  trainingMinutes: number;
  workoutSessions: WorkoutSession[];
  addWorkoutSession: (session: Omit<WorkoutSession, 'id'>) => Promise<void>;
  updateStreakDays: () => Promise<void>;
  getTotalTrainingMinutes: () => number;
  getWeeklyTrainingMinutes: () => number;
  getMonthlyTrainingMinutes: () => number;
  getCurrentStreak: () => number;
  getLongestStreak: () => number;
}

const UserStatsContext = createContext<UserStatsContextType | undefined>(undefined);

interface UserStatsProviderProps {
  children: ReactNode;
}

const STORAGE_KEYS = {
  WORKOUT_SESSIONS: '@workout_sessions',
  STREAK_DAYS: '@streak_days',
  LAST_WORKOUT_DATE: '@last_workout_date',
  LONGEST_STREAK: '@longest_streak',
};

export function UserStatsProvider({ children }: UserStatsProviderProps) {
  const [streakDays, setStreakDays] = useState<number>(0);
  const [trainingMinutes, setTrainingMinutes] = useState<number>(0);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);

  // Load data from storage on app start
  useEffect(() => {
    loadStoredData();
  }, []);

  // Update training minutes when sessions change
  useEffect(() => {
    const totalMinutes = getTotalTrainingMinutes();
    setTrainingMinutes(totalMinutes);
  }, [workoutSessions]);

  const loadStoredData = async () => {
    try {
      const [sessionsData, streakData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.STREAK_DAYS),
      ]);

      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        setWorkoutSessions(sessions);
      }

      if (streakData) {
        setStreakDays(parseInt(streakData, 10));
      }

      // Update streak on app load
      await updateStreakDays();
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  const addWorkoutSession = async (session: Omit<WorkoutSession, 'id'>) => {
    try {
      const newSession: WorkoutSession = {
        ...session,
        id: Date.now().toString(),
      };

      const updatedSessions = [...workoutSessions, newSession];
      setWorkoutSessions(updatedSessions);

      // Save to storage
      await AsyncStorage.setItem(
        STORAGE_KEYS.WORKOUT_SESSIONS,
        JSON.stringify(updatedSessions)
      );

      // Update streak if workout is completed
      if (session.completed) {
        await updateStreakDays();
      }
    } catch (error) {
      console.error('Error adding workout session:', error);
    }
  };

  const updateStreakDays = async () => {
    try {
      const currentStreak = getCurrentStreak();
      setStreakDays(currentStreak);

      // Save current streak
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK_DAYS, currentStreak.toString());

      // Update longest streak if current is higher
      const longestStreakData = await AsyncStorage.getItem(STORAGE_KEYS.LONGEST_STREAK);
      const longestStreak = longestStreakData ? parseInt(longestStreakData, 10) : 0;

      if (currentStreak > longestStreak) {
        await AsyncStorage.setItem(STORAGE_KEYS.LONGEST_STREAK, currentStreak.toString());
      }
    } catch (error) {
      console.error('Error updating streak days:', error);
    }
  };

  const getCurrentStreak = (): number => {
    if (workoutSessions.length === 0) return 0;

    // Sort sessions by date (most recent first)
    const completedSessions = workoutSessions
      .filter(session => session.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (completedSessions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's a workout today or yesterday (to account for current day)
    const mostRecentWorkout = new Date(completedSessions[0].date);
    mostRecentWorkout.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - mostRecentWorkout.getTime()) / (1000 * 60 * 60 * 24));

    // If last workout was more than 1 day ago, streak is broken
    if (daysDiff > 1) return 0;

    // Count consecutive days with workouts
    const workoutDates = new Set(
      completedSessions.map(session => {
        const date = new Date(session.date);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    let currentDate = new Date(mostRecentWorkout);
    while (workoutDates.has(currentDate.getTime())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  const getLongestStreak = (): number => {
    // This would be loaded from AsyncStorage in a real implementation
    return Math.max(streakDays, 7); // Mock data for demo
  };

  const getTotalTrainingMinutes = (): number => {
    return workoutSessions
      .filter(session => session.completed)
      .reduce((total, session) => total + session.duration, 0);
  };

  const getWeeklyTrainingMinutes = (): number => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return workoutSessions
      .filter(session => 
        session.completed && new Date(session.date) >= oneWeekAgo
      )
      .reduce((total, session) => total + session.duration, 0);
  };

  const getMonthlyTrainingMinutes = (): number => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return workoutSessions
      .filter(session => 
        session.completed && new Date(session.date) >= oneMonthAgo
      )
      .reduce((total, session) => total + session.duration, 0);
  };

  return (
    <UserStatsContext.Provider
      value={{
        streakDays,
        trainingMinutes,
        workoutSessions,
        addWorkoutSession,
        updateStreakDays,
        getTotalTrainingMinutes,
        getWeeklyTrainingMinutes,
        getMonthlyTrainingMinutes,
        getCurrentStreak,
        getLongestStreak,
      }}
    >
      {children}
    </UserStatsContext.Provider>
  );
}

export function useUserStats() {
  const context = useContext(UserStatsContext);
  if (context === undefined) {
    throw new Error('useUserStats must be used within a UserStatsProvider');
  }
  return context;
}