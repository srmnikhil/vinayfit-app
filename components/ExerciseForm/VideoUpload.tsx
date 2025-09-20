import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { Upload, Video, X, ExternalLink } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/utils/workoutUtils';
import { validateVideoFile, formatFileSize } from '@/utils/videoUtils';

interface VideoUploadProps {
  videoUrl: string;
  onVideoChange: (url: string) => void;
  thumbnailUrl: string;
  onThumbnailChange: (url: string) => void;
  colors: any;
}

export function VideoUpload({
  videoUrl,
  onVideoChange,
  thumbnailUrl,
  onThumbnailChange,
  colors,
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const styles = createStyles(colors);

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        // Validate file
        const validation = validateVideoFile(file);
        if (!validation.isValid) {
          Alert.alert('Invalid File', validation.error);
          return;
        }

        await uploadVideo(file);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video file');
    }
  };

  const uploadVideo = async (file: any) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${generateId()}.${fileExt}`;

      // Convert file to blob for upload
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType,
        name: file.name,
      } as any);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('exercise-videos')
        .upload(fileName, formData, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        Alert.alert('Upload Failed', error.message);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('exercise-videos')
        .getPublicUrl(data.path);

      onVideoChange(urlData.publicUrl);
      
      // Generate thumbnail from video (you might want to implement this)
      // For now, we'll use a placeholder or let user upload separately
      
      Alert.alert('Success', 'Video uploaded successfully!');
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeVideo = async () => {
    if (videoUrl && videoUrl.includes('supabase')) {
      try {
        // Extract file path from URL
        const urlParts = videoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const filePath = `${user.id}/${fileName}`;
          await supabase.storage
            .from('exercise-videos')
            .remove([filePath]);
        }
      } catch (error) {
        console.error('Error removing video:', error);
      }
    }
    
    onVideoChange('');
    onThumbnailChange('');
  };

  const pickThumbnail = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        await uploadThumbnail(file);
      }
    } catch (error) {
      console.error('Error picking thumbnail:', error);
      Alert.alert('Error', 'Failed to pick thumbnail image');
    }
  };

  const uploadThumbnail = async (file: any) => {
    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/thumbnails/${generateId()}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType,
        name: file.name,
      } as any);

      const { data, error } = await supabase.storage
        .from('exercise-images')
        .upload(fileName, formData);

      if (error) {
        Alert.alert('Upload Failed', error.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('exercise-images')
        .getPublicUrl(data.path);

      onThumbnailChange(urlData.publicUrl);
      Alert.alert('Success', 'Thumbnail uploaded successfully!');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      Alert.alert('Error', 'Failed to upload thumbnail');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Video & Thumbnail</Text>
      
      {/* Video Section */}
      <View style={styles.uploadSection}>
        <Text style={styles.uploadLabel}>Exercise Video</Text>
        
        {videoUrl ? (
          <View style={styles.uploadedFile}>
            <View style={styles.fileInfo}>
              <Video size={20} color={colors.primary} />
              <Text style={styles.fileName} numberOfLines={1}>
                {videoUrl.includes('youtube') ? 'YouTube Video' : 'Uploaded Video'}
              </Text>
              {videoUrl.includes('youtube') && (
                <TouchableOpacity
                  style={styles.externalLink}
                  onPress={() => {/* Open YouTube link */}}
                >
                  <ExternalLink size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={removeVideo}
            >
              <X size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickVideo}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Upload size={20} color={colors.primary} />
            )}
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Text>
          </TouchableOpacity>
        )}
        
        {uploading && uploadProgress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${uploadProgress}%` }]} 
              />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        )}
        
        <Text style={styles.uploadHint}>
          Upload MP4, MOV, or AVI files up to 100MB
        </Text>
      </View>

      {/* Thumbnail Section */}
      <View style={styles.uploadSection}>
        <Text style={styles.uploadLabel}>Thumbnail Image</Text>
        
        {thumbnailUrl ? (
          <View style={styles.thumbnailContainer}>
            <Image source={{ uri: thumbnailUrl }} style={styles.thumbnailImage} />
            <TouchableOpacity
              style={styles.thumbnailRemove}
              onPress={() => onThumbnailChange('')}
            >
              <X size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickThumbnail}
            disabled={uploading}
          >
            <Upload size={20} color={colors.primary} />
            <Text style={styles.uploadButtonText}>Upload Thumbnail</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.uploadHint}>
          Upload JPG, PNG, or WebP images for video thumbnail
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  uploadButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
  },
  uploadedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  fileName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  externalLink: {
    padding: 4,
  },
  removeButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 35,
  },
  uploadHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  thumbnailContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  thumbnailImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
  },
  thumbnailRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
});