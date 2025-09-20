import { supabase } from './supabase';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  instructions?: string;
  equipment?: string;
  created_by?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Get all exercises (public and user's own)
export const getExercises = async (): Promise<Exercise[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });

    if (user) {
      // Get user's profile to check their ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // Get public exercises and user's own exercises
        query = query.or(`is_public.eq.true,created_by.eq.${profile.id}`);
      } else {
        // If no profile, just get public exercises
        query = query.eq('is_public', true);
      }
    } else {
      // If not authenticated, just get public exercises
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching exercises:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getExercises:', error);
    return [];
  }
};

// Get a specific exercise by ID
export const getExercise = async (id: string): Promise<Exercise | null> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching exercise:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getExercise:', error);
    return null;
  }
};

// Create a new exercise
export const createExercise = async (exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>): Promise<Exercise | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      console.error('User profile not found');
      return null;
    }

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        ...exercise,
        created_by: profile.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating exercise:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createExercise:', error);
    return null;
  }
};

// Update an exercise
export const updateExercise = async (id: string, updates: Partial<Exercise>): Promise<Exercise | null> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating exercise:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateExercise:', error);
    return null;
  }
};

// Delete an exercise
export const deleteExercise = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting exercise:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteExercise:', error);
    return false;
  }
};

// Get exercises by category
export const getExercisesByCategory = async (category: string): Promise<Exercise[]> => {
  try {
    const exercises = await getExercises();
    return exercises.filter(exercise => exercise.category.toLowerCase() === category.toLowerCase());
  } catch (error) {
    console.error('Error in getExercisesByCategory:', error);
    return [];
  }
};

// Get exercises by muscle group
export const getExercisesByMuscleGroup = async (muscleGroup: string): Promise<Exercise[]> => {
  try {
    const exercises = await getExercises();
    return exercises.filter(exercise => 
      exercise.muscle_groups.some(group => 
        group.toLowerCase().includes(muscleGroup.toLowerCase())
      )
    );
  } catch (error) {
    console.error('Error in getExercisesByMuscleGroup:', error);
    return [];
  }
};

// Search exercises by name
export const searchExercises = async (query: string): Promise<Exercise[]> => {
  try {
    const exercises = await getExercises();
    return exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(query.toLowerCase()) ||
      exercise.category.toLowerCase().includes(query.toLowerCase()) ||
      exercise.muscle_groups.some(group => 
        group.toLowerCase().includes(query.toLowerCase())
      )
    );
  } catch (error) {
    console.error('Error in searchExercises:', error);
    return [];
  }
};