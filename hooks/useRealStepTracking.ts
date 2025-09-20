import { useState, useEffect, useCallback } from 'react';
import RealStepTrackingService, { 
  RealStepData, 
  StepTrackingConfig 
} from '@/services/realStepTracking';

export interface UseRealStepTrackingReturn {
  // Data
  todayData: RealStepData | null;
  currentStepCount: number;
  isTracking: boolean;
  trackingStats: {
    currentSteps: number;
    isTracking: boolean;
    trackingStartTime: number | null;
    hourlyData: number[];
  };
  
  // Configuration
  config: StepTrackingConfig | null;
  
  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
  
  // Actions
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<boolean>;
  addSteps: (steps: number, source?: 'manual') => Promise<boolean>;
  syncWithHealthApp: () => Promise<boolean>;
  setConfig: (config: Partial<StepTrackingConfig>) => Promise<boolean>;
  
  // Data methods
  getTodayStepData: () => Promise<RealStepData | null>;
  getStepDataRange: (startDate: string, endDate: string) => Promise<RealStepData[]>;
}

export function useRealStepTracking(): UseRealStepTrackingReturn {
  const [todayData, setTodayData] = useState<RealStepData | null>(null);
  const [currentStepCount, setCurrentStepCount] = useState<number>(0);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [config, setConfigState] = useState<StepTrackingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const service = RealStepTrackingService.getInstance();

  // Initialize the service and load initial data
  useEffect(() => {
    initializeService();
  }, []);

  // Set up real-time updates when tracking is active
  useEffect(() => {
    let updateInterval: number | null = null;

    if (isTracking) {
      updateInterval = setInterval(() => {
        updateCurrentStepCount();
        updateTodayData();
      }, 5000); // Update every 5 seconds when tracking
    }

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [isTracking]);

  const initializeService = async () => {
    try {
      setIsLoading(true);
      
      // Initialize the service
      await service.initialize();
      
      // Load configuration
      const serviceConfig = await service.getConfig();
      setConfigState(serviceConfig);
      
      // Load today's data
      const todayStepData = await service.getTodayStepData();
      setTodayData(todayStepData);
      
      // Get current step count
      const stepCount = service.getCurrentStepCount();
      setCurrentStepCount(stepCount);
      
      // Check if tracking is active
      const trackingActive = service.isTrackingActive();
      setIsTracking(trackingActive);
      
    } catch (error) {
      console.error('Error initializing real step tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentStepCount = () => {
    const stepCount = service.getCurrentStepCount();
    setCurrentStepCount(stepCount);
  };

  const updateTodayData = async () => {
    try {
      const todayStepData = await service.getTodayStepData();
      setTodayData(todayStepData);
    } catch (error) {
      console.error('Error updating today data:', error);
    }
  };

  const startTracking = useCallback(async (): Promise<boolean> => {
    try {
      setIsUpdating(true);
      const success = await service.startTracking();
      
      if (success) {
        setIsTracking(true);
        updateCurrentStepCount();
        await updateTodayData();
      }
      
      return success;
    } catch (error) {
      console.error('Error starting tracking:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const stopTracking = useCallback(async (): Promise<boolean> => {
    try {
      setIsUpdating(true);
      const success = await service.stopTracking();
      
      if (success) {
        setIsTracking(false);
        await updateTodayData();
      }
      
      return success;
    } catch (error) {
      console.error('Error stopping tracking:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const addSteps = useCallback(async (steps: number, source: 'manual' = 'manual'): Promise<boolean> => {
    try {
      setIsUpdating(true);
      const success = await service.addSteps(steps, source);
      
      if (success) {
        // Update current step count immediately
        const newStepCount = service.getCurrentStepCount();
        setCurrentStepCount(newStepCount);
        
        // Update today's data
        await updateTodayData();
      }
      
      return success;
    } catch (error) {
      console.error('Error adding steps:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const syncWithHealthApp = useCallback(async (): Promise<boolean> => {
    try {
      setIsUpdating(true);
      const success = await service.syncWithHealthApp();
      
      if (success) {
        updateCurrentStepCount();
        await updateTodayData();
      }
      
      return success;
    } catch (error) {
      console.error('Error syncing with health app:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const setConfig = useCallback(async (newConfig: Partial<StepTrackingConfig>): Promise<boolean> => {
    try {
      setIsUpdating(true);
      const success = await service.setConfig(newConfig);
      
      if (success) {
        const updatedConfig = await service.getConfig();
        setConfigState(updatedConfig);
        
        // Update today's data with new goal if it changed
        if (newConfig.stepGoal && todayData) {
          setTodayData({
            ...todayData,
            goal: newConfig.stepGoal,
          });
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error setting config:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [todayData]);

  const getTodayStepData = useCallback(async (): Promise<RealStepData | null> => {
    return await service.getTodayStepData();
  }, []);

  const getStepDataRange = useCallback(async (startDate: string, endDate: string): Promise<RealStepData[]> => {
    return await service.getStepDataRange(startDate, endDate);
  }, []);

  const trackingStats = service.getTrackingStats();

  return {
    // Data
    todayData,
    currentStepCount,
    isTracking,
    trackingStats,
    
    // Configuration
    config,
    
    // Loading states
    isLoading,
    isUpdating,
    
    // Actions
    startTracking,
    stopTracking,
    addSteps,
    syncWithHealthApp,
    setConfig,
    
    // Data methods
    getTodayStepData,
    getStepDataRange,
  };
} 