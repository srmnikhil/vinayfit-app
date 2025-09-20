import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface FitnessGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  target_date: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  emoji: string;
  status: string;
  progress_percentage?: number;
  created_at: string;
  updated_at: string;
}

export function useGoals() {
  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setGoals(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return { goals, loading, error, refresh: fetchGoals };
}
