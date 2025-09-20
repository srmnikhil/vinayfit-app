import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { getCurrentUserProfile } from '@/lib/todayQueries';

export interface StepData {
  date: string;
  steps: number;
  goal: number;
  calories: number;
  distance: number; // in km
  activeMinutes: number;
  hourlyData: number[]; // 24 hours
  source: 'manual' | 'device' | 'health_app' | 'estimated';
  lastUpdated: string;
}

export interface WeekData {
  weekStart: string;
  totalSteps: number;
  averageSteps: number;
  daysActive: number;
  totalCalories: number;
  totalDistance: number;
  dailyData: StepData[];
}

export interface MonthData {
  month: string;
  year: number;
  totalSteps: number;
  averageSteps: number;
  daysActive: number;
  totalCalories: number;
  totalDistance: number;
  weeklyData: WeekData[];
}

export interface StepGoal {
  daily: number;
  weekly: number;
  monthly: number;
  custom?: number;
}

class StepTrackingService {
  private static instance: StepTrackingService;
  private storageKey = '@step_tracking_data';
  private goalKey = '@step_goals';
  private isInitialized = false;

  private constructor() {}

  static getInstance(): StepTrackingService {
    if (!StepTrackingService.instance) {
      StepTrackingService.instance = new StepTrackingService();
    }
    return StepTrackingService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set default goals if not exists
      const existingGoals = await this.getGoals();
      if (!existingGoals) {
        await this.setGoals({
          daily: 10000,
          weekly: 70000,
          monthly: 300000,
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing step tracking service:', error);
    }
  }

  // Get step data for a specific date
  async getStepData(date: string): Promise<StepData | null> {
    try {
      await this.initialize();

      // First try to get from Supabase
      const profile = await getCurrentUserProfile();
      if (profile) {
        const { data, error } = await supabase
          .from('daily_stats')
          .select('*')
          .eq('user_id', profile.id)
          .eq('date', date)
          .single();

        if (data && !error) {
          return this.transformDailyStatsToStepData(data, date);
        }
      }

      // Fallback to local storage
      const localData = await this.getLocalStepData();
      return localData[date] || null;
    } catch (error) {
      console.error('Error getting step data:', error);
      return null;
    }
  }

  // Get step data for a date range
  async getStepDataRange(startDate: string, endDate: string): Promise<StepData[]> {
    try {
      await this.initialize();

      const profile = await getCurrentUserProfile();
      if (profile) {
        const { data, error } = await supabase
          .from('daily_stats')
          .select('*')
          .eq('user_id', profile.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });

        if (data && !error) {
          return data.map(stat => this.transformDailyStatsToStepData(stat, stat.date));
        }
      }

      // Fallback to local storage
      const localData = await this.getLocalStepData();
      const result: StepData[] = [];
      
      const currentDate = new Date(startDate);
      const end = new Date(endDate);
      
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (localData[dateStr]) {
          result.push(localData[dateStr]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    } catch (error) {
      console.error('Error getting step data range:', error);
      return [];
    }
  }

  // Update step data for a specific date
  async updateStepData(date: string, stepData: Partial<StepData>): Promise<boolean> {
    try {
      await this.initialize();

      const profile = await getCurrentUserProfile();
      if (profile) {
        // Update Supabase
        const { error } = await supabase
          .from('daily_stats')
          .upsert({
            user_id: profile.id,
            date: date,
            steps: stepData.steps || 0,
            calories_burned: stepData.calories || 0,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error updating step data in Supabase:', error);
        }
      }

      // Update local storage
      const localData = await this.getLocalStepData();
      const existingData = localData[date] || this.createDefaultStepData(date);
      
      localData[date] = {
        ...existingData,
        ...stepData,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(this.storageKey, JSON.stringify(localData));
      return true;
    } catch (error) {
      console.error('Error updating step data:', error);
      return false;
    }
  }

  // Add steps for today
  async addSteps(steps: number, source: StepData['source'] = 'manual'): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingData = await this.getStepData(today);
      
      const newSteps = (existingData?.steps || 0) + steps;
      const goals = await this.getGoals();
      
      const updatedData: Partial<StepData> = {
        steps: newSteps,
        goal: goals?.daily || 10000,
        calories: Math.floor(newSteps * 0.04),
        distance: parseFloat((newSteps * 0.0008).toFixed(2)),
        activeMinutes: Math.floor(newSteps / 100),
        source,
      };

      return await this.updateStepData(today, updatedData);
    } catch (error) {
      console.error('Error adding steps:', error);
      return false;
    }
  }

  // Set step goals
  async setGoals(goals: StepGoal): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.goalKey, JSON.stringify(goals));
      return true;
    } catch (error) {
      console.error('Error setting step goals:', error);
      return false;
    }
  }

  // Get step goals
  async getGoals(): Promise<StepGoal | null> {
    try {
      const goals = await AsyncStorage.getItem(this.goalKey);
      return goals ? JSON.parse(goals) : null;
    } catch (error) {
      console.error('Error getting step goals:', error);
      return null;
    }
  }

