import { supabase } from './supabase';
import { TrainingSession, WorkoutTemplate } from '@/types/workout';

// Get training session by ID
export const getTrainingSession = async (sessionId: string): Promise<TrainingSession | null> => {
  try {
    // First get the training session
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) {
      console.error('Error fetching training session:', sessionError);
      return null;
    }

    if (!session) {
      console.log('No training session found with ID:', sessionId);
      return null;
    }

    // Then get the client and trainer data separately
    const [clientResult, trainerResult] = await Promise.all([
      session.client_id ? supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', session.client_id)
        .maybeSingle() : Promise.resolve({ data: null, error: null }),
      session.trainer_id ? supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', session.trainer_id)
        .maybeSingle() : Promise.resolve({ data: null, error: null })
    ]);

    // Log any profile fetch errors but don't fail the whole operation
    if (clientResult.error) {
      console.warn('Error fetching client profile:', clientResult.error);
    }
    if (trainerResult.error) {
      console.warn('Error fetching trainer profile:', trainerResult.error);
    }

    const sessionWithProfiles = {
      ...session,
      client: clientResult.data,
      trainer: trainerResult.data
    };

    // Fetch template if template_id exists
    if (session.template_id) {
      try {
        const template = await getWorkoutTemplate(session.template_id);
        if (template) {
          sessionWithProfiles.template = template;
        }
      } catch (error) {
        console.warn('Error fetching template for session:', error);
      }
    }

    return sessionWithProfiles;
  } catch (error) {
    console.error('Error in getTrainingSession:', error);
    return null;
  }
};

// Update training session with workout data
export const updateTrainingSessionData = async (
  sessionId: string,
  sessionData: any,
  completionData?: any
): Promise<boolean> => {
  try {
    const updateData: any = {
      session_data: sessionData,
      updated_at: new Date().toISOString(),
    };

    if (completionData) {
      updateData.completion_data = completionData;
      updateData.status = 'completed';
    }

    const { error } = await supabase
      .from('training_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating training session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTrainingSessionData:', error);
    return false;
  }
};

// Complete training session
export const completeTrainingSession = async (
  sessionId: string,
  completionData: {
    exercises_completed?: any[];
    trainer_notes?: string;
    session_rating?: number;
    duration_minutes?: number;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('training_sessions')
      .update({
        status: 'completed',
        completion_data: completionData,
        exercises_completed: completionData.exercises_completed,
        trainer_notes: completionData.trainer_notes,
        session_rating: completionData.session_rating,
        duration_minutes: completionData.duration_minutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error completing training session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in completeTrainingSession:', error);
    return false;
  }
};

// Get training sessions for a client
export const getClientTrainingSessions = async (
  clientId: string,
  startDate?: string,
  endDate?: string
): Promise<TrainingSession[]> => {
  try {
    let query = supabase
      .from('training_sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: false });

    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }

    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching client training sessions:', error);
      return [];
    }

    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Get unique client and trainer IDs
    const clientIds = [...new Set(sessions.map(s => s.client_id))];
    const trainerIds = [...new Set(sessions.map(s => s.trainer_id))];

    // Fetch all profiles in batches
    const [clientProfiles, trainerProfiles] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', clientIds),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', trainerIds)
    ]);

    // Create lookup maps
    const clientMap = new Map(Array.isArray(clientProfiles?.data) ? clientProfiles.data.map(p => [p.id, p]) : []);
    const trainerMap = new Map(Array.isArray(trainerProfiles?.data) ? trainerProfiles.data.map(p => [p.id, p]) : []);

    // Get unique template IDs and fetch templates
    const templateIds = [...new Set(sessions.map(s => s.template_id).filter(Boolean))];
    const templateMap = new Map();
    
    if (templateIds.length > 0) {
      try {
        const templatePromises = templateIds.map(id => getWorkoutTemplate(id));
        const templates = await Promise.all(templatePromises);
        templates.forEach((template, index) => {
          if (template) {
            templateMap.set(templateIds[index], template);
          }
        });
      } catch (error) {
        console.warn('Error fetching templates for sessions:', error);
      }
    }

    // Combine the data
    return sessions.map(session => ({
      ...session,
      client: clientMap?.get ? clientMap.get(session.client_id) : undefined,
      trainer: trainerMap?.get ? trainerMap.get(session.trainer_id) : undefined,
      template: session.template_id ? templateMap.get(session.template_id) : undefined
    }));
  } catch (error) {
    console.error('Error in getClientTrainingSessions:', error);
    return [];
  }
};

