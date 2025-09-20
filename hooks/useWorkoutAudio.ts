import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface WorkoutAudioOptions {
  enableSounds?: boolean;
  enableVoice?: boolean;
  volume?: number;
}

export const useWorkoutAudio = (options: WorkoutAudioOptions = {}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [volume, setVolume] = useState(options.volume || 0.7);
  const [enableSounds, setEnableSounds] = useState(options.enableSounds !== false);
  const [enableVoice, setEnableVoice] = useState(options.enableVoice !== false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  const soundObjects = useRef<{ [key: string]: Audio.Sound | null }>({});
  const isPlayingRef = useRef(false);

  useEffect(() => {
    initializeAudio();
    return () => {
      cleanup();
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionsGranted(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request audio permissions:', error);
      return false;
    }
  };

  const initializeAudio = async () => {
    try {
      // Request permissions first
      const permissionsOk = await requestPermissions();
      if (!permissionsOk) {
        console.warn('Audio permissions not granted');
        return;
      }

      // Configure audio mode with better settings
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: 1, // DO_NOT_MIX
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1, // DO_NOT_MIX
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      // Load sounds
      await loadSounds();
      setIsInitialized(true);
      console.log('Audio initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const loadSounds = async () => {
    try {
      const sounds = {
        ready: { frequency: 800, duration: 0.5 },
        rest: { frequency: 400, duration: 0.3 },
        nextExercise: { frequency: 600, duration: 0.4 },
        completion: { frequency: 1000, duration: 1.0 },
        pause: { frequency: 300, duration: 0.3 },
        resume: { frequency: 700, duration: 0.3 },
      };
      
      for (const [soundName, config] of Object.entries(sounds)) {
        try {
          if (Platform.OS === 'web') {
            // For web, we'll use Web Audio API directly
            soundObjects.current[soundName] = null;
          } else {
            // For native platforms, create simple audio files
            const soundUri = createBeepSound(config.frequency, config.duration);
            if (soundUri) {
              const { sound } = await Audio.Sound.createAsync(
                { uri: soundUri },
                { shouldPlay: false, volume }
              );
              soundObjects.current[soundName] = sound;
            }
          }
        } catch (error) {
          console.warn(`Failed to load ${soundName} sound:`, error);
          soundObjects.current[soundName] = null;
        }
      }
    } catch (error) {
      console.error('Failed to load sounds:', error);
    }
  };

  const createBeepSound = (frequency: number, duration: number): string => {
    // Create a simple WAV file with proper headers
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // Generate tone with envelope
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3); // Fade out
      const sample = Math.sin(2 * Math.PI * frequency * t) * envelope;
      const value = Math.floor(sample * 32767 * 0.5); // 50% volume
      view.setInt16(44 + i * 2, value, true);
    }
    
    // Convert to data URI
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return `data:audio/wav;base64,${btoa(binary)}`;
  };

  const playWebSound = (frequency: number, duration: number) => {
    if (typeof window === 'undefined' || !window.AudioContext) {
      console.warn('Web Audio API not available');
      return;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
      
      setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
      }, duration * 1000 + 100);
    } catch (error) {
      console.error('Failed to play web sound:', error);
    }
  };

  const playSound = async (soundName: string) => {
    if (!enableSounds || !isInitialized) return;

    try {
      if (Platform.OS === 'web') {
        // Use Web Audio API for web
        const frequencies = {
          ready: 800,
          rest: 400,
          nextExercise: 600,
          completion: 1000,
          pause: 300,
          resume: 700,
        };
        const durations = {
          ready: 0.5,
          rest: 0.3,
          nextExercise: 0.4,
          completion: 1.0,
          pause: 0.3,
          resume: 0.3,
        };
        
        const frequency = frequencies[soundName as keyof typeof frequencies] || 500;
        const duration = durations[soundName as keyof typeof durations] || 0.3;
        
        playWebSound(frequency, duration);
      } else {
        // Use Expo Audio for native platforms
        const sound = soundObjects.current[soundName];
        if (sound) {
          await sound.stopAsync();
          await sound.setPositionAsync(0);
          await sound.playAsync();
        } else {
          console.warn(`Sound ${soundName} not loaded`);
        }
      }
    } catch (error) {
      console.error(`Failed to play ${soundName} sound:`, error);
    }
  };

  const triggerHapticFeedback = async (type: 'light' | 'medium' | 'heavy' | 'success') => {
    if (Platform.OS === 'web') return;
    
    try {
      const Haptics = (await import('expo-haptics')).default;
      
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  };

  const playReadySound = async () => {
    await triggerHapticFeedback('medium');
    await playSound('ready');
    if (enableVoice) {
      setTimeout(() => speakText('Get ready!'), 200);
    }
  };

  const playRestSound = async () => {
    await triggerHapticFeedback('light');
    await playSound('rest');
    if (enableVoice) {
      setTimeout(() => speakText('Rest time'), 300);
    }
  };

  const playNextExerciseSound = async () => {
    await triggerHapticFeedback('heavy');
    await playSound('nextExercise');
    if (enableVoice) {
      setTimeout(() => speakText('Next exercise'), 200);
    }
  };

  const playCompletionSound = async () => {
    await triggerHapticFeedback('success');
    await playSound('completion');
    if (enableVoice) {
      setTimeout(() => speakText('Workout complete! Great job!'), 500);
    }
  };

  const playPauseSound = async () => {
    await triggerHapticFeedback('light');
    await playSound('pause');
    if (enableVoice) {
      setTimeout(() => speakText('Workout paused'), 200);
    }
  };

  const playResumeSound = async () => {
    await triggerHapticFeedback('medium');
    await playSound('resume');
    if (enableVoice) {
      setTimeout(() => speakText('Resuming workout'), 200);
    }
  };

  const speakText = (text: string) => {
    if (!enableVoice) return;

    try {
      Speech.stop();
      
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        volume: volume,
        onStart: () => console.log('Started speaking'),
        onDone: () => console.log('Finished speaking'),
        onError: (error) => console.error('Speech error:', error),
      });
    } catch (error) {
      console.error('Failed to speak text:', error);
    }
  };

  const stopSpeaking = () => {
    try {
      Speech.stop();
    } catch (error) {
      console.error('Failed to stop speaking:', error);
    }
  };

  const cleanup = async () => {
    try {
      stopSpeaking();
      
      for (const soundName in soundObjects.current) {
        const sound = soundObjects.current[soundName];
        if (sound) {
          await sound.unloadAsync();
        }
      }
      soundObjects.current = {};
      setIsInitialized(false);
    } catch (error) {
      console.error('Failed to cleanup audio:', error);
    }
  };

  const updateVolume = async (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    
    for (const soundName in soundObjects.current) {
      const sound = soundObjects.current[soundName];
      if (sound) {
        try {
          await sound.setVolumeAsync(clampedVolume);
        } catch (error) {
          console.warn(`Failed to update volume for ${soundName}:`, error);
        }
      }
    }
  };

  const testAudio = async () => {
    console.log('Testing audio system...');
    console.log('Initialized:', isInitialized);
    console.log('Permissions:', permissionsGranted);
    console.log('Platform:', Platform.OS);
    
    if (!isInitialized) {
      await initializeAudio();
    }
    
    await playSound('ready');
    
    setTimeout(async () => {
      await triggerHapticFeedback('medium');
      speakText('Audio test successful');
    }, 300);
  };

  return {
    isInitialized,
    permissionsGranted,
    enableSounds,
    enableVoice,
    volume,
    setEnableSounds,
    setEnableVoice,
    setVolume: updateVolume,
    playReadySound,
    playRestSound,
    playNextExerciseSound,
    playCompletionSound,
    playPauseSound,
    playResumeSound,
    speakText,
    stopSpeaking,
    cleanup,
    testAudio,
  };
};