// components/VoiceRecorder/VoiceRecorder.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Mic, Send, X, Pause, Play } from 'lucide-react-native';

// Type definitions
interface AudioData {
  uri: string;
  duration: number;
  size: number;
  name: string;
  type: string;
}

interface Colors {
  primary: string;
  background: string;
  text: string;
  textSecondary: string;
  error: string;
  border: string;
}

interface VoiceRecorderProps {
  onSendAudio: (audioData: AudioData) => Promise<void> | void;
  onCancel?: () => void;
  colors: Colors;
  style?: ViewStyle;
}

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onSendAudio, 
  onCancel, 
  colors,
  style 
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  // Animation values
  const recordingAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Setup audio mode
    const setupAudio = async (): Promise<void> => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: false,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
        });
      } catch (error) {
        console.error('Failed to setup audio mode:', error);
      }
    };

    setupAudio();

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [sound, recording]);

  // Start recording animation
  const startRecordingAnimation = (): void => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Stop recording animation
  const stopRecordingAnimation = (): void => {
    recordingAnimation.stopAnimation();
    recordingAnimation.setValue(0);
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  // Start timer
  const startTimer = (): void => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // Stop timer
  const stopTimer = (): void => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Request permissions
  const getPermissions = async (): Promise<boolean> => {
    if (permissionResponse?.status !== 'granted') {
      const permission = await requestPermission();
      return permission.granted;
    }
    return true;
  };

  // Start recording
  const startRecording = async (): Promise<void> => {
    try {
      const hasPermission = await getPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant microphone permission to record audio messages.'
        );
        return;
      }

      // Recording options
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      // Create and start recording
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(recordingOptions);
      
      newRecording.setOnRecordingStatusUpdate((status: Audio.RecordingStatus) => {
        // You can handle recording status updates here if needed
        console.log('Recording status:', status);
      });

      await newRecording.startAsync();
      
      setRecording(newRecording);
      setRecordingStatus('recording');
      setRecordingTime(0);
      setAudioUri(null);
      
      startRecordingAnimation();
      startTimer();

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  // Stop recording
  const stopRecording = async (): Promise<void> => {
    if (!recording) return;

    try {
      setRecordingStatus('stopped');
      stopRecordingAnimation();
      stopTimer();

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setAudioUri(uri);
      setRecording(null);
      
      console.log('Recording saved to:', uri);
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording.');
    }
  };

  // Cancel recording
  const cancelRecording = async (): Promise<void> => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      setRecordingStatus('idle');
      setRecordingTime(0);
      setAudioUri(null);
      setIsPlaying(false);
      
      stopRecordingAnimation();
      stopTimer();
      
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  // Play/pause recorded audio
  const togglePlayback = async (): Promise<void> => {
    if (!audioUri) return;

    try {
      if (isPlaying) {
        // Pause playback
        if (sound) {
          await sound.pauseAsync();
          setIsPlaying(false);
        }
      } else {
        // Start playback
        if (sound) {
          await sound.playAsync();
          setIsPlaying(true);
        } else {
          // Create new sound instance
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true }
          );
          
          newSound.setOnPlaybackStatusUpdate((status: Audio.AVPlaybackStatus) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
            }
          });
          
          setSound(newSound);
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Playback Error', 'Failed to play audio.');
    }
  };

  // Send audio
  const sendAudio = async (): Promise<void> => {
    if (!audioUri) return;

    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      
      const audioData: AudioData = {
        uri: audioUri,
        duration: recordingTime,
        size: fileInfo.size || 0,
        name: `voice_${Date.now()}.m4a`,
        type: 'audio/m4a',
      };

      if (onSendAudio) {
        await onSendAudio(audioData);
      }

      // Reset component
      await cancelRecording();
      
    } catch (error) {
      console.error('Failed to send audio:', error);
      Alert.alert('Send Error', 'Failed to send audio message.');
    }
  };

  // Render based on current state
  const renderContent = (): React.ReactNode => {
    switch (recordingStatus) {
      case 'idle':
        return (
          <TouchableOpacity
            style={[styles.recordButton, { backgroundColor: colors.primary }]}
            onPress={startRecording}
          >
            <Mic size={24} color={colors.background} />
          </TouchableOpacity>
        );

      case 'recording':
        return (
          <View style={styles.recordingContainer}>
            <Animated.View
              style={[
                styles.recordingButton,
                {
                  backgroundColor: colors.error,
                  transform: [{ scale: pulseAnimation }],
                  opacity: recordingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
              ]}
            >
              <View style={styles.recordingDot} />
            </Animated.View>
            
            <View style={styles.recordingInfo}>
              <Text style={[styles.recordingText, { color: colors.error }]}>
                Recording...
              </Text>
              <Text style={[styles.timeText, { color: colors.text }]}>
                {formatTime(recordingTime)}
              </Text>
            </View>

            <View style={styles.recordingActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.border }]}
                onPress={cancelRecording}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={stopRecording}
              >
                <Send size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'stopped':
        return (
          <View style={styles.previewContainer}>
            <TouchableOpacity
              style={[
                styles.playButton,
                { 
                  backgroundColor: isPlaying ? colors.error : colors.primary 
                }
              ]}
              onPress={togglePlayback}
            >
              {isPlaying ? (
                <Pause size={20} color={colors.background} />
              ) : (
                <Play size={20} color={colors.background} />
              )}
            </TouchableOpacity>

            <View style={styles.previewInfo}>
              <Text style={[styles.previewText, { color: colors.text }]}>
                Voice message
              </Text>
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {formatTime(recordingTime)}
              </Text>
            </View>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.border }]}
                onPress={cancelRecording}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={sendAudio}
              >
                <Send size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recordButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recordingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  recordingInfo: {
    flex: 1,
    marginLeft: 16,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 14,
    marginTop: 2,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
    marginLeft: 16,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VoiceRecorder;