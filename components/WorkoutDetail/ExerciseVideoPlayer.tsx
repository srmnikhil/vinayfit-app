import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { Play, X, ExternalLink, Volume2, VolumeX } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { extractYouTubeVideoId, getYouTubeThumbnail } from '@/utils/videoUtils';

interface ExerciseVideoPlayerProps {
  exercise: {
    id: string;
    name: string;
    video_url?: string;
    image_url?: string;
  };
  colors: any;
}

export function ExerciseVideoPlayer({ exercise, colors }: ExerciseVideoPlayerProps) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const styles = createStyles(colors);

  const isYouTubeVideo = exercise.video_url ? extractYouTubeVideoId(exercise.video_url) !== null : false;
  const videoId = isYouTubeVideo ? extractYouTubeVideoId(exercise.video_url!) : null;
  
  // Get thumbnail - use YouTube thumbnail if available, otherwise use exercise image
  const thumbnailUrl = isYouTubeVideo && videoId 
    ? getYouTubeThumbnail(videoId, 'high')
    : exercise.image_url;

  const handlePlayVideo = () => {
    if (!exercise.video_url) {
      Alert.alert('No Video', 'This exercise does not have a demonstration video.');
      return;
    }
    setShowVideoModal(true);
  };

  const getEmbedUrl = () => {
    if (!exercise.video_url) return '';
    
    if (isYouTubeVideo && videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&showinfo=0`;
    }
    
    // For uploaded videos, return the direct URL
    return exercise.video_url;
  };

  const renderVideoContent = () => {
    if (isYouTubeVideo) {
      return (
        <WebView
          source={{ uri: getEmbedUrl() }}
          style={styles.webView}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
        />
      );
    } else {
      // For uploaded videos, you might want to use a different video player
      // For now, we'll use WebView as a fallback
      return (
        <WebView
          source={{ uri: exercise.video_url! }}
          style={styles.webView}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
        />
      );
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.videoContainer} onPress={handlePlayVideo}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Play size={24} color={colors.textSecondary} />
          </View>
        )}
        
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>

        {exercise.video_url && (
          <View style={styles.videoIndicator}>
            {isYouTubeVideo ? (
              <Text style={styles.videoType}>YT</Text>
            ) : (
              <Text style={styles.videoType}>HD</Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Video Modal */}
      <Modal
        visible={showVideoModal}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {exercise.name}
            </Text>
            <View style={styles.modalActions}>
              {isYouTubeVideo && (
                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX size={20} color={colors.text} />
                  ) : (
                    <Volume2 size={20} color={colors.text} />
                  )}
                </TouchableOpacity>
              )}
              
              {isYouTubeVideo && (
                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    // Open in YouTube app or browser
                    Alert.alert('Open in YouTube', 'This will open the video in YouTube app or browser.');
                  }}
                >
                  <ExternalLink size={20} color={colors.text} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.modalAction}
                onPress={() => setShowVideoModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.videoPlayerContainer}>
            {renderVideoContent()}
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  videoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
  },
  placeholderThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  playButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  videoType: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 50, // Account for status bar
  },
  modalTitle: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginRight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
  },
});