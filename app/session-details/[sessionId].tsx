import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  MessageSquare,
  Phone,
  Video,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  X,
  Save,
  Copy,
  Share,
  Star,
  Target,
  Activity,
  Timer,
  Dumbbell,
  Award,
  TrendingUp,
  Heart,
  Zap,
  Link as LinkIcon
} from 'lucide-react-native';
import { Linking } from 'react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams, Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { 
  cancelTrainingSession, 
  rescheduleTrainingSession,
  getTrainingSessionDetails 
} from '@/lib/trainingSessionQueries';

const { width } = Dimensions.get('window');

export default function SessionDetailsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors, colorScheme);
  const { sessionId } = useLocalSearchParams();
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [clientFeedback, setClientFeedback] = useState('');
  const [sessionRating, setSessionRating] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Fetch session data from database
  const fetchSessionData = async () => {
    setLoading(true);
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        setSession(null);
        setLoading(false);
        return;
      }
      console.log('Fetching data for sessionId:', sessionId);

      const data = await getTrainingSessionDetails(sessionId);
      console.log('Data from getTrainingSessionDetails:', JSON.stringify(data, null, 2));

      if (data) {
        const transformedSession = {
          id: data.id,
          clientId: data.client_id,
          clientName: data.client?.full_name || 'Unknown Client',
          clientEmail: data.client?.email || '',
          type: data.session_type || 'Training Session',
          date: data.scheduled_date,
          time: data.scheduled_time,
          duration: data.duration_minutes || 60,
          location: data.location || 'Not specified',
          status: data.status || 'scheduled',
          notes: data.notes || '',
          trainerNotes: data.trainer_notes || '',
          sessionRating: data.session_rating || null,
          clientFeedback: data.client_feedback || null,
          meeting_link: data.meeting_link || null,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          clientAvatar: data.client?.avatar_url || '👤',
          clientPhone: data.client?.phone_number || '',
          clientAge: data.client?.user_metadata?.age || 0,
          clientGoals: data.client?.user_metadata?.fitness_goals || [],
          sessionGoals: data.goals?.map((g: any) => g.goal_description) || [],
          plannedExercises: data.template?.exercises?.map((e: any) => ({
            name: e.exercise.name,
            sets: e.sets_config,
            weight: 'N/A',
            restTime: 'N/A',
            muscleGroups: e.exercise.muscle_groups,
            targetRPE: 'N/A'
          })) || [],
          estimatedCalories: data.template?.estimated_calories || 0,
          difficulty: data.template?.difficulty_level || 'Intermediate',
          equipment: data.template?.equipment_needed || [],
          warmUp: data.template?.warm_up || [],
          coolDown: data.template?.cool_down || [],
          previousSessions: [],
          upcomingSessions: [],
        };
        console.log('Transformed session:', JSON.stringify(transformedSession, null, 2));
        setSession(transformedSession);
      } else {
        console.log('No data returned from getTrainingSessionDetails.');
        setSession(null);
      }
    } catch (error) {
      console.error('Error loading session details:', error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  useEffect(() => {
    if (session) {
      setSessionNotes(session.trainerNotes || '');
      setClientFeedback(session.clientFeedback || '');
      setSessionRating(session.sessionRating || 0);
      setSelectedStatus(session.status);
    }
  }, [session]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.errorTitle}>Loading Session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Session Not Found</Text>
          <Text style={styles.errorText}>The requested session could not be found.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSessionData();
    setRefreshing(false);
  };

  const handleEditSession = () => {
    router.push({ pathname: '/new-session', params: { editSessionId: session.id } });
  };

  const handleDeleteSession = () => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Session deleted successfully');
            router.back();
          },
        },
      ]
    );
  };

  const handleDuplicateSession = () => {
    Alert.alert(
      'Duplicate Session',
      'Create a new session with the same details?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: () => {
            router.push({ pathname: '/new-session', params: { duplicateSessionId: session.id } });
          },
        },
      ]
    );
  };

  const handleRescheduleSession = () => {
    // Navigate to the new-session screen with the editSessionId parameter
    router.push({ 
      pathname: '/new-session', 
      params: { 
        editSessionId: session.id,
        clientId: session.clientId,
        sessionType: session.type
      } 
    });
  };

  const handleContactClient = (method: 'message' | 'call' | 'video') => {
    switch (method) {
      case 'message':
        router.push({ pathname: '/chat/[id]', params: { id: session.clientId } });
        break;
      case 'call':
        Alert.alert('Call Client', `Calling ${session.clientName}...`);
        break;
      case 'video':
        Alert.alert('Video Call', `Starting video call with ${session.clientName}...`);
        break;
    }
  };

  const handleUpdateStatus = async () => {
    try {
      // Save the original status for rollback if API call fails
      const originalStatus = session?.status;
      
      // Optimistically update UI
      setSession((prev: any) => (prev ? { ...prev, status: selectedStatus } : null));
      setShowStatusModal(false);
      
      // Call the appropriate API based on the selected status
      let success = false;
      if (selectedStatus === 'cancelled') {
        success = await cancelTrainingSession(session.id, sessionNotes || 'Cancelled by trainer');
      } else if (selectedStatus === 'confirmed') {
        // For confirmed status, call the confirmTrainingSession function which generates a meeting link
        const { confirmTrainingSession } = await import('@/lib/trainingSessionQueries');
        success = await confirmTrainingSession(session.id);
        // Reload session data to get the new meeting link
        if (success) {
          await fetchSessionData();
        }
      } else if (selectedStatus === 'scheduled' || selectedStatus === 'completed' || selectedStatus === 'no_show') {
        // For other status updates, we'll do a simple update
        const { error } = await supabase
          .from('training_sessions')
          .update({
            status: selectedStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.id);
        
        success = !error;
      }
      
      if (success) {
        Alert.alert('Success', 'Session status updated successfully');
      } else {
        // Rollback the UI change if the API call failed
        setSession((prev: any) => prev ? { ...prev, status: originalStatus } : null);
        Alert.alert('Error', 'Failed to update session status');
      }
    } catch (error) {
      console.error('Error updating session status:', error);
      Alert.alert('Error', 'Failed to update session status');
    }
  };

  const handleSaveNotes = async () => {
    try {
      // Save original notes for rollback if needed
      const originalNotes = session?.trainerNotes;
      
      // Optimistically update UI
      setSession((prev: any) => (prev ? { ...prev, trainerNotes: sessionNotes } : null));
      setShowNotesModal(false);
      
      // Update in database
      const { error } = await supabase
        .from('training_sessions')
        .update({
          trainer_notes: sessionNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);
      
      if (error) {
        console.error('Error updating trainer notes:', error);
        // Rollback UI if there was an error
        setSession((prev: any) => prev ? { ...prev, trainerNotes: originalNotes } : null);
        Alert.alert('Error', 'Failed to update session notes');
      } else {
        Alert.alert('Success', 'Session notes updated successfully');
      }
    } catch (error) {
      console.error('Error in handleSaveNotes:', error);
      Alert.alert('Error', 'Failed to update session notes');
    }
  };

  const handleSaveFeedback = async () => {
    try {
      // Save original feedback for rollback if needed
      const originalFeedback = session?.clientFeedback;
      const originalRating = session?.sessionRating;
      
      // Optimistically update UI
      setSession((prev: any) => (prev ? { 
        ...prev, 
        clientFeedback: clientFeedback,
        sessionRating: sessionRating 
      } : null));
      setShowFeedbackModal(false);
      
      // Update in database
      const { error } = await supabase
        .from('training_sessions')
        .update({
          client_feedback: clientFeedback,
          session_rating: sessionRating,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);
      
      if (error) {
        console.error('Error updating client feedback:', error);
        // Rollback UI if there was an error
        setSession((prev: any) => prev ? { 
          ...prev, 
          clientFeedback: originalFeedback,
          sessionRating: originalRating 
        } : null);
        Alert.alert('Error', 'Failed to update session feedback');
      } else {
        Alert.alert('Success', 'Session feedback updated successfully');
      }
    } catch (error) {
      console.error('Error in handleSaveFeedback:', error);
      Alert.alert('Error', 'Failed to update session feedback');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return colors.primary;
      case 'confirmed': return colors.success;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'no_show': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    // Always use white color for icons in colored status badges
    const iconColor = '#FFFFFF';
    switch (status) {
      case 'scheduled': return <Clock size={16} color={iconColor} />;
      case 'confirmed': return <CheckCircle size={16} color={iconColor} />;
      case 'completed': return <CheckCircle size={16} color={iconColor} />;
      case 'cancelled': return <XCircle size={16} color={iconColor} />;
      case 'no_show': return <AlertCircle size={16} color={iconColor} />;
      default: return <Clock size={16} color={iconColor} />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not set';
    
    try {
      // Handle different date formats
      let date: Date;
      
      // If it's just a date without time (YYYY-MM-DD)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Add time to avoid timezone issues
        date = new Date(dateString + 'T12:00:00');
      } else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      
      // Check if date is within reasonable bounds
      const year = date.getFullYear();
      if (year < 1900 || year > 2100) {
        console.error('Date out of bounds:', dateString, 'Year:', year);
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Time not set';
    
    try {
      // Handle different time formats
      const parts = timeString.split(':');
      if (parts.length < 2) {
        console.error('Invalid time format:', timeString);
        return 'Invalid Time';
      }
      
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      
      // Validate hours and minutes
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.error('Invalid time values:', timeString);
        return 'Invalid Time';
      }
      
      // Create a date object for today with the specified time
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return 'Invalid Time';
    }
  };

  const renderStarRating = (rating: number, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starRating}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress?.(star)}
            disabled={!onPress}
          >
            <Star 
              size={20} 
              color={star <= rating ? colors.warning : colors.border}
              fill={star <= rating ? colors.warning : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Details</Text>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Session Options',
            'Choose an action',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Edit Session', onPress: handleEditSession },
              { text: 'Reschedule Session', onPress: handleRescheduleSession },
              { text: 'Duplicate Session', onPress: handleDuplicateSession },
              { text: 'Share Session', onPress: () => Alert.alert('Share', 'Share functionality coming soon') },
              { text: 'Delete Session', style: 'destructive', onPress: handleDeleteSession },
            ]
          );
        }}>
          <MoreHorizontal size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Session Overview Card */}
        <LinearGradient
          colors={colorScheme === 'dark' ? [colors.surface, colors.surfaceSecondary] : [colors.surface, colors.background]}
          style={styles.sessionCard}
        >
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionType}>{session.type}</Text>
              <Text style={styles.sessionDateTime}>
                {formatDate(session.date)} at {formatTime(session.time)}
              </Text>
              <View style={styles.sessionMeta}>
                <View style={styles.metaItem}>
                  <Clock size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{session.duration} minutes</Text>
                </View>
                <View style={styles.metaItem}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{session.location}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Zap size={16} color={getDifficultyColor(session.difficulty)} />
                  <Text style={[styles.metaText, { color: getDifficultyColor(session.difficulty) }]}>
                    {session.difficulty}
                  </Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}
              onPress={() => setShowStatusModal(true)}
            >
              {getStatusIcon(session.status)}
              <Text style={styles.statusText}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Zap size={16} color={colors.warning} />
              <Text style={styles.statValue}>{session.estimatedCalories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Dumbbell size={16} color={colors.primary} />
              <Text style={styles.statValue}>{session.plannedExercises.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statItem}>
              <Target size={16} color={colors.success} />
              <Text style={styles.statValue}>{session.sessionGoals.length}</Text>
              <Text style={styles.statLabel}>Goals</Text>
            </View>
            {session.sessionRating && (
              <View style={styles.statItem}>
                <Star size={16} color={colors.warning} />
                <Text style={styles.statValue}>{session.sessionRating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            )}
          </View>
          
          {/* Meeting Link */}
          {(session.status === 'confirmed' || session.status === 'completed') && session.meeting_link && (
            <View style={styles.meetingLinkContainer}>
              <Text style={styles.meetingLinkLabel}>Meeting Link:</Text>
              <TouchableOpacity 
                style={styles.meetingLinkButton}
                onPress={async () => {
                  if (session.meeting_link) {
                    try {
                      const supported = await Linking.canOpenURL(session.meeting_link);
                      if (supported) {
                        await Linking.openURL(session.meeting_link);
                      } else {
                        Alert.alert(
                          'Cannot Open Link',
                          `Unable to open meeting link: ${session.meeting_link}`,
                          [{ text: 'OK' }]
                        );
                      }
                    } catch (error) {
                      console.error('Error opening meeting link:', error);
                      Alert.alert(
                        'Error',
                        'Failed to open meeting link. Please try again.',
                        [{ text: 'OK' }]
                      );
                    }
                  }
                }}
              >
                <LinkIcon size={14} color="#FFFFFF" />
                <Text style={styles.meetingLinkText}>Join Meeting</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.clientCard}>
            <View style={styles.clientHeader}>
              <View style={styles.clientLeft}>
                <Text style={styles.clientAvatar}>{session.clientAvatar}</Text>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{session.clientName}</Text>
                  <Text style={styles.clientEmail}>{session.clientEmail}</Text>
                  <Text style={styles.clientPhone}>{session.clientPhone}</Text>
                  <Text style={styles.clientAge}>Age: {session.clientAge}</Text>
                </View>
              </View>
            </View>
            
            {/* Client Goals */}
            <View style={styles.clientGoals}>
              <Text style={styles.clientGoalsTitle}>Fitness Goals</Text>
              <View style={styles.goalsContainer}>
                {session.clientGoals.map((goal: string, index: number) => (
                  <View key={index} style={styles.goalTag}>
                    <Text style={styles.goalText}>{goal}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.clientActions}>
              <TouchableOpacity 
                style={styles.clientActionButton}
                onPress={() => handleContactClient('message')}
              >
                <MessageSquare size={16} color={colors.primary} />
                <Text style={styles.clientActionText}>Message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.clientActionButton}
                onPress={() => handleContactClient('call')}
              >
                <Phone size={16} color={colors.success} />
                <Text style={styles.clientActionText}>Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.clientActionButton}
                onPress={() => handleContactClient('video')}
              >
                <Video size={16} color={colors.warning} />
                <Text style={styles.clientActionText}>Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Session Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Goals</Text>
          <View style={styles.goalsList}>
            {session.sessionGoals.map((goal: string, index: number) => (
              <View key={index} style={styles.goalItem}>
                <View style={styles.goalBullet} />
                <Text style={styles.goalText}>{goal}</Text>
                {session.status === 'completed' && (
                  <CheckCircle size={16} color={colors.success} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Workout Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Plan</Text>
          
          {session.plannedExercises.length > 0 ? (
            <>
              {/* Warm-up */}
              <View style={styles.workoutSection}>
                <Text style={styles.workoutSectionTitle}>Warm-up (5-10 min)</Text>
                {session.warmUp.map((item: string, index: number) => (
                  <View key={index} style={styles.workoutItem}>
                    <Text style={styles.workoutItemText}>• {item}</Text>
                  </View>
                ))}
              </View>

              {/* Main Exercises */}
              <View style={styles.workoutSection}>
                <Text style={styles.workoutSectionTitle}>Main Workout</Text>
                {session.plannedExercises.map((exercise: any, index: number) => (
                  <View key={index} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <View style={styles.exerciseRPE}>
                        <Text style={styles.rpeText}>RPE {exercise.targetRPE}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.exerciseDetails}>
                      <View style={styles.exerciseDetail}>
                        <Text style={styles.exerciseDetailLabel}>Sets & Reps:</Text>
                        <Text style={styles.exerciseDetailValue}>{exercise.sets}</Text>
                      </View>
                      <View style={styles.exerciseDetail}>
                        <Text style={styles.exerciseDetailLabel}>Weight:</Text>
                        <Text style={styles.exerciseDetailValue}>{exercise.weight}</Text>
                      </View>
                      <View style={styles.exerciseDetail}>
                        <Text style={styles.exerciseDetailLabel}>Rest:</Text>
                        <Text style={styles.exerciseDetailValue}>{exercise.restTime}</Text>
                      </View>
                    </View>

                    <View style={styles.muscleGroups}>
                      {exercise.muscleGroups.map((muscle: string, idx: number) => (
                        <View key={idx} style={styles.muscleTag}>
                          <Text style={styles.muscleText}>{muscle}</Text>
                        </View>
                      ))}
                    </View>

                    {session.status === 'completed' && (
                      <View style={styles.exerciseStatus}>
                        <CheckCircle size={16} color={colors.success} />
                        <Text style={styles.exerciseStatusText}>Completed</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* Cool-down */}
              <View style={styles.workoutSection}>
                <Text style={styles.workoutSectionTitle}>Cool-down (5-10 min)</Text>
                {session.coolDown.map((item: string, index: number) => (
                  <View key={index} style={styles.workoutItem}>
                    <Text style={styles.workoutItemText}>• {item}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No workout plan assigned to this session.</Text>
            </View>
          )}
        </View>

        {/* Equipment Needed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Needed</Text>
          <View style={styles.equipmentList}>
            {session.equipment.map((item: string, index: number) => (
              <View key={index} style={styles.equipmentItem}>
                <Dumbbell size={16} color={colors.primary} />
                <Text style={styles.equipmentText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Session Notes */}
        <View style={styles.section}>
          <View style={styles.notesHeader}>
            <Text style={styles.sectionTitle}>Trainer Notes</Text>
            <TouchableOpacity 
              style={styles.editNotesButton}
              onPress={() => setShowNotesModal(true)}
            >
              <Edit3 size={16} color={colors.primary} />
              <Text style={styles.editNotesText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>
              {session.trainerNotes || 'No trainer notes added for this session.'}
            </Text>
          </View>
        </View>

        {/* Client Feedback */}
        {session.status === 'completed' && (
          <View style={styles.section}>
            <View style={styles.notesHeader}>
              <Text style={styles.sectionTitle}>Client Feedback</Text>
              <TouchableOpacity 
                style={styles.editNotesButton}
                onPress={() => setShowFeedbackModal(true)}
              >
                <Edit3 size={16} color={colors.primary} />
                <Text style={styles.editNotesText}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.feedbackCard}>
              {session.sessionRating && (
                <View style={styles.ratingSection}>
                  <Text style={styles.ratingLabel}>Session Rating:</Text>
                  {renderStarRating(session.sessionRating)}
                </View>
              )}
              <Text style={styles.feedbackText}>
                {session.clientFeedback || 'No client feedback provided.'}
              </Text>
            </View>
          </View>
        )}

        {/* Session History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions with {session.clientName}</Text>
          <View style={styles.sessionHistory}>
            {session.previousSessions.map((prevSession: any, index: number) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDate}>
                    {prevSession.date ? formatDate(prevSession.date).split(',')[0] : 'No date'}
                  </Text>
                  <Text style={styles.historyType}>{prevSession.type}</Text>
                  {prevSession.notes && (
                    <Text style={styles.historyNotes}>{prevSession.notes}</Text>
                  )}
                </View>
                
                <View style={styles.historyStatus}>
                  {prevSession.completed ? (
                    <CheckCircle size={16} color={colors.success} />
                  ) : (
                    <XCircle size={16} color={colors.error} />
                  )}
                  {renderStarRating(prevSession.rating)}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <View style={styles.upcomingSessions}>
            {session.upcomingSessions.map((upcomingSession: any, index: number) => (
              <View key={index} style={styles.upcomingItem}>
                <View style={styles.upcomingDate}>
                  <Calendar size={16} color={colors.primary} />
                  <Text style={styles.upcomingDateText}>
                    {upcomingSession.date ? formatDate(upcomingSession.date).split(',')[0] : 'No date'}
                  </Text>
                </View>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingType}>{upcomingSession.type}</Text>
                  <Text style={styles.upcomingTime}>{upcomingSession.time}</Text>
                  <Text style={styles.upcomingLocation}>{upcomingSession.location}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Update Session Status</Text>
            <TouchableOpacity onPress={handleUpdateStatus}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedStatus === status && styles.selectedStatusOption
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <View style={styles.statusOptionContent}>
                  {getStatusIcon(status)}
                  <Text style={[
                    styles.statusOptionText,
                    selectedStatus === status && styles.selectedStatusOptionText
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </Text>
                </View>
                {selectedStatus === status && (
                  <CheckCircle size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            
            {selectedStatus === 'cancelled' && (
              <View style={styles.cancellationNotes}>
                <Text style={styles.fieldLabel}>Cancellation Reason</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={sessionNotes}
                  onChangeText={setSessionNotes}
                  placeholder="Add a reason for cancellation..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Notes Edit Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Trainer Notes</Text>
            <TouchableOpacity onPress={handleSaveNotes}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Trainer Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="Add notes about the session, client progress, observations, or any important details..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Feedback Edit Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Session Feedback</Text>
            <TouchableOpacity onPress={handleSaveFeedback}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Session Rating</Text>
            <View style={styles.ratingContainer}>
              {renderStarRating(sessionRating, setSessionRating)}
            </View>
            
            <Text style={styles.fieldLabel}>Client Feedback</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={clientFeedback}
              onChangeText={setClientFeedback}
              placeholder="How did the client feel about this session? Any feedback or comments..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

  const createStyles = (colors: any, colorScheme: string | null) => StyleSheet.create({
  meetingLinkContainer: {
    marginTop: 16, 
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meetingLinkLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  meetingLinkButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingLinkText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  sessionCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 16,
  },
  sessionType: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 8,
  },
  sessionDateTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  sessionMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  clientCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientHeader: {
    marginBottom: 16,
  },
  clientLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  clientAvatar: {
    fontSize: 32,
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  clientEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  clientPhone: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  clientAge: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  clientGoals: {
    marginBottom: 16,
  },
  clientGoalsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalTag: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  goalText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.primary,
  },
  clientActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clientActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6,
  },
  clientActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  goalsList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  goalBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  workoutSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  workoutItem: {
    paddingVertical: 4,
  },
  workoutItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  exerciseCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  exerciseRPE: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rpeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: colors.warning,
  },
  exerciseDetails: {
    marginBottom: 8,
  },
  exerciseDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  exerciseDetailLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  exerciseDetailValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  muscleTag: {
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  muscleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: colors.primary,
  },
  exerciseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseStatusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.success,
  },
  equipmentList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  equipmentText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  editNotesText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  notesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  feedbackCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  ratingLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  starRating: {
    flexDirection: 'row',
    gap: 4,
  },
  feedbackText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  sessionHistory: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  historyType: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  historyNotes: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  historyStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  upcomingSessions: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  upcomingDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 80,
  },
  upcomingDateText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  upcomingInfo: {
    flex: 1,
    marginLeft: 16,
  },
  upcomingType: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  upcomingTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  upcomingLocation: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedStatusOption: {
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
  },
  selectedStatusOptionText: {
    color: colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  ratingContainer: {
    marginBottom: 20,
  },
  cancellationNotes: {
    marginTop: 16,
  },
  emptySection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySectionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
