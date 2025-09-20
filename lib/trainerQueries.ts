import { supabase } from './supabase';

export interface EnhancedTrainerStats {
  trainer_id: string;
  trainer_name: string;
  trainer_email: string;
  total_clients: number;
  active_clients: number;
  today_sessions: number;
  completed_today: number;
  pending_today: number;
  unread_notifications: number;
  avg_session_rating: number;
  weekly_sessions: number;
}

export interface EnhancedClientData {
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  fitness_goals?: string[];
  last_active: string;
  activity_status: 'active' | 'inactive' | 'dormant';
  total_sessions: number;
  completed_sessions: number;
  avg_rating: number;
  last_session_date?: string;
  next_session_date?: string;
  progress_score: number;
  assignment_status: string;
}

export interface EnhancedTrainingSession {
  id: string;
  client_id: string;
  trainer_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  location?: string;
  notes?: string;
  trainer_notes?: string;
  client_feedback?: string;
  session_rating?: number;
  exercises_completed?: any[];
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    fitness_goals?: string[];
  };
}

export interface SessionNotification {
  id: string;
  session_id: string;
  trainer_id: string;
  client_id: string;
  notification_type: 'reminder' | 'confirmation' | 'cancellation' | 'completion' | 'no_show';
  title: string;
  message: string;
  scheduled_for: string;
  sent: boolean;
  read: boolean;
  data: any;
  created_at: string;
}

export interface ClientActivity {
  id: string;
  client_id: string;
  trainer_id?: string;
  activity_type: 'session_completed' | 'session_cancelled' | 'goal_achieved' | 'progress_updated' | 'message_sent' | 'login';
  description: string;
  metadata: any;
  activity_date: string;
  created_at: string;
}

// Get current trainer profile
export const getCurrentTrainerProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'trainer')
      .single();

    if (error) {
      console.error('Error fetching trainer profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCurrentTrainerProfile:', error);
    return null;
  }
};

// Get enhanced trainer dashboard statistics
export const getEnhancedTrainerStats = async (): Promise<EnhancedTrainerStats | null> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return null;

    // Call the Postgres function via Supabase RPC
    const { data, error } = await supabase.rpc('get_enhanced_trainer_stats', {
      trainer_profile_id: profile.id,
    });

    if (error) {
      console.error('Error fetching enhanced trainer stats:', error);
      return null;
    }

    // The function returns an array with one row (or empty array)
    const stats = data && data.length > 0 ? data[0] : null;
    if (!stats) return null;

    // Optionally, fetch unread notifications count if you want to keep that field
    let unread_notifications = 0;
    try {
      const { data: notifications, error: notificationsError } = await supabase
        .from('session_reminders')
        .select('id')
        .eq('trainer_id', profile.id)
        .eq('read', false);

      if (!notificationsError) {
        unread_notifications = notifications?.length || 0;
      }
    } catch {}

    return {
      trainer_id: stats.trainer_id,
      trainer_name: stats.trainer_name,
      trainer_email: profile.email || '',
      total_clients: stats.total_clients,
      active_clients: stats.active_clients,
      today_sessions: stats.today_sessions,
      completed_today: stats.completed_today,
      pending_today: stats.pending_today,
      unread_notifications,
      avg_session_rating: Number(stats.avg_session_rating),
      weekly_sessions: stats.weekly_sessions,
    };
  } catch (error) {
    console.error('Error in getEnhancedTrainerStats:', error);
    return null;
  }
};

// Get enhanced active clients with detailed information
export const getEnhancedActiveClients = async (): Promise<EnhancedClientData[]> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return [];

    // First, get assigned client IDs from client_assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('client_assignments')
      .select('client_id')
      .eq('trainer_id', profile.id)
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('Error fetching client assignments:', assignmentsError);
      return [];
    }

    const assignedClientIds = (assignments || []).map(a => a.client_id).filter(Boolean);
    
    if (assignedClientIds.length === 0) {
      return [];
    }

    // Then, get client details from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, fitness_goals, created_at')
      .in('id', assignedClientIds);

    if (error) {
      console.error('Error fetching enhanced active clients:', error);
      return [];
    }

    // Transform the data to match the expected interface
    const enhancedClients = (data || []).map((client: any) => ({
      id: client.id,
      client_name: client.full_name || '',
      client_email: client.email || '',
      client_phone: client.phone_number,
      fitness_goals: client.fitness_goals || [],
      last_active: client.created_at || new Date().toISOString(),
      activity_status: 'active' as const,
      total_sessions: 0, // You can calculate this if needed
      completed_sessions: 0, // You can calculate this if needed
      avg_rating: 0, // You can calculate this if needed
      last_session_date: undefined,
      next_session_date: undefined,
      progress_score: 0, // You can calculate this if needed
      assignment_status: 'active',
    }));

    return enhancedClients;
  } catch (error) {
    console.error('Error in getEnhancedActiveClients:', error);
    return [];
  }
};
// console.log('Enhanced active clients query executed', getEnhancedActiveClients);
// Get today's training sessions with enhanced data
export const getEnhancedTodaySessions = async (): Promise<EnhancedTrainingSession[]> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return [];

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('training_sessions')
      .select(`
        *,
        client:profiles!training_sessions_client_id_fkey(
          id,
          full_name,
          email,
          phone_number,
          fitness_goals
        )
      `)
      .eq('trainer_id', profile.id)
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error fetching enhanced today sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getEnhancedTodaySessions:', error);
    return [];
  }
};