  // Get weekly data
  async getWeeklyData(weekStart: string): Promise<WeekData | null> {
    try {
      const endDate = new Date(weekStart);
      endDate.setDate(endDate.getDate() + 6);
      const endDateStr = endDate.toISOString().split('T')[0];

      const dailyData = await this.getStepDataRange(weekStart, endDateStr);
      if (dailyData.length === 0) return null;

      const totalSteps = dailyData.reduce((sum, day) => sum + day.steps, 0);
      const averageSteps = Math.floor(totalSteps / 7);
      const daysActive = dailyData.filter(day => day.steps > 1000).length;
      const totalCalories = dailyData.reduce((sum, day) => sum + day.calories, 0);
      const totalDistance = dailyData.reduce((sum, day) => sum + day.distance, 0);

      return {
        weekStart,
        totalSteps,
        averageSteps,
        daysActive,
        totalCalories,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        dailyData,
      };
    } catch (error) {
      console.error('Error getting weekly data:', error);
      return null;
    }
  }

  // Get monthly data
  async getMonthlyData(year: number, month: number): Promise<MonthData | null> {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const dailyData = await this.getStepDataRange(startDate, endDate);
      if (dailyData.length === 0) return null;

      const totalSteps = dailyData.reduce((sum, day) => sum + day.steps, 0);
      const averageSteps = Math.floor(totalSteps / dailyData.length);
      const daysActive = dailyData.filter(day => day.steps > 1000).length;
      const totalCalories = dailyData.reduce((sum, day) => sum + day.calories, 0);
      const totalDistance = dailyData.reduce((sum, day) => sum + day.distance, 0);

      // Group into weeks
      const weeklyData: WeekData[] = [];
      for (let i = 0; i < dailyData.length; i += 7) {
        const weekDays = dailyData.slice(i, i + 7);
        if (weekDays.length > 0) {
          const weekStart = weekDays[0].date;
          const weekTotalSteps = weekDays.reduce((sum, day) => sum + day.steps, 0);
          const weekAverageSteps = Math.floor(weekTotalSteps / weekDays.length);
          const weekDaysActive = weekDays.filter(day => day.steps > 1000).length;
          const weekTotalCalories = weekDays.reduce((sum, day) => sum + day.calories, 0);
          const weekTotalDistance = weekDays.reduce((sum, day) => sum + day.distance, 0);

          weeklyData.push({
            weekStart,
            totalSteps: weekTotalSteps,
            averageSteps: weekAverageSteps,
            daysActive: weekDaysActive,
            totalCalories: weekTotalCalories,
            totalDistance: parseFloat(weekTotalDistance.toFixed(2)),
            dailyData: weekDays,
          });
        }
      }

      return {
        month: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
        year,
        totalSteps,
        averageSteps,
        daysActive,
        totalCalories,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        weeklyData,
      };
    } catch (error) {
      console.error('Error getting monthly data:', error);
      return null;
    }
  }

  // Generate hourly data based on total steps
  generateHourlyData(totalSteps: number): number[] {
    const hourlyData = new Array(24).fill(0);
    const peakHours = [7, 8, 12, 13, 17, 18, 19]; // Morning, lunch, evening
    
    let remainingSteps = totalSteps;
    
    // Distribute steps with higher concentration during peak hours
    peakHours.forEach(hour => {
      const steps = Math.floor(remainingSteps * (0.1 + Math.random() * 0.15));
      hourlyData[hour] = steps;
      remainingSteps -= steps;
    });
    
    // Distribute remaining steps randomly
    for (let i = 0; i < 24; i++) {
      if (!peakHours.includes(i) && remainingSteps > 0) {
        const steps = Math.floor(Math.random() * (remainingSteps * 0.1));
        hourlyData[i] = steps;
        remainingSteps -= steps;
      }
    }
    
    return hourlyData;
  }

  // Get local step data from AsyncStorage
  private async getLocalStepData(): Promise<Record<string, StepData>> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting local step data:', error);
      return {};
    }
  }

  // Create default step data for a date
  private createDefaultStepData(date: string): StepData {
    const goals = this.getGoals();
    return {
      date,
      steps: 0,
      goal: goals?.daily || 10000,
      calories: 0,
      distance: 0,
      activeMinutes: 0,
      hourlyData: new Array(24).fill(0),
      source: 'manual',
      lastUpdated: new Date().toISOString(),
    };
  }

  // Transform daily stats from Supabase to StepData format
  private transformDailyStatsToStepData(stats: any, date: string): StepData {
    const goals = this.getGoals();
    return {
      date,
      steps: stats.steps || 0,
      goal: goals?.daily || 10000,
      calories: stats.calories_burned || Math.floor((stats.steps || 0) * 0.04),
      distance: parseFloat(((stats.steps || 0) * 0.0008).toFixed(2)),
      activeMinutes: Math.floor((stats.steps || 0) / 100),
      hourlyData: this.generateHourlyData(stats.steps || 0),
      source: 'device',
      lastUpdated: stats.updated_at || new Date().toISOString(),
    };
  }

  // Clear all step data (for testing/reset)
  async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.storageKey);
      await AsyncStorage.removeItem(this.goalKey);
      return true;
    } catch (error) {
      console.error('Error clearing step data:', error);
      return false;
    }
  }
}

export default StepTrackingService; 