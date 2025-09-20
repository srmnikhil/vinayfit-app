import { supabase, type ProgressPhoto, type NewProgressPhoto, type UpdateProgressPhoto } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export class ProgressPhotosService {
  /**
   * Upload image to Supabase storage
   */
  static async uploadImage(uri: string, userId: string): Promise<string> {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create unique filename
      const fileName = `${userId}/${Date.now()}.jpg`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('progress-photos')
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Get all progress photos for a user
   */
  static async getProgressPhotos(userId: string): Promise<ProgressPhoto[]> {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching progress photos:', error);
      throw error;
    }
  }

  /**
   * Add a new progress photo
   */
  static async addProgressPhoto(photo: NewProgressPhoto): Promise<ProgressPhoto> {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .insert([photo])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error adding progress photo:', error);
      throw error;
    }
  }

  /**
   * Update an existing progress photo
   */
  static async updateProgressPhoto(id: string, updates: UpdateProgressPhoto): Promise<ProgressPhoto> {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating progress photo:', error);
      throw error;
    }
  }

  /**
   * Delete a progress photo
   */
  static async deleteProgressPhoto(id: string, imageUrl: string): Promise<void> {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', id);

      if (dbError) {
        throw dbError;
      }

      // Delete from storage
      if (imageUrl.includes('progress-photos')) {
        const filePath = imageUrl.split('/progress-photos/')[1];
        const { error: storageError } = await supabase.storage
          .from('progress-photos')
          .remove([filePath]);

        if (storageError) {
          console.error('Error deleting from storage:', storageError);
          // Don't throw here as the database deletion was successful
        }
      }
    } catch (error) {
      console.error('Error deleting progress photo:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(id: string, isFavorite: boolean): Promise<ProgressPhoto> {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .update({ is_favorite: isFavorite })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Get progress photos with filters
   */
  static async getFilteredProgressPhotos(
    userId: string,
    filters: {
      pose?: string;
      timeframe?: string;
      searchQuery?: string;
    }
  ): Promise<ProgressPhoto[]> {
    try {
      let query = supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', userId);

      // Apply pose filter
      if (filters.pose && filters.pose !== 'all') {
        query = query.eq('pose', filters.pose);
      }

      // Apply timeframe filter
      if (filters.timeframe && filters.timeframe !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (filters.timeframe) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '3months':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }

      // Apply search query filter
      if (filters.searchQuery) {
        query = query.or(
          `notes.ilike.%${filters.searchQuery}%,tags.cs.{${filters.searchQuery}}`
        );
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching filtered progress photos:', error);
      throw error;
    }
  }
}