// Get training sessions for a trainer
export const getTrainerTrainingSessions = async (
  trainerId: string,
  startDate?: string,
  endDate?: string
): Promise<TrainingSession[]> => {
  try {
    let query = supabase
      .from('training_sessions')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('scheduled_date', { ascending: true });

    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }

    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching trainer training sessions:', error);
      return [];
    }

    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Get unique client and trainer IDs
    const clientIds = [...new Set(sessions.map(s => s.client_id))];
    const trainerIds = [...new Set(sessions.map(s => s.trainer_id))];

    // Fetch all profiles in batches
    const [clientProfiles, trainerProfiles] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', clientIds),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', trainerIds)
    ]);

    // Create lookup maps
    const clientMap = new Map(Array.isArray(clientProfiles?.data) ? clientProfiles.data.map(p => [p.id, p]) : []);
    const trainerMap = new Map(Array.isArray(trainerProfiles?.data) ? trainerProfiles.data.map(p => [p.id, p]) : []);

    // Get unique template IDs and fetch templates
    const templateIds = [...new Set(sessions.map(s => s.template_id).filter(Boolean))];
    const templateMap = new Map();
    
    if (templateIds.length > 0) {
      try {
        const templatePromises = templateIds.map(id => getWorkoutTemplate(id));
        const templates = await Promise.all(templatePromises);
        templates.forEach((template, index) => {
          if (template) {
            templateMap.set(templateIds[index], template);
          }
        });
      } catch (error) {
        console.warn('Error fetching templates for sessions:', error);
      }
    }

    // Combine the data
    return sessions.map(session => ({
      ...session,
      client: clientMap?.get ? clientMap.get(session.client_id) : undefined,
      trainer: trainerMap?.get ? trainerMap.get(session.trainer_id) : undefined,
      template: session.template_id ? templateMap.get(session.template_id) : undefined
    }));
  } catch (error) {
    console.error('Error in getTrainerTrainingSessions:', error);
    return [];
  }
};

// Get workout template with proper error handling
const getWorkoutTemplate = async (templateId: string): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select(`
          *,
          exercises:template_exercises (
            id,
            order_index,
            sets_config,
            notes,
            exercise:exercises (
              id,
              name,
              category,
              muscle_groups,
              instructions,
              equipment,
              image_url,
              video_url,
              difficulty_level
            )
          )
        `)
        .eq('id', templateId)
        .maybeSingle();
  
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching workout template:', error);
      }
      if (!data) {
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in getWorkoutTemplate:', error);
      return null;
    }
  };
  