// Get upcoming training sessions (next 7 days)
export const getEnhancedUpcomingSessions = async (): Promise<EnhancedTrainingSession[]> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return [];

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('training_sessions')
      .select(`
        *,
        client:profiles!training_sessions_client_id_fkey(
          id,
          full_name,
          email,
          phone_number,
          fitness_goals
        )
      `)
      .eq('trainer_id', profile.id)
      .eq('status', 'scheduled')
      .gt('scheduled_date', today)
      .lte('scheduled_date', nextWeekStr)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error fetching enhanced upcoming sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getEnhancedUpcomingSessions:', error);
    return [];
  }
};

// Get session notifications
export const getSessionNotifications = async (limit: number = 20): Promise<SessionNotification[]> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('session_reminders')
      .select('*')
      .eq('trainer_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching session notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSessionNotifications:', error);
    return [];
  }
};

// Get client activity log
export const getClientActivityLog = async (clientId?: string, limit: number = 50): Promise<ClientActivity[]> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return [];

    let query = supabase
      .from('client_activity_log')
      .select('*')
      .eq('trainer_id', profile.id)
      .order('activity_date', { ascending: false })
      .limit(limit);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching client activity log:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getClientActivityLog:', error);
    return [];
  }
};

// Mark notification as read
export const markSessionNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('session_notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markSessionNotificationAsRead:', error);
    return false;
  }
};

// Complete training session with enhanced data
export const completeEnhancedTrainingSession = async (
  sessionId: string,
  data: {
    trainer_notes?: string;
    exercises_completed?: any[];
    session_rating?: number;
    client_feedback?: string;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('training_sessions')
      .update({
        status: 'completed',
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error completing enhanced training session:', error);
      return false;
    }

    // Create completion notification
    await supabase.rpc('create_session_notification', {
      p_session_id: sessionId,
      p_notification_type: 'completion',
      p_scheduled_for: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error in completeEnhancedTrainingSession:', error);
    return false;
  }
};

// Create a new training session
export const createEnhancedTrainingSession = async (sessionData: {
  client_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  type: string;
  location?: string;
  notes?: string;
}): Promise<EnhancedTrainingSession | null> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return null;

    const { data, error } = await supabase
      .from('training_sessions')
      .insert({
        trainer_id: profile.id,
        ...sessionData,
        status: 'scheduled'
      })
      .select(`
        *,
        client:profiles!training_sessions_client_id_fkey(
          id,
          full_name,
          email,
          phone_number,
          fitness_goals
        )
      `)
      .single();

    if (error) {
      console.error('Error creating enhanced training session:', error);
      return null;
    }

    // Create reminder notification
    const reminderTime = new Date(`${sessionData.scheduled_date}T${sessionData.scheduled_time}`);
    reminderTime.setHours(reminderTime.getHours() - 1); // 1 hour before

    await supabase.rpc('create_session_notification', {
      p_session_id: data.id,
      p_notification_type: 'reminder',
      p_scheduled_for: reminderTime.toISOString()
    });

    return data;
  } catch (error) {
    console.error('Error in createEnhancedTrainingSession:', error);
    return null;
  }
};

// Update trainer dashboard stats manually
export const updateTrainerDashboardStats = async (): Promise<boolean> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return false;

    const { error } = await supabase.rpc('update_trainer_dashboard_stats', {
      p_trainer_id: profile.id
    });

    if (error) {
      console.error('Error updating trainer dashboard stats:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTrainerDashboardStats:', error);
    return false;
  }
};

// Log client activity
export const logClientActivity = async (
  clientId: string,
  activityType: string,
  description: string,
  metadata: any = {}
): Promise<boolean> => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return false;

    const { error } = await supabase.rpc('log_client_activity', {
      p_client_id: clientId,
      p_trainer_id: profile.id,
      p_activity_type: activityType,
      p_description: description,
      p_metadata: metadata
    });

    if (error) {
      console.error('Error logging client activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in logClientActivity:', error);
    return false;
  }
};

// Get trainer performance metrics
export const getTrainerPerformanceMetrics = async (days: number = 30) => {
  try {
    const profile = await getCurrentTrainerProfile();
    if (!profile) return null;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('trainer_dashboard_stats')
      .select('*')
      .eq('trainer_id', profile.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching trainer performance metrics:', error);
      return null;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTrainerPerformanceMetrics:', error);
    return null;
  }
};