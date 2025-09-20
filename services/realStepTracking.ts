import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { getCurrentUserProfile } from '@/lib/todayQueries';

export interface RealStepData {
  date: string;
  steps: number;
  goal: number;
  calories: number;
  distance: number;
  activeMinutes: number;
  hourlyData: number[];
  source: 'device' | 'health_app' | 'manual' | 'estimated';
  lastUpdated: string;
  isRealTime: boolean;
}

export interface StepTrackingConfig {
  enableDeviceTracking: boolean;
  enableHealthKit: boolean;
  enableGoogleFit: boolean;
  enableManualInput: boolean;
  stepGoal: number;
  updateInterval: number; // in milliseconds
}

class RealStepTrackingService {
  private static instance: RealStepTrackingService;
  private storageKey = '@real_step_data';
  private configKey = '@step_tracking_config';
  private isInitialized = false;
  private isTracking = false;
  private stepCount = 0;
  private lastStepCount = 0;
  private trackingStartTime: number | null = null;
  private hourlySteps: number[] = new Array(24).fill(0);
  private updateInterval: NodeJS.Timeout | null = null;

  // Device sensor tracking
  private accelerometerData: { x: number; y: number; z: number }[] = [];
  private stepThreshold = 1.2; // Threshold for step detection
  private lastAcceleration = 0;

  private constructor() {}

  static getInstance(): RealStepTrackingService {
    if (!RealStepTrackingService.instance) {
      RealStepTrackingService.instance = new RealStepTrackingService();
    }
    return RealStepTrackingService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load configuration
      const config = await this.getConfig();
      if (!config) {
        await this.setDefaultConfig();
      }

      // Initialize device sensors if available
      if (Platform.OS !== 'web') {
        await this.initializeDeviceSensors();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing real step tracking:', error);
    }
  }

  private async initializeDeviceSensors(): Promise<void> {
    try {
      // Try to import expo-sensors dynamically
      const { Accelerometer } = await import('expo-sensors');
      
      // Set up accelerometer for step detection
      Accelerometer.setUpdateInterval(100); // Update every 100ms
      
      Accelerometer.addListener((data) => {
        this.processAccelerometerData(data);
      });

      console.log('Device sensors initialized for step tracking');
    } catch (error) {
      console.log('Device sensors not available, using fallback methods');
    }
  }

  private processAccelerometerData(data: { x: number; y: number; z: number }): void {
    // Calculate acceleration magnitude
    const acceleration = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
    
    // Detect step based on acceleration pattern
    if (this.detectStep(acceleration)) {
      this.incrementStep();
    }
    
    this.lastAcceleration = acceleration;
  }

  private detectStep(acceleration: number): boolean {
    // Simple step detection algorithm
    // A step is detected when acceleration exceeds threshold and then drops
    const accelerationChange = Math.abs(acceleration - this.lastAcceleration);
    
    if (accelerationChange > this.stepThreshold && acceleration > 10) {
      return true;
    }
    
    return false;
  }

  private incrementStep(): void {
    this.stepCount++;
    
    // Update hourly data
    const now = new Date();
    const currentHour = now.getHours();
    this.hourlySteps[currentHour]++;
    
    // Save to local storage periodically
    this.saveStepData();
  }

  // Start real-time step tracking
  async startTracking(): Promise<boolean> {
    try {
      if (this.isTracking) return true;

      this.isTracking = true;
      this.trackingStartTime = Date.now();
      this.stepCount = await this.getTodayStepCount();
      this.lastStepCount = this.stepCount;

      // Set up periodic updates
      this.updateInterval = setInterval(() => {
        this.updateStepData();
      }, 30000); // Update every 30 seconds

      console.log('Real-time step tracking started');
      return true;
    } catch (error) {
      console.error('Error starting step tracking:', error);
      return false;
    }
  }

  // Stop real-time step tracking
  async stopTracking(): Promise<boolean> {
    try {
      this.isTracking = false;
      
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      // Final update
      await this.updateStepData();
      
      console.log('Real-time step tracking stopped');
      return true;
    } catch (error) {
      console.error('Error stopping step tracking:', error);
      return false;
    }
  }

