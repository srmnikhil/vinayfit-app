import { useState, useEffect, useCallback } from 'react';
import StepTrackingService, { 
  StepData, 
  WeekData, 
  MonthData, 
  StepGoal 
} from '@/services/stepTrackingService';

export interface UseStepTrackingReturn {
  // Data
  todayData: StepData | null;
  weeklyData: WeekData | null;
  monthlyData: MonthData | null;
  goals: StepGoal | null;
  
  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
  
  // Actions
  addSteps: (steps: number, source?: StepData['source']) => Promise<boolean>;
  updateStepData: (date: string, data: Partial<StepData>) => Promise<boolean>;
  setGoals: (goals: StepGoal) => Promise<boolean>;
  refreshData: () => Promise<void>;
  
  // Utilities
  getStepData: (date: string) => Promise<StepData | null>;
  getStepDataRange: (startDate: string, endDate: string) => Promise<StepData[]>;
  getWeeklyData: (weekStart: string) => Promise<WeekData | null>;
  getMonthlyData: (year: number, month: number) => Promise<MonthData | null>;
}

export function useStepTracking(): UseStepTrackingReturn {
  const [todayData, setTodayData] = useState<StepData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeekData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthData | null>(null);
  const [goals, setGoals] = useState<StepGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const service = StepTrackingService.getInstance();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      const [todayStepData, stepGoals] = await Promise.all([
        service.getStepData(today),
        service.getGoals(),
      ]);

      setTodayData(todayStepData);
      setGoals(stepGoals);

      // Load weekly and monthly data
      const weekStart = getWeekStart(today);
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      const [weekData, monthData] = await Promise.all([
        service.getWeeklyData(weekStart),
        service.getMonthlyData(currentYear, currentMonth),
      ]);

      setWeeklyData(weekData);
      setMonthlyData(monthData);
    } catch (error) {
      console.error('Error loading initial step data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, []);

  const addSteps = useCallback(async (steps: number, source: StepData['source'] = 'manual') => {
    try {
      setIsUpdating(true);
      const success = await service.addSteps(steps, source);
      
      if (success) {
        // Refresh today's data
        const today = new Date().toISOString().split('T')[0];
        const updatedTodayData = await service.getStepData(today);
        setTodayData(updatedTodayData);

        // Refresh weekly data if needed
        if (weeklyData) {
          const weekStart = getWeekStart(today);
          const updatedWeekData = await service.getWeeklyData(weekStart);
          setWeeklyData(updatedWeekData);
        }

        // Refresh monthly data if needed
        if (monthlyData) {
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth() + 1;
          const updatedMonthData = await service.getMonthlyData(currentYear, currentMonth);
          setMonthlyData(updatedMonthData);
        }
      }

      return success;
    } catch (error) {
      console.error('Error adding steps:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [weeklyData, monthlyData]);

  const updateStepData = useCallback(async (date: string, data: Partial<StepData>) => {
    try {
      setIsUpdating(true);
      const success = await service.updateStepData(date, data);
      
      if (success) {
        // Refresh relevant data
        const today = new Date().toISOString().split('T')[0];
        if (date === today) {
          const updatedTodayData = await service.getStepData(today);
          setTodayData(updatedTodayData);
        }

        // Refresh weekly data if the date is in current week
        if (weeklyData) {
          const weekStart = getWeekStart(today);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const weekEndStr = weekEnd.toISOString().split('T')[0];
          
          if (date >= weekStart && date <= weekEndStr) {
            const updatedWeekData = await service.getWeeklyData(weekStart);
            setWeeklyData(updatedWeekData);
          }
        }

        // Refresh monthly data if the date is in current month
        if (monthlyData) {
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth() + 1;
          const targetDate = new Date(date);
          const targetYear = targetDate.getFullYear();
          const targetMonth = targetDate.getMonth() + 1;
          
          if (targetYear === currentYear && targetMonth === currentMonth) {
            const updatedMonthData = await service.getMonthlyData(currentYear, currentMonth);
            setMonthlyData(updatedMonthData);
          }
        }
      }

      return success;
    } catch (error) {
      console.error('Error updating step data:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [weeklyData, monthlyData]);

  const updateGoals = useCallback(async (newGoals: StepGoal) => {
    try {
      setIsUpdating(true);
      const success = await service.setGoals(newGoals);
      
      if (success) {
        setGoals(newGoals);
        
        // Update today's data with new goal
        if (todayData) {
          setTodayData({
            ...todayData,
            goal: newGoals.daily,
          });
        }
      }

      return success;
    } catch (error) {
      console.error('Error setting goals:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [todayData]);

  const getStepData = useCallback(async (date: string): Promise<StepData | null> => {
    return await service.getStepData(date);
  }, []);

  const getStepDataRange = useCallback(async (startDate: string, endDate: string): Promise<StepData[]> => {
    return await service.getStepDataRange(startDate, endDate);
  }, []);

  const getWeeklyData = useCallback(async (weekStart: string): Promise<WeekData | null> => {
    return await service.getWeeklyData(weekStart);
  }, []);

  const getMonthlyData = useCallback(async (year: number, month: number): Promise<MonthData | null> => {
    return await service.getMonthlyData(year, month);
  }, []);

  return {
    // Data
    todayData,
    weeklyData,
    monthlyData,
    goals,
    
    // Loading states
    isLoading,
    isUpdating,
    
    // Actions
    addSteps,
    updateStepData,
    setGoals: updateGoals,
    refreshData,
    
    // Utilities
    getStepData,
    getStepDataRange,
    getWeeklyData,
    getMonthlyData,
  };
}

// Helper function to get the start of the week (Sunday)
function getWeekStart(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDay();
  const diff = date.getDate() - day;
  const weekStart = new Date(date.setDate(diff));
  return weekStart.toISOString().split('T')[0];
} 