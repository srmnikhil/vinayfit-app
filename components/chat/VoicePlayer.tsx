// components/VoiceRecorder/VoicePlayer.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Alert,
  ViewStyle,
} from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';

// Type definitions
interface Colors {
  primary: string;
  background: string;
  text: string;
  textSecondary: string;
  error: string;
  border: string;
}

interface VoicePlayerProps {
  audioUri: string;
  duration?: number;
  colors: Colors;
  isOwnMessage?: boolean;
  style?: ViewStyle;
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ 
  audioUri, 
  duration = 0, 
  colors,
  isOwnMessage = false,
  style 
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [playbackDuration, setPlaybackDuration] = useState<number>(duration * 1000); // Convert to milliseconds

  // Animation for waveform
  const waveformAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Cleanup sound when component unmounts or audioUri changes
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound, audioUri]);

  // Format time in mm:ss
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Start waveform animation
  const startWaveformAnimation = (): void => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveformAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(waveformAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Stop waveform animation
  const stopWaveformAnimation = (): void => {
    waveformAnimation.stopAnimation();
    waveformAnimation.setValue(0);
  };

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: Audio.AVPlaybackStatus): void => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis || 0);
      setPlaybackDuration(status.durationMillis || duration * 1000);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
        stopWaveformAnimation();
      }
    }
  };

  // Toggle play/pause
  const togglePlayback = async (): Promise<void> => {
    if (!audioUri) {
      Alert.alert('Error', 'Audio file not available');
      return;
    }

    try {
      if (isPlaying) {
        // Pause current playback
        if (sound) {
          await sound.pauseAsync();
          setIsPlaying(false);
          stopWaveformAnimation();
        }
      } else {
        setIsLoading(true);
        
        if (sound) {
          // Resume existing sound
          await sound.playAsync();
          setIsPlaying(true);
          startWaveformAnimation();
        } else {
          // Create new sound instance
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { 
              shouldPlay: true,
              volume: 1.0,
              rate: 1.0,
              shouldCorrectPitch: true,
            },
            onPlaybackStatusUpdate
          );
          
          setSound(newSound);
          setIsPlaying(true);
          startWaveformAnimation();
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsLoading(false);
      Alert.alert('Playback Error', 'Failed to play audio message');
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = (): number => {
    if (playbackDuration === 0) return 0;
    return (playbackPosition / playbackDuration) * 100;
  };

  // Generate waveform bars (mock data)
  const generateWaveform = (): React.ReactNode[] => {
    const bars: React.ReactNode[] = [];
    const barCount = 20;
    
    for (let i = 0; i < barCount; i++) {
      const height = Math.random() * 20 + 8; // Random height between 8-28
      const isActive = i < (getProgressPercentage() / 100) * barCount;
      
      bars.push(
        <Animated.View
          key={i}
          style={[
            styles.waveformBar,
            {
              height: height,
              backgroundColor: isActive 
                ? (isOwnMessage ? colors.background : colors.primary)
                : (isOwnMessage ? colors.background + '40' : colors.textSecondary + '40'),
              transform: isPlaying && isActive ? [{
                scaleY: waveformAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.2],
                })
              }] : [{ scaleY: 1 }]
            }
          ]}
        />
      );
    }
    
    return bars;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Play/Pause Button */}
      <TouchableOpacity
        style={[
          styles.playButton,
          {
            backgroundColor: isOwnMessage 
              ? colors.background + '20' 
              : colors.primary + '20'
          }
        ]}
        onPress={togglePlayback}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingDot} />
        ) : isPlaying ? (
          <Pause 
            size={20} 
            color={isOwnMessage ? colors.background : colors.primary} 
          />
        ) : (
          <Play 
            size={20} 
            color={isOwnMessage ? colors.background : colors.primary} 
          />
        )}
      </TouchableOpacity>

      {/* Waveform */}
      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {generateWaveform()}
        </View>
        
        {/* Progress indicator */}
        <View 
          style={[
            styles.progressIndicator,
            {
              width: `${getProgressPercentage()}%`,
              backgroundColor: isOwnMessage 
                ? colors.background + '60' 
                : colors.primary + '60'
            }
          ]} 
        />
      </View>

      {/* Duration */}
      <Text 
        style={[
          styles.durationText,
          {
            color: isOwnMessage 
              ? colors.background + 'B3' 
              : colors.textSecondary
          }
        ]}
      >
        {isPlaying ? formatTime(playbackPosition) : formatTime(playbackDuration)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
    paddingVertical: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  waveformContainer: {
    flex: 1,
    height: 32,
    marginRight: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    minHeight: 8,
  },
  progressIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 2,
    opacity: 0.3,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
  },
});

export default VoicePlayer;