export const getTrainingSessionDetails = async (sessionId: string): Promise<any | null> => {
  try {
    // First, try to get the session with all relationships
    const { data, error } = await supabase
      .from('training_sessions')
      .select(`
        *,
        client:client_id (
          id,
          full_name,
          email,
          avatar_url,
          phone_number,
          user_metadata
        ),
        trainer:trainer_id (
          id,
          full_name,
          email
        ),
        template:template_id (
          *,
          exercises:template_exercises (
            id,
            order_index,
            sets_config,
            notes,
            exercise:exercise_id (
              id,
              name,
              category,
              muscle_groups,
              instructions,
              equipment,
              image_url,
              video_url,
              difficulty_level
            )
          )
        ),
        goals:goals (
          id,
          goal_description,
          is_completed
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching training session with relationships:', error);
      
      // If the query with relationships fails, try a simpler query
      const { data: basicSession, error: basicError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (basicError) {
        console.error('Error fetching basic training session:', basicError);
        return null;
      }
      
      // Fetch related data separately
      const [clientData, trainerData, templateData] = await Promise.all([
        basicSession.client_id ? supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, phone_number, user_metadata')
          .eq('id', basicSession.client_id)
          .single() : Promise.resolve({ data: null }),
        basicSession.trainer_id ? supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', basicSession.trainer_id)
          .single() : Promise.resolve({ data: null }),
        basicSession.template_id ? getWorkoutTemplate(basicSession.template_id) : Promise.resolve(null)
      ]);
      
      // Fetch goals separately
      const { data: goalsData } = await supabase
        .from('goals')
        .select('id, goal_description, is_completed')
        .eq('session_id', sessionId);
      
      return {
        ...basicSession,
        client: clientData?.data || null,
        trainer: trainerData?.data || null,
        template: templateData,
        goals: goalsData || []
      };
    }

    return data;
  } catch (error) {
    console.error('Error in getTrainingSessionDetails:', error);
    return null;
  }
};

// Create a new training session
export const createTrainingSession = async (
  sessionData: Omit<TrainingSession, 'id' | 'created_at' | 'updated_at'>
): Promise<TrainingSession | null> => {
  try {
    // Make sure we have both client_id and trainer_id
    if (!sessionData.client_id || !sessionData.trainer_id) {
      console.error('Error creating training session: Missing client_id or trainer_id');
      throw new Error('Missing client_id or trainer_id');
    }

    // Log the data we're trying to insert for debugging
    console.log('Creating training session with data:', JSON.stringify({
      client_id: sessionData.client_id,
      trainer_id: sessionData.trainer_id,
      template_id: sessionData.template_id,
      plan_id: sessionData.plan_id,
    }));

    // Simple insert without any additional fields
    const { data: session, error } = await supabase
      .from('training_sessions')
      .insert({
        ...sessionData,
        session_data: sessionData.session_data || {},
        completion_data: sessionData.completion_data || {},
      })
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error creating training session:', error);
      return null;
    }

    if (!session) {
      console.error('No session data returned after creation');
      return null;
    }

    // Get the client and trainer data separately
    const [clientResult, trainerResult] = await Promise.all([
      session.client_id ? supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', session.client_id)
        .maybeSingle() : Promise.resolve({ data: null, error: null }),
      session.trainer_id ? supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', session.trainer_id)
        .maybeSingle() : Promise.resolve({ data: null, error: null })
    ]);

    // Log any profile fetch errors but don't fail the whole operation
    if (clientResult.error) {
      console.warn('Error fetching client profile:', clientResult.error);
    }
    if (trainerResult.error) {
      console.warn('Error fetching trainer profile:', trainerResult.error);
    }

    const newSessionWithProfiles = {
      ...session,
      client: clientResult.data,
      trainer: trainerResult.data
    };

    // Fetch template if template_id exists
    if (session.template_id) {
      try {
        const template = await getWorkoutTemplate(session.template_id);
        if (template) {
          newSessionWithProfiles.template = template;
        }
      } catch (error) {
        console.warn('Error fetching template for new session:', error);
      }
    }

    return newSessionWithProfiles;
  } catch (error) {
    console.error('Error in createTrainingSession:', error);
    return null;
  }
};

// Fetch all training sessions for a client and plan
export const getTrainingSessionsForPlanSessions = async (
  clientId: string,
  planId: string
): Promise<TrainingSession[]> => {
  try {
    const { data: sessions, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('client_id', clientId)
      .eq('plan_id', planId);

    if (error) {
      console.error('Error fetching training sessions for plan sessions:', error);
      return [];
    }
    return sessions || [];
  } catch (error) {
    console.error('Error in getTrainingSessionsForPlanSessions:', error);
    return [];
  }
};

// Confirm training session
export const confirmTrainingSession = async (
  sessionId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('training_sessions')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error confirming training session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in confirmTrainingSession:', error);
    return false;
  }
};

// Helper function to generate meeting ID
const generateMeetingId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
};

// Reschedule training session
export const rescheduleTrainingSession = async (
  sessionId: string,
  newDate: string,
  newTime: string,
  meetingLink?: string
): Promise<boolean> => {
  try {
    // First, fetch the session to check if it has a meeting link that should be preserved
    const { data: sessionData, error: fetchError } = await supabase
      .from('training_sessions')
      .select('meeting_link, status')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.error('Error fetching session for rescheduling:', fetchError);
      return false;
    }

    // Prepare update data - maintain meeting_link and status if it was confirmed
    const updateData: any = {
      scheduled_date: newDate,
      scheduled_time: newTime,
      updated_at: new Date().toISOString(),
    };

    // If a new meeting link is provided, use it
    if (meetingLink) {
      updateData.meeting_link = meetingLink;
      updateData.status = 'confirmed';
    }
    // Otherwise, if the session was already confirmed (has a meeting link), preserve the status and meeting link
    else if (sessionData.meeting_link) {
      updateData.meeting_link = sessionData.meeting_link;
      // Ensure the status stays as 'confirmed' if it was confirmed before
      if (sessionData.status === 'confirmed') {
        updateData.status = 'confirmed';
      }
    }

    // Update the session with new data while preserving meeting link if it exists
    const { error } = await supabase
      .from('training_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('Error rescheduling training session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in rescheduleTrainingSession:', error);
    return false;
  }
};

// Cancel training session
export const cancelTrainingSession = async (
  sessionId: string,
  reason?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('training_sessions')
      .update({
        status: 'cancelled',
        trainer_notes: reason ? `Cancelled: ${reason}` : 'Session cancelled by client',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error cancelling training session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in cancelTrainingSession:', error);
    return false;
  }
};

// Update session client feedback
export const updateSessionClientFeedback = async (
  sessionId: string,
  rating: number,
  feedback?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('training_sessions')
      .update({
        session_rating: rating,
        client_feedback: feedback,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session client feedback:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateSessionClientFeedback:', error);
    return false;
  }
};

// Enhanced feedback submission with state management and UI feedback
export interface FeedbackSubmissionResult {
  success: boolean;
  data?: TrainingSession;
  error?: string;
}

export interface FeedbackSubmissionOptions {
  sessionId: string;
  rating: number;
  feedback?: string;
  onSuccess?: (updatedSession: TrainingSession) => void;
  onError?: (error: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

/**
 * Comprehensive function to submit feedback to backend and update local state/UI
 * Leverages existing patterns from trainingSessionQueries.ts
 * @param options - Configuration object containing session data and callbacks
 * @returns Promise with submission result including updated session data
 */
export const submitSessionFeedback = async ({
  sessionId,
  rating,
  feedback,
  onSuccess,
  onError,
  onLoadingChange,
}: FeedbackSubmissionOptions): Promise<FeedbackSubmissionResult> => {
  // Validate input parameters
  if (!sessionId) {
    const error = 'Session ID is required';
    onError?.(error);
    return { success: false, error };
  }

  if (!rating || rating < 1 || rating > 5) {
    const error = 'Rating must be between 1 and 5';
    onError?.(error);
    return { success: false, error };
  }

  // Notify loading state started
  onLoadingChange?.(true);

  try {
    console.log('📝 Submitting feedback for session:', sessionId, {
      rating,
      feedback: feedback ? `${feedback.substring(0, 50)}...` : 'No feedback text',
    });

    // Update the session with feedback data
    const { data: updatedSession, error: updateError } = await supabase
      .from('training_sessions')
      .update({
        session_rating: rating,
        client_feedback: feedback || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select('*')
      .maybeSingle();

    if (updateError) {
      console.error('❌ Error updating session feedback:', updateError);
      const errorMessage = updateError.message || 'Failed to update session feedback';
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }

    if (!updatedSession) {
      const error = 'Session not found or update failed';
      console.error('❌ No session data returned after feedback update');
      onError?.(error);
      return { success: false, error };
    }

    console.log('✅ Feedback submitted successfully for session:', updatedSession.id);

    // Fetch complete session data with related information
    try {
      const completeSession = await getTrainingSession(sessionId);
      if (completeSession) {
        console.log('✅ Retrieved complete session data with feedback:', {
          id: completeSession.id,
          rating: completeSession.session_rating,
          hasFeedback: !!completeSession.client_feedback,
        });
        
        // Notify success with complete session data
        onSuccess?.(completeSession);
        return { success: true, data: completeSession };
      } else {
        // Fallback to basic session data if complete fetch fails
        console.warn('⚠️ Could not fetch complete session data, using basic data');
        onSuccess?.(updatedSession as TrainingSession);
        return { success: true, data: updatedSession as TrainingSession };
      }
    } catch (fetchError) {
      console.warn('⚠️ Error fetching complete session data:', fetchError);
      // Still return success since the feedback was submitted
      onSuccess?.(updatedSession as TrainingSession);
      return { success: true, data: updatedSession as TrainingSession };
    }
  } catch (error) {
    console.error('❌ Unexpected error in submitSessionFeedback:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    onError?.(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    // Always notify loading state ended
    onLoadingChange?.(false);
  }
};

/**
 * Utility function to get feedback summary for a session
 * @param session - Training session object
 * @returns Feedback summary object
 */
export const getSessionFeedbackSummary = (session: TrainingSession) => {
  return {
    hasRating: session.session_rating !== null && session.session_rating !== undefined,
    hasFeedback: !!session.client_feedback && session.client_feedback.trim().length > 0,
    rating: session.session_rating || 0,
    feedback: session.client_feedback || '',
    isComplete: !!session.session_rating,
    displayText: session.session_rating ? 
      `${session.session_rating} star${session.session_rating !== 1 ? 's' : ''}` : 
      'No rating yet',
  };
};

// Request session changes
export const requestSessionChange = async (
  sessionId: string,
  changeType: 'reschedule' | 'cancel' | 'modify',
  details: {
    requestedDate?: string;
    requestedTime?: string;
    reason?: string;
    notes?: string;
  }
): Promise<boolean> => {
  try {
    // Create a notification for the trainer about the change request
    const { error } = await supabase.rpc('create_session_notification', {
      p_session_id: sessionId,
      p_notification_type: 'cancellation', // We'll use this for general change requests
      p_scheduled_for: new Date().toISOString()
    });

    if (error) {
      console.error('Error creating change request notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in requestSessionChange:', error);
    return false;
  }
};

// Mark past scheduled sessions as missed
export const markPastSessionsAsMissed = async (clientId: string): Promise<void> => {
  try {
    console.log('🔍 Checking for past scheduled sessions to mark as missed...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Find all scheduled sessions that are in the past
    const { data: pastSessions, error } = await supabase
      .from('training_sessions')
      .select('id, scheduled_date, status')
      .eq('client_id', clientId)
      .eq('status', 'scheduled')
      .lt('scheduled_date', todayStr);

    if (error) {
      console.error('❌ Error fetching past sessions:', error);
      return;
    }

    if (!pastSessions || pastSessions.length === 0) {
      console.log('✅ No past scheduled sessions found');
      return;
    }

    console.log(`📊 Found ${pastSessions.length} past scheduled sessions to mark as missed`);

    // Update all past sessions to missed status
    const sessionIds = pastSessions.map(s => s.id);
    const { error: updateError } = await supabase
      .from('training_sessions')
      .update({ 
        status: 'no_show',
        updated_at: new Date().toISOString()
      })
      .in('id', sessionIds);

    if (updateError) {
      console.error('❌ Error updating past sessions to missed:', updateError);
    } else {
      console.log(`✅ Successfully marked ${sessionIds.length} sessions as missed`);
    }
  } catch (error) {
    console.error('❌ Error in markPastSessionsAsMissed:', error);
  }
};
