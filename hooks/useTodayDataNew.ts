import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getClientTodayData,
  getTrainerTodayData,
  getNutritionistTodayData,
  getAdminTodayData,
  TodayClientData,
  TodayTrainerData,
  TodayNutritionistData,
  TodayAdminData,
} from '@/lib/todayQueries';

type TodayData = TodayClientData | TodayTrainerData | TodayNutritionistData | TodayAdminData | null;

export function useTodayDataNew() {
  const { user } = useAuth();
  const [data, setData] = useState<TodayData>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodayData = async () => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user role from metadata
      const userRole = user.user_metadata?.role || 'client';
      let todayData: TodayData = null;

      switch (userRole) {
        case 'client':
        case 'lead': // Treat 'lead' as a client
          todayData = await getClientTodayData();
          break;
        case 'trainer':
          todayData = await getTrainerTodayData();
          break;
        case 'nutritionist':
          todayData = await getNutritionistTodayData();
          break;
        case 'admin':
        case 'hr':
          todayData = await getAdminTodayData();
          break;
        default:
          console.warn('Unknown user role:', userRole);
          break;
      }

      setData(todayData);
    } catch (err) {
      console.error('Error loading today data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayData();
  }, [user]);

  const refreshData = () => {
    loadTodayData();
  };

  return {
    data,
    loading,
    error,
    refreshData,
  };
}