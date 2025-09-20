import { supabase } from './supabase';

export async function addMetricEntryToSupabase({
  user_id,
  metric_type,
  value,
  unit,
  date,
  time,
}: {
  user_id: string;
  metric_type: string;
  value: number;
  unit?: string;
  date: string;
  time?: string;
}) {
  const { data, error } = await supabase
    .from('user_metrics')
    .insert([{ user_id, metric_type, value, unit, date, time }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserMetrics(user_id: string, metric_type?: string) {
  let query = supabase.from('user_metrics').select('*').eq('user_id', user_id);
  if (metric_type) query = query.eq('metric_type', metric_type);
  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;
  return data;
} 