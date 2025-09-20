import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase, type ProgressPhoto } from '@/lib/supabase';
import { ProgressPhotosService } from '@/services/progressPhotosService';
import { addMetricEntryToSupabase } from '@/lib/metricsDatabase';

// Utility to format date as YYYY-MM-DD
function formatDateToYMD(date: string | Date | undefined): string {
  if (!date) return new Date().toISOString().split('T')[0];
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
}

export const useProgressPhotos = () => {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPhotos();
    } else {
      setPhotos([]);
      setLoading(false);
    }
  }, [user]);

  const fetchPhotos = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedPhotos = await ProgressPhotosService.getProgressPhotos(user.id);
      setPhotos(fetchedPhotos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch photos');
      console.error('Error fetching photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const addPhoto = async (photoData: {
    imageUri: string;
    weight?: number;
    bodyFat?: number;
    musclePercentage?: number;
    measurements?: Record<string, number>;
    date?: string;
    time?: string;
    tags?: string[];
    pose?: 'front' | 'side' | 'back' | 'custom';
    notes?: string;
    mood?: 'motivated' | 'confident' | 'determined' | 'proud' | 'focused';
  }) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add photos');
      return;
    }

    try {
      setLoading(true);
      
      // Upload image to Supabase storage
      const imageUrl = await ProgressPhotosService.uploadImage(photoData.imageUri, user.id);
      
      // Add photo to database
      const newPhoto = await ProgressPhotosService.addProgressPhoto({
        user_id: user.id,
        image_url: imageUrl,
        weight: photoData.weight,
        body_fat: photoData.bodyFat,
        muscle_percentage: photoData.musclePercentage,
        measurements: photoData.measurements,
        date: formatDateToYMD(photoData.date),
        time: photoData.time || new Date().toTimeString().slice(0, 5),
        tags: photoData.tags,
        pose: photoData.pose || 'front',
        notes: photoData.notes,
        mood: photoData.mood || 'motivated',
      });

      // Add metric entries for weight, body fat, and muscle
      const metricDate = formatDateToYMD(photoData.date);
      const metricTime = photoData.time || new Date().toTimeString().slice(0, 5);
      const metricPromises = [];
      if (photoData.weight !== undefined) {
        metricPromises.push(addMetricEntryToSupabase({
          user_id: user.id,
          metric_type: 'weight',
          value: photoData.weight,
          unit: 'kg',
          date: metricDate,
          time: metricTime,
        }));
      }
      if (photoData.bodyFat !== undefined) {
        metricPromises.push(addMetricEntryToSupabase({
          user_id: user.id,
          metric_type: 'body_fat',
          value: photoData.bodyFat,
          unit: '%',
          date: metricDate,
          time: metricTime,
        }));
      }
      if (photoData.musclePercentage !== undefined) {
        metricPromises.push(addMetricEntryToSupabase({
          user_id: user.id,
          metric_type: 'muscle',
          value: photoData.musclePercentage,
          unit: '%',
          date: metricDate,
          time: metricTime,
        }));
      }
      if (metricPromises.length > 0) {
        await Promise.all(metricPromises);
      }

      setPhotos(prev => [newPhoto, ...prev]);
      Alert.alert('Success', 'Photo added successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add photo');
      console.error('Error adding photo:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePhoto = async (id: string, updates: {
    weight?: number;
    bodyFat?: number;
    musclePercentage?: number;
    measurements?: Record<string, number>;
    date?: string;
    time?: string;
    tags?: string[];
    pose?: 'front' | 'side' | 'back' | 'custom';
    notes?: string;
    mood?: 'motivated' | 'confident' | 'determined' | 'proud' | 'focused';
  }) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update photos');
      return;
    }

    try {
      setLoading(true);
      
      const updatedPhoto = await ProgressPhotosService.updateProgressPhoto(id, {
        weight: updates.weight,
        body_fat: updates.bodyFat,
        muscle_percentage: updates.musclePercentage,
        measurements: updates.measurements,
        date: updates.date,
        time: updates.time,
        tags: updates.tags,
        pose: updates.pose,
        notes: updates.notes,
        mood: updates.mood,
      });

      setPhotos(prev => prev.map(photo => 
        photo.id === id ? updatedPhoto : photo
      ));
      Alert.alert('Success', 'Photo updated successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update photo');
      console.error('Error updating photo:', err);
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (id: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to delete photos');
      return;
    }

    const photo = photos.find(p => p.id === id);
    if (!photo) {
      Alert.alert('Error', 'Photo not found');
      return;
    }

    try {
      setLoading(true);
      
      await ProgressPhotosService.deleteProgressPhoto(id, photo.image_url);
      
      setPhotos(prev => prev.filter(p => p.id !== id));
      Alert.alert('Success', 'Photo deleted successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete photo');
      console.error('Error deleting photo:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update favorites');
      return;
    }

    const photo = photos.find(p => p.id === id);
    if (!photo) {
      Alert.alert('Error', 'Photo not found');
      return;
    }

    try {
      const updatedPhoto = await ProgressPhotosService.toggleFavorite(id, !photo.is_favorite);
      
      setPhotos(prev => prev.map(p => 
        p.id === id ? updatedPhoto : p
      ));
      
      Alert.alert('Success', updatedPhoto.is_favorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update favorite status');
      console.error('Error toggling favorite:', err);
    }
  };

  const getFilteredPhotos = async (filters: {
    pose?: string;
    timeframe?: string;
    searchQuery?: string;
  }) => {
    if (!user) return [];

    try {
      const filteredPhotos = await ProgressPhotosService.getFilteredProgressPhotos(user.id, filters);
      return filteredPhotos;
    } catch (err) {
      console.error('Error getting filtered photos:', err);
      return [];
    }
  };

  return {
    photos,
    loading,
    error,
    user,
    addPhoto,
    updatePhoto,
    deletePhoto,
    toggleFavorite,
    getFilteredPhotos,
    refreshPhotos: fetchPhotos,
  };
};