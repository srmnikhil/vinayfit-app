import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useGoal(goalId: string | undefined) {
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoal = async () => {
    if (!goalId) {
      setGoal(null);
      setLoading(false);
      setError('No goal ID provided');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();
      if (error) throw error;
      setGoal(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch goal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  return { goal, loading, error, refresh: fetchGoal };
}
