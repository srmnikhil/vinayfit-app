import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Supabase configuration
const supabaseUrl = 'https://whvxmwvsjdwfzkobaqzi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indodnhtd3ZzamR3Znprb2JhcXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NTI4NjYsImV4cCI6MjA1NDUyODg2Nn0.8XqdoDtfidC8km7Buo6ED3DM7hhFsDAu8wyLoQDbjXc';// Custom storage adapter for different platforms
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      // Use AsyncStorage for web
      return AsyncStorage.getItem(key);
    } else {
      // Use SecureStore for mobile
      return SecureStore.getItemAsync(key);
    }
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      // Use AsyncStorage for web
      return AsyncStorage.setItem(key, value);
    } else {
      // Use SecureStore for mobile
      return SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      // Use AsyncStorage for web
      return AsyncStorage.removeItem(key);
    } else {
      // Use SecureStore for mobile
      return SecureStore.deleteItemAsync(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
    },
  },
});

// Add a global error handler
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session ? 'User logged in' : 'No user');
});

// Auth helper functions
export const signUp = async (email: string, password: string, userData?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
};

export const updateProfile = async (updates: any) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });
  return { data, error };
};

// Types
export interface Database {
  public: {
    Tables: {
      progress_photos: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          weight: number | null;
          body_fat: number | null;
          muscle_percentage: number | null;
          measurements: Record<string, number> | null;
          date: string;
          time: string;
          tags: string[] | null;
          pose: 'front' | 'side' | 'back' | 'custom';
          notes: string | null;
          mood: 'motivated' | 'confident' | 'determined' | 'proud' | 'focused';
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          weight?: number | null;
          body_fat?: number | null;
          muscle_percentage?: number | null;
          measurements?: Record<string, number> | null;
          date?: string;
          time?: string;
          tags?: string[] | null;
          pose?: 'front' | 'side' | 'back' | 'custom';
          notes?: string | null;
          mood?: 'motivated' | 'confident' | 'determined' | 'proud' | 'focused';
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          weight?: number | null;
          body_fat?: number | null;
          muscle_percentage?: number | null;
          measurements?: Record<string, number> | null;
          date?: string;
          time?: string;
          tags?: string[] | null;
          pose?: 'front' | 'side' | 'back' | 'custom';
          notes?: string | null;
          mood?: 'motivated' | 'confident' | 'determined' | 'proud' | 'focused';
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// Upload image to Supabase Storage
export const uploadImage = async (uri: string, bucket: string = 'food-photos'): Promise<string | null> => {
  console.log(`[uploadImage] Starting upload for URI: ${uri}`);
  
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      const errorMsg = `[uploadImage] File does not exist: ${uri}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    console.log(`[uploadImage] File exists, size: ${fileInfo.size} bytes`);

    // Check if file is accessible
    const canRead = await FileSystem.getInfoAsync(uri, { size: true });
    if (!canRead.exists) {
      const errorMsg = `[uploadError] Cannot read file: ${uri}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Read file as base64
    console.log(`[uploadImage] Reading file as base64...`);
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64) {
      const errorMsg = `[uploadError] Failed to read file as base64: ${uri}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Get current user session
    console.log(`[uploadImage] Getting current user session...`);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      const errorMsg = `[uploadError] Authentication failed: ${userError?.message || 'No user found'}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const userId = user.id;
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const filePath = fileName;
    
    console.log(`[uploadImage] Generated file path: ${filePath}`);

    // Get the current session for auth token
    console.log(`[uploadImage] Getting session...`);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const errorMsg = '[uploadError] No active session found';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Convert base64 to ArrayBuffer
    console.log(`[uploadImage] Converting base64 to ArrayBuffer...`);
    const arrayBuffer = decode(base64);
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      const errorMsg = '[uploadError] Failed to convert file to ArrayBuffer';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Upload to Supabase storage
    console.log(`[uploadImage] Uploading to bucket '${bucket}'...`);
    const uploadOptions = {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '3600',
      duplex: 'half',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'x-upsert': 'true',
      },
    };
    
    console.log(`[uploadImage] Upload options:`, JSON.stringify(uploadOptions, null, 2));
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, uploadOptions);

    if (error) {
      const errorDetails = {
        message: `[uploadError] ${error.message}`,
        status: error.statusCode,
        bucket: bucket,
        path: filePath,
        details: error.details,
        hint: error.hint,
      };
      console.error('Upload failed:', JSON.stringify(errorDetails, null, 2));
      throw new Error(`Failed to upload to storage: ${error.message}`);
    }

    if (!data || !data.path) {
      const errorMsg = '[uploadError] No data or path returned from upload';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Get public URL
    console.log(`[uploadImage] Getting public URL for path: ${data.path}`);
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!publicUrl) {
      const errorMsg = '[uploadError] Failed to get public URL';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log('[uploadImage] File uploaded successfully. Public URL:', publicUrl);
    
    // Verify the file is accessible
    try {
      console.log('[uploadImage] Verifying upload...');
      const response = await fetch(publicUrl);
      if (!response.ok) {
        const errorMsg = `[uploadError] Upload verification failed: ${response.status} ${response.statusText}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      console.log('[uploadImage] Upload verification successful');
    } catch (verifyError) {
      console.error('[uploadError] Error verifying upload:', verifyError);
      // Continue even if verification fails
    }

    return publicUrl;
  } catch (error) {
    console.error('[uploadError] Error in uploadImage:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      uri,
      bucket,
    });
    throw error; // Re-throw to allow proper error handling upstream
  }
};

// Upload image with retry logic
export const uploadImageWithRetry = async (uri: string, bucket: string = 'workout-images', maxRetries: number = 3): Promise<string | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error(`Upload error (attempt ${attempt}):`, error);
        if (attempt === maxRetries) {
          return null;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log(`Upload successful on attempt ${attempt}`);
      return publicUrl;
    } catch (error) {
      console.error(`Error uploading image (attempt ${attempt}):`, error);
      if (attempt === maxRetries) {
        return null;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return null;
};

// Delete image from Supabase Storage
export const deleteImage = async (url: string, bucket: string = 'food-photos'): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};
export type ProgressPhoto = Database['public']['Tables']['progress_photos']['Row'];
export type NewProgressPhoto = Database['public']['Tables']['progress_photos']['Insert'];
export type UpdateProgressPhoto = Database['public']['Tables']['progress_photos']['Update'];