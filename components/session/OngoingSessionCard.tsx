import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Timer, User, MapPin } from 'lucide-react-native';
import { TrainingSession } from '@/types/workout';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';

interface OngoingSessionCardProps {
  session: TrainingSession & { timeRemaining?: number | null };
  onPress?: () => void;
  onTestCompletion?: () => void; // For testing completion prompt
}

export default function OngoingSessionCard({
  session,
  onPress,
  onTestCompletion,
}: OngoingSessionCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const sessionName = session.template?.name || session.type || 'Training Session';
  const timeRemaining = session.timeRemaining;
  const trainerName = session.trainer?.full_name || 'Trainer';

  const formatTimeRemaining = (minutes: number | null) => {
    if (minutes === null) return 'Unknown';
    if (minutes <= 0) return 'Session ending soon';
    if (minutes < 60) return `${minutes} min remaining`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m remaining`;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#16A085', '#27AE60'] : ['#48C9B0', '#58D68D']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Live indicator */}
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE SESSION</Text>
        </View>

        {/* Session info */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName}>{sessionName}</Text>
          
          <View style={styles.timeContainer}>
            <Timer size={16} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.timeText}>
              {formatTimeRemaining(timeRemaining)}
            </Text>
          </View>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <User size={14} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.metaText}>{trainerName}</Text>
            </View>
            
            {session.location && (
              <View style={styles.metaItem}>
                <MapPin size={14} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.metaText}>{session.location}</Text>
              </View>
            )}
            
            <View style={styles.metaItem}>
              <Clock size={14} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.metaText}>
                {session.scheduled_time || 'No time set'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionContainer}>
          {session.meeting_link && (
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Session</Text>
            </TouchableOpacity>
          )}
          
          {/* Test button for development */}
          {__DEV__ && onTestCompletion && (
            <TouchableOpacity 
              style={[styles.testButton, { marginTop: 8 }]}
              onPress={onTestCompletion}
            >
              <Text style={styles.testButtonText}>Test Completion</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress bar */}
        {timeRemaining !== null && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(0, Math.min(100, 
                      ((session.duration_minutes || 60) - timeRemaining) / (session.duration_minutes || 60) * 100
                    ))}%`
                  }
                ]}
              />
            </View>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  liveIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginRight: 6,
  },
  liveText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sessionInfo: {
    marginBottom: 16,
  },
  sessionName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  actionContainer: {
    alignItems: 'flex-start',
  },
  joinButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  testButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});
