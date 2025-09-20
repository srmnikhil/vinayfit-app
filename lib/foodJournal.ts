import { supabase, uploadImage } from './supabase';

export interface MealType {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sort_order: number;
}

export interface NutritionGoals {
  id?: string;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  created_at?: string;
  updated_at?: string;
}

export interface FoodPhoto {
  id: string;
  food_entry_id: string;
  photo_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface FoodEntry {
  id: string;
  title: string;
  description?: string;
  meal_type_id: string;
  date: string;
  time: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes?: string;
  photos?: FoodPhoto[];
  created_at: string;
  updated_at: string;
}

export interface DayNutritionSummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  entries: FoodEntry[];
}

// Get all meal types
export const getMealTypes = async (): Promise<MealType[]> => {
  try {
    const { data, error } = await supabase
      .from('meal_types')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error fetching meal types:', error);
      return getDefaultMealTypes();
    }

    return data || getDefaultMealTypes();
  } catch (error) {
    console.error('Error fetching meal types:', error);
    return getDefaultMealTypes();
  }
};

// Get default meal types (fallback)
const getDefaultMealTypes = (): MealType[] => [
  { id: '1', name: 'Breakfast', emoji: '🌅', color: '#F59E0B', sort_order: 1 },
  { id: '2', name: 'Lunch', emoji: '☀️', color: '#10B981', sort_order: 2 },
  { id: '3', name: 'Dinner', emoji: '🌙', color: '#3B82F6', sort_order: 3 },
  { id: '4', name: 'Snack', emoji: '🍎', color: '#8B5CF6', sort_order: 4 },
];

// Get nutrition goals
export const getNutritionGoals = async (): Promise<NutritionGoals | null> => {
  try {
    const { data, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching nutrition goals:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching nutrition goals:', error);
    return null;
  }
};

// Create or update nutrition goals
export const upsertNutritionGoals = async (goals: Omit<NutritionGoals, 'id' | 'created_at' | 'updated_at'>): Promise<NutritionGoals | null> => {
  try {
    const { data, error } = await supabase
      .from('nutrition_goals')
      .upsert({
        ...goals,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting nutrition goals:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error upserting nutrition goals:', error);
    return null;
  }
};

// Get food entries for date range
export const getFoodEntriesForDateRange = async (startDate: string, endDate: string): Promise<DayNutritionSummary[]> => {
  try {
    const { data, error } = await supabase
      .from('food_entries')
      .select(`
        *,
        photos:food_photos(*)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching food entries:', error);
      return [];
    }

    // Group by date and calculate totals
    const groupedByDate = (data || []).reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0,
          entries: [],
        };
      }

      acc[date].total_calories += entry.calories || 0;
      acc[date].total_protein += entry.protein_g || 0;
      acc[date].total_carbs += entry.carbs_g || 0;
      acc[date].total_fat += entry.fat_g || 0;
      acc[date].entries.push(entry);

      return acc;
    }, {} as Record<string, DayNutritionSummary>);

    return Object.values(groupedByDate);
  } catch (error) {
    console.error('Error fetching food entries:', error);
    return [];
  }
};

// Create food entry
export const createFoodEntry = async (entry: Omit<FoodEntry, 'id' | 'created_at' | 'updated_at' | 'photos'>): Promise<FoodEntry | null> => {
  try {
    const { data, error } = await supabase
      .from('food_entries')
      .insert({
        ...entry,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating food entry:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating food entry:', error);
    return null;
  }
};

// Update food entry
export const updateFoodEntry = async (id: string, entry: Partial<Omit<FoodEntry, 'id' | 'created_at' | 'updated_at' | 'photos'>>): Promise<FoodEntry | null> => {
  try {
    const { data, error } = await supabase
      .from('food_entries')
      .update({
        ...entry,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating food entry:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating food entry:', error);
    return null;
  }
};

// Delete food entry
export const deleteFoodEntry = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting food entry:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting food entry:', error);
    return false;
  }
};

// Add food photo
export const addFoodPhoto = async (foodEntryId: string, photoData: { photo_url: string; is_primary: boolean }): Promise<FoodPhoto | null> => {
  try {
    console.log('=== Starting photo upload ===');
    console.log('Food Entry ID:', foodEntryId);
    
    // Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Authentication error:', sessionError || 'No active session');
      return null;
    }
    console.log('User authenticated, ID:', session.user?.id);
    
    // Upload image to Supabase Storage
    console.log('Uploading image to storage...');
    const uploadedUrl = await uploadImage(photoData.photo_url, 'food-photos');
    
    if (!uploadedUrl) {
      console.error('Failed to upload image to storage');
      return null;
    }
    
    console.log('Image uploaded successfully:', uploadedUrl);

    // Insert photo record into database
    console.log('Creating photo record in database...');
    const { data, error } = await supabase
      .from('food_photos')
      .insert({
        food_entry_id: foodEntryId,
        photo_url: uploadedUrl,
        is_primary: photoData.is_primary,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding food photo to database:', error);
      return null;
    }

    console.log('Photo record created successfully:', data.id);
    return data;
  } catch (error) {
    console.error('Error in addFoodPhoto:', error);
    return null;
  }
};

// Delete food photo
export const deleteFoodPhoto = async (id: string): Promise<boolean> => {
  try {
    // Get photo URL first to delete from storage
    const { data: photo } = await supabase
      .from('food_photos')
      .select('photo_url')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('food_photos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting food photo:', error);
      return false;
    }

    // Delete from storage if we have the URL
    if (photo?.photo_url) {
      // Note: We're not awaiting this as it's not critical if storage cleanup fails
      uploadImage(photo.photo_url).catch(console.error);
    }

    return true;
  } catch (error) {
    console.error('Error deleting food photo:', error);
    return false;
  }
};