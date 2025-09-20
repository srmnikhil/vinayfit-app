import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { MediaItem, MediaComponentProps } from './types';
import { requestMediaPermissions, processMediaItem } from './mediaUtils';

const VideoMedia: React.FC<MediaComponentProps> = ({
  onMediaSelect,
  onError,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  maxDuration = 300, // 5 minutes in seconds
  allowedTypes = ['.mp4', '.mov', '.avi', '.mkv'],
  colors = {
    primary: '#007AFF',
    background: '#fff',
    text: '#000',
    textSecondary: '#999',
    border: '#e1e1e1',
    error: '#FF3B30',
  },
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await requestMediaPermissions('library');
        setPermissionStatus(status === 'granted');
      } catch (error) {
        console.error('Error requesting media library permission:', error);
        onError?.(error as Error);
        setPermissionStatus(false);
      }
    })();
  }, []);

  const pickVideo = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
        videoMaxDuration: maxDuration,
      });

      if (result.canceled) {
        return;
      }

      const video = result.assets?.[0];
      if (!video) return;

      // Process the selected video
      const mediaItem = await processMediaItem(
        { 
          uri: video.uri, 
          duration: video.duration,
          width: video.width,
          height: video.height,
        },
        'video',
        { 
          maxFileSize,
          durationLimit: maxDuration,
        }
      );
      
      // Validate file type
      if (!allowedTypes.some(type => 
        type.toLowerCase() === `.${video.uri.split('.').pop()?.toLowerCase()}` ||
        type.toLowerCase() === video.mimeType?.toLowerCase()
      )) {
        throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      }
      
      setSelectedVideo(mediaItem);
      onMediaSelect(mediaItem);
      
    } catch (error) {
      console.error('Error picking video:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeVideo = () => {
    setSelectedVideo(null);
  };

  if (permissionStatus === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (permissionStatus === false) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={48} color={colors.error} style={styles.permissionIcon} />
        <Text style={[styles.permissionText, { color: colors.text }]}>
          No access to video library. Please enable it in your device settings.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {selectedVideo ? (
          <View style={styles.videoContainer}>
            <View style={styles.videoThumbnail}>
              <Image 
                source={{ uri: selectedVideo.thumbnail || 'https://via.placeholder.com/300x200?text=Video+Thumbnail' }} 
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
              <View style={styles.playButton}>
                <Ionicons name="play" size={48} color="white" />
              </View>
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.error }]}
                onPress={removeVideo}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.videoInfo}>
              <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedVideo.name || 'Video'}
              </Text>
              <Text style={[styles.videoDuration, { color: colors.textSecondary }]}>
                {formatDuration(selectedVideo.duration || 0)}
              </Text>
              <Text style={[styles.videoSize, { color: colors.textSecondary }]}>
                {formatFileSize(selectedVideo.size || 0)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="videocam-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              No video selected
            </Text>
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Max duration: {Math.floor(maxDuration / 60)} minutes
            </Text>
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Max size: {maxFileSize / (1024 * 1024)}MB
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={pickVideo}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Select Video</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Helper function to format duration in seconds to MM:SS
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Helper function to format file size in bytes to KB/MB
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionIcon: {
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  videoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  videoThumbnail: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 16,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    width: '100%',
    paddingHorizontal: 8,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoDuration: {
    fontSize: 14,
    marginBottom: 2,
  },
  videoSize: {
    fontSize: 14,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  button: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VideoMedia;
