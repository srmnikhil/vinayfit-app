import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  RotateCcw,
  Settings
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CustomVideoPlayerProps {
  videoUrl: string;
  exerciseName: string;
  onVideoEnd?: () => void;
  autoPlay?: boolean;
  showControls?: boolean;
}

export default function CustomVideoPlayer({
  videoUrl,
  exerciseName,
  onVideoEnd,
  autoPlay = false,
  showControls = true,
}: CustomVideoPlayerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  // State management
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  // Create the video player instance
  const player = useVideoPlayer(videoUrl, player => {
    // Set up initial state
    player.muted = isMuted;
    
    // Auto play if requested
    if (autoPlay) {
      player.play();
      setIsPlaying(true);
    }
    
    // Add event listeners for video status changes
    player.addListener('statusChange', (status) => {
      console.log('Video status changed:', status);
      
      if (status.status === 'readyToPlay') {
        setIsLoading(false);
        setDuration(status.durationMillis || 0);
      } else if (status.status === 'loading') {
        setIsLoading(true);
      } else if (status.status === 'error') {
        setIsLoading(false);
        console.error('Video error:', status.error);
      }
    });

    player.addListener('playbackStatusUpdate', (status) => {
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying || false);
      
      // Handle video end
      if (status.didJustFinish && onVideoEnd) {
        onVideoEnd();
      }
    });
  });

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    if (showControlsOverlay && showControls) {
      const timeout = setTimeout(() => {
        setShowControlsOverlay(false);
      }, 3000);
      setControlsTimeout(timeout);
    }

    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [showControlsOverlay, showControls]);

  const togglePlayPause = async () => {
    if (!player) return;
    
    try {
      if (isPlaying) {
        await player.pause();
      } else {
        await player.play();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const toggleMute = () => {
    if (!player) return;
    
    const newMutedState = !isMuted;
    player.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsFullscreen(true);
        StatusBar.setHidden(true);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        setIsFullscreen(false);
        StatusBar.setHidden(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const replayVideo = async () => {
    if (!player) return;
    
    try {
      await player.replay();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error replaying video:', error);
    }
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const showControlsHandler = () => {
    setShowControlsOverlay(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
  };

  const renderControls = () => {
    if (!showControls || !showControlsOverlay) return null;

    const progress = duration > 0 ? position / duration : 0;

    return (
      <View style={styles.controlsOverlay}>
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
          style={styles.controlsGradient}
        >
          {/* Top Controls */}
          <View style={styles.topControls}>
            <Text style={styles.exerciseTitle}>{exerciseName}</Text>
            <TouchableOpacity onPress={toggleFullscreen} style={styles.controlButton}>
              {isFullscreen ? (
                <Minimize size={24} color="#FFFFFF" />
              ) : (
                <Maximize size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Center Play/Pause */}
          <View style={styles.centerControls}>
            <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
              {isPlaying ? (
                <Pause size={48} color="#FFFFFF" />
              ) : (
                <Play size={48} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <View style={styles.progressBar}>
                <View style={styles.progressBackground}>
                  <View 
                    style={[styles.progressFill, { width: `${progress * 100}%` }]} 
                  />
                </View>
              </View>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
            
            <View style={styles.bottomRightControls}>
              <TouchableOpacity onPress={replayVideo} style={styles.controlButton}>
                <RotateCcw size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
                {isMuted ? (
                  <VolumeX size={20} color="#FFFFFF" />
                ) : (
                  <Volume2 size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const videoComponent = (
    <View style={isFullscreen ? styles.fullscreenContainer : styles.videoContainer}>
      <TouchableOpacity 
        style={styles.videoTouchable}
        onPress={showControlsHandler}
        activeOpacity={1}
      >
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false} // Disable native controls to use custom ones
          allowsFullscreen={false} // Handle fullscreen manually
        />
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}
        
        {renderControls()}
      </TouchableOpacity>
    </View>
  );

  if (isFullscreen) {
    return (
      <Modal
        visible={isFullscreen}
        animationType="fade"
        onRequestClose={toggleFullscreen}
      >
        {videoComponent}
      </Modal>
    );
  }

  return videoComponent;
}

const createStyles = (colors: any) => StyleSheet.create({
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    fontFamily: 'Inter-Medium',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controlsGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  bottomRightControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});