import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useWorkoutAudio } from '@/hooks/useWorkoutAudio';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';

export const AudioDebugger = () => {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme as 'light' | 'dark' | null);
  const [isVisible, setIsVisible] = useState(false);
  
  const {
    isInitialized,
    permissionsGranted,
    enableSounds,
    enableVoice,
    volume,
    playReadySound,
    playRestSound,
    playNextExerciseSound,
    playCompletionSound,
    playPauseSound,
    playResumeSound,
    speakText,
    testAudio,
  } = useWorkoutAudio();

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 100,
      right: 20,
      zIndex: 1000,
    },
    toggleButton: {
      backgroundColor: colors.primary,
      borderRadius: 25,
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    debugPanel: {
      position: 'absolute',
      bottom: 60,
      right: 0,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      minWidth: 200,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    debugTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    statusText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    testButton: {
      backgroundColor: colors.primary,
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    testButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    soundButton: {
      backgroundColor: colors.secondary,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginBottom: 4,
    },
    soundButtonText: {
      color: 'white',
      fontSize: 10,
      textAlign: 'center',
    },
  });

  const handleSoundTest = async (soundName: string, soundFunction: () => Promise<void>) => {
    try {
      await soundFunction();
      Alert.alert('Success', `${soundName} sound played successfully!`);
    } catch (error) {
      Alert.alert('Error', `Failed to play ${soundName}: ${error}`);
    }
  };

  if (!isVisible) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setIsVisible(true)}
        >
          <Text style={styles.toggleText}>🔊</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.debugPanel}>
        <Text style={styles.debugTitle}>Audio Debug</Text>
        
        <Text style={styles.statusText}>
          Initialized: {isInitialized ? '✅' : '❌'}
        </Text>
        <Text style={styles.statusText}>
          Permissions: {permissionsGranted ? '✅' : '❌'}
        </Text>
        <Text style={styles.statusText}>
          Sounds: {enableSounds ? '✅' : '❌'}
        </Text>
        <Text style={styles.statusText}>
          Voice: {enableVoice ? '✅' : '❌'}
        </Text>
        <Text style={styles.statusText}>
          Volume: {Math.round(volume * 100)}%
        </Text>
        
        <TouchableOpacity style={styles.testButton} onPress={testAudio}>
          <Text style={styles.testButtonText}>Test Audio System</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.soundButton}
          onPress={() => handleSoundTest('Ready', playReadySound)}
        >
          <Text style={styles.soundButtonText}>Test Ready</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.soundButton}
          onPress={() => handleSoundTest('Rest', playRestSound)}
        >
          <Text style={styles.soundButtonText}>Test Rest</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.soundButton}
          onPress={() => handleSoundTest('Next Exercise', playNextExerciseSound)}
        >
          <Text style={styles.soundButtonText}>Test Next Exercise</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.soundButton}
          onPress={() => handleSoundTest('Completion', playCompletionSound)}
        >
          <Text style={styles.soundButtonText}>Test Completion</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.soundButton}
          onPress={() => speakText('This is a voice test')}
        >
          <Text style={styles.soundButtonText}>Test Voice</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setIsVisible(false)}
      >
        <Text style={styles.toggleText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};