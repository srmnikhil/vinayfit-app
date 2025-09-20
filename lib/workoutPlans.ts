import { supabase } from './supabase';
import { WorkoutPlan, PlanSession, WorkoutTemplate } from '@/types/workout';
import { Alert } from 'react-native';

export interface WorkoutTemplateForPlan {
  id: string;
  name: string;
  category: string;
  estimated_duration_minutes: number;
}

export interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
}

async function getCurrentUserProfileId(): Promise<string> {
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (error || !profile) {
    throw new Error('User profile not found');
  }
  return profile.id;
}

export async function getTrainerClients(): Promise<ClientProfile[]> {
  try {
    const trainerProfileId = await getCurrentUserProfileId();

    const { data, error } = await supabase
      .from('client_assignments')
      .select('client_id, profiles!client_assignments_client_id_fkey(id, full_name, email)')
      .eq('trainer_id', trainerProfileId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching trainer clients:', error);
      throw error;
    }
return data.map(assignment => assignment.profiles[0] as ClientProfile);
    // return data.map(assignment => assignment.profiles as ClientProfile);
  } catch (error) {
    console.error('Error in getTrainerClients:', error);
    throw error;
  }
}

export async function getWorkoutTemplatesForPlans(): Promise<WorkoutTemplateForPlan[]> {
  try {
    const userProfileId = await getCurrentUserProfileId();
    const { data, error } = await supabase
      .from('workout_templates')
      .select('id, name, category, estimated_duration_minutes')
      .or(`is_public.eq.true,created_by.eq.${userProfileId}`);

    if (error) {
      console.error('Error fetching workout templates:', error);
      throw error;
    }

    return data as WorkoutTemplateForPlan[];
  } catch (error) {
    console.error('Error in getWorkoutTemplatesForPlans:', error);
    throw error;
  }
}

export async function createWorkoutPlan(planData: Omit<WorkoutPlan, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<WorkoutPlan | null> {
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .insert(planData)
      .select()
      .single();

    if (error) {
      console.error('Error creating workout plan:', error);
      throw error;
    }

    return data as WorkoutPlan;
  } catch (error) {
    console.error('Error in createWorkoutPlan:', error);
    throw error;
  }
}

export async function updateWorkoutPlan(planId: string, planData: Partial<Omit<WorkoutPlan, 'id' | 'created_at' | 'updated_at'>>): Promise<WorkoutPlan | null> {
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .update(planData)
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      console.error('Error updating workout plan:', error);
      throw error;
    }

    return data as WorkoutPlan;
  } catch (error) {
    console.error('Error in updateWorkoutPlan:', error);
    throw error;
  }
}

export async function getWorkoutPlan(planId: string): Promise<WorkoutPlan | null> {
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      console.error('Error fetching workout plan:', error);
      throw error;
    }

    return data as WorkoutPlan;
  } catch (error) {
    console.error('Error in getWorkoutPlan:', error);
    throw error;
  }
}

export async function createPlanSessions(sessions: Omit<PlanSession, 'id' | 'created_at' | 'updated_at'>[]): Promise<PlanSession[] | null> {
  try {
    const { data, error } = await supabase
      .from('plan_sessions')
      .insert(sessions)
      .select();

    if (error) {
      console.error('Error creating plan sessions:', error);
      throw error;
    }

    return data as PlanSession[];
  } catch (error) {
    console.error('Error in createPlanSessions:', error);
    throw error;
  }
}

export async function deletePlanSessions(planId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('plan_sessions')
      .delete()
      .eq('plan_id', planId);

    if (error) {
      console.error('Error deleting plan sessions:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deletePlanSessions:', error);
    throw error;
  }
}

export async function getPlanSessionsForClient(clientId: string, startDate: string, endDate: string): Promise<PlanSession[]> {
  try {
    const { data, error } = await supabase
      .from('plan_sessions')
      .select(`
        *,
        workout_plans(client_id),
        workout_templates(name, category, estimated_duration_minutes)
      `)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching client plan sessions:', error);
      throw error;
    }

    const filteredData = data.filter(session => session.workout_plans?.client_id === clientId);

    return filteredData.map(session => ({
      ...session,
      template: session.workout_templates,
    })) as PlanSession[];
  } catch (error) {
    console.error('Error in getPlanSessionsForClient:', error);
    throw error;
  }
}

export async function createSampleClientAssignment(): Promise<boolean> {
  try {
    const { data: { user } = {} } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return false;
    }

    const { data: trainerProfile, error: trainerProfileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'trainer')
      .single();

    if (trainerProfileError || !trainerProfile) {
      Alert.alert('Error', 'Trainer profile not found. Please ensure you are logged in as a trainer.');
      return false;
    }

    const { data: existingClient, error: existingClientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'sampleclient@vinayfit.com')
      .single();

    let sampleClientId;
    if (existingClient) {
      sampleClientId = existingClient.id;
    } else {
      const { data: newClient, error: newClientError } = await supabase
        .from('profiles')
        .insert({
          email: 'sampleclient@vinayfit.com',
          full_name: 'Sample Client',
          role: 'client',
        })
        .select('id')
        .single();

      if (newClientError || !newClient) {
        console.error('Error creating sample client:', newClientError);
        Alert.alert('Error', 'Failed to create sample client.');
        return false;
      }
      sampleClientId = newClient.id;
    }

    const { data: existingAssignment, error: assignmentCheckError } = await supabase
      .from('client_assignments')
      .select('id')
      .eq('client_id', sampleClientId)
      .eq('trainer_id', trainerProfile.id)
      .single();

    if (existingAssignment) {
      Alert.alert('Info', 'Sample client already assigned to you.');
      return true;
    }

    const { error: assignmentError } = await supabase
      .from('client_assignments')
      .insert({
        client_id: sampleClientId,
        trainer_id: trainerProfile.id,
        assigned_by: trainerProfile.id,
        status: 'active',
      });

    if (assignmentError) {
      console.error('Error creating sample client assignment:', assignmentError);
      Alert.alert('Error', 'Failed to create sample client assignment.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in createSampleClientAssignment:', error);
    Alert.alert('Error', 'An unexpected error occurred while creating sample client assignment.');
    return false;
  }
}