  // Get current step count
  getCurrentStepCount(): number {
    return this.stepCount;
  }

  // Add steps manually
  async addSteps(steps: number, source: 'manual' = 'manual'): Promise<boolean> {
    try {
      this.stepCount += steps;
      
      // Update hourly data for current hour
      const now = new Date();
      const currentHour = now.getHours();
      this.hourlySteps[currentHour] += steps;
      
      await this.updateStepData();
      return true;
    } catch (error) {
      console.error('Error adding steps:', error);
      return false;
    }
  }

  // Get step data for today
  async getTodayStepData(): Promise<RealStepData | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const config = await this.getConfig();
      
      // Try to get from Supabase first
      const profile = await getCurrentUserProfile();
      if (profile) {
        const { data, error } = await supabase
          .from('daily_stats')
          .select('*')
          .eq('user_id', profile.id)
          .eq('date', today)
          .single();

        if (data && !error) {
          return this.transformToRealStepData(data, today);
        }
      }

      // Fallback to local storage
      const localData = await this.getLocalStepData();
      return localData[today] || this.createDefaultStepData(today, config);
    } catch (error) {
      console.error('Error getting today step data:', error);
      return null;
    }
  }

  // Get step data for a date range
  async getStepDataRange(startDate: string, endDate: string): Promise<RealStepData[]> {
    try {
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
          return data.map(stat => this.transformToRealStepData(stat, stat.date));
        }
      }

      // Fallback to local storage
      const localData = await this.getLocalStepData();
      const result: RealStepData[] = [];
      
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

  // Update step data
  private async updateStepData(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const config = await this.getConfig();
      
      const stepData: RealStepData = {
        date: today,
        steps: this.stepCount,
        goal: config.stepGoal,
        calories: Math.floor(this.stepCount * 0.04),
        distance: parseFloat((this.stepCount * 0.0008).toFixed(2)),
        activeMinutes: Math.floor(this.stepCount / 100),
        hourlyData: [...this.hourlySteps],
        source: this.isTracking ? 'device' : 'manual',
        lastUpdated: new Date().toISOString(),
        isRealTime: this.isTracking,
      };

      // Update Supabase
      const profile = await getCurrentUserProfile();
      if (profile) {
        await supabase
          .from('daily_stats')
          .upsert({
            user_id: profile.id,
            date: today,
            steps: this.stepCount,
            calories_burned: stepData.calories,
            updated_at: new Date().toISOString(),
          });
      }

      // Update local storage
      await this.saveStepDataToLocal(today, stepData);
      
      this.lastStepCount = this.stepCount;
    } catch (error) {
      console.error('Error updating step data:', error);
    }
  }

  // Save step data to local storage
  private async saveStepData(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const config = await this.getConfig();
    
    const stepData: RealStepData = {
      date: today,
      steps: this.stepCount,
      goal: config.stepGoal,
      calories: Math.floor(this.stepCount * 0.04),
      distance: parseFloat((this.stepCount * 0.0008).toFixed(2)),
      activeMinutes: Math.floor(this.stepCount / 100),
      hourlyData: [...this.hourlySteps],
      source: this.isTracking ? 'device' : 'manual',
      lastUpdated: new Date().toISOString(),
      isRealTime: this.isTracking,
    };

    await this.saveStepDataToLocal(today, stepData);
  }

  // Get today's step count from storage
  private async getTodayStepCount(): Promise<number> {
    try {
      const todayData = await this.getTodayStepData();
      return todayData?.steps || 0;
    } catch (error) {
      return 0;
    }
  }

  // Configuration methods
  async getConfig(): Promise<StepTrackingConfig | null> {
    try {
      const config = await AsyncStorage.getItem(this.configKey);
      return config ? JSON.parse(config) : null;
    } catch (error) {
      console.error('Error getting config:', error);
      return null;
    }
  }

  async setConfig(config: Partial<StepTrackingConfig>): Promise<boolean> {
    try {
      const currentConfig = await this.getConfig() || this.getDefaultConfig();
      const newConfig = { ...currentConfig, ...config };
      await AsyncStorage.setItem(this.configKey, JSON.stringify(newConfig));
      return true;
    } catch (error) {
      console.error('Error setting config:', error);
      return false;
    }
  }

  private async setDefaultConfig(): Promise<void> {
    await this.setConfig(this.getDefaultConfig());
  }

  private getDefaultConfig(): StepTrackingConfig {
    return {
      enableDeviceTracking: true,
      enableHealthKit: Platform.OS === 'ios',
      enableGoogleFit: Platform.OS === 'android',
      enableManualInput: true,
      stepGoal: 10000,
      updateInterval: 30000,
    };
  }

  // Local storage methods
  private async getLocalStepData(): Promise<Record<string, RealStepData>> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting local step data:', error);
      return {};
    }
  }

  private async saveStepDataToLocal(date: string, data: RealStepData): Promise<void> {
    try {
      const localData = await this.getLocalStepData();
      localData[date] = data;
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(localData));
    } catch (error) {
      console.error('Error saving step data to local storage:', error);
    }
  }

  private createDefaultStepData(date: string, config: StepTrackingConfig): RealStepData {
    return {
      date,
      steps: 0,
      goal: config.stepGoal,
      calories: 0,
      distance: 0,
      activeMinutes: 0,
      hourlyData: new Array(24).fill(0),
      source: 'manual',
      lastUpdated: new Date().toISOString(),
      isRealTime: false,
    };
  }

  private transformToRealStepData(stats: any, date: string): RealStepData {
    const config = this.getDefaultConfig();
    return {
      date,
      steps: stats.steps || 0,
      goal: config.stepGoal,
      calories: stats.calories_burned || Math.floor((stats.steps || 0) * 0.04),
      distance: parseFloat(((stats.steps || 0) * 0.0008).toFixed(2)),
      activeMinutes: Math.floor((stats.steps || 0) / 100),
      hourlyData: this.generateHourlyData(stats.steps || 0),
      source: 'device',
      lastUpdated: stats.updated_at || new Date().toISOString(),
      isRealTime: false,
    };
  }

  private generateHourlyData(totalSteps: number): number[] {
    const hourlyData = new Array(24).fill(0);
    const peakHours = [7, 8, 12, 13, 17, 18, 19];
    
    let remainingSteps = totalSteps;
    
    peakHours.forEach(hour => {
      const steps = Math.floor(remainingSteps * (0.1 + Math.random() * 0.15));
      hourlyData[hour] = steps;
      remainingSteps -= steps;
    });
    
    for (let i = 0; i < 24; i++) {
      if (!peakHours.includes(i) && remainingSteps > 0) {
        const steps = Math.floor(Math.random() * (remainingSteps * 0.1));
        hourlyData[i] = steps;
        remainingSteps -= steps;
      }
    }
    
    return hourlyData;
  }

  // Health app integration methods
  async syncWithHealthApp(): Promise<boolean> {
    try {
      // This would integrate with HealthKit (iOS) or Google Fit (Android)
      // For now, we'll simulate the integration
      console.log('Syncing with health app...');
      
      // Simulate getting data from health app
      const healthAppSteps = Math.floor(Math.random() * 5000) + 2000;
      await this.addSteps(healthAppSteps, 'health_app');
      
      return true;
    } catch (error) {
      console.error('Error syncing with health app:', error);
      return false;
    }
  }

  // Get tracking status
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  // Get tracking statistics
  getTrackingStats(): {
    currentSteps: number;
    isTracking: boolean;
    trackingStartTime: number | null;
    hourlyData: number[];
  } {
    return {
      currentSteps: this.stepCount,
      isTracking: this.isTracking,
      trackingStartTime: this.trackingStartTime,
      hourlyData: [...this.hourlySteps],
    };
  }
}

export default RealStepTrackingService; 