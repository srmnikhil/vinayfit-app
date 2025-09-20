import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { TrainingSession } from '@/types/workout';
import { shouldShowCompletionPrompt, isSessionOngoing, getSessionTimeRemaining } from '@/utils/sessionUtils';
import { completeTrainingSession } from '@/lib/trainingSessionQueries';

interface SessionFeedback {
  sessionId: string;
  completed: boolean;
  rating?: number;
  feedback?: string;
  trainerNotes?: string;
}

interface UseSessionCompletionProps {
  sessions: TrainingSession[];
  onSessionCompleted?: (sessionId: string, feedback: SessionFeedback) => void;
  checkInterval?: number; // milliseconds
}

export const useSessionCompletion = ({
  sessions,
  onSessionCompleted,
  checkInterval = 30000, // Check every 30 seconds
}: UseSessionCompletionProps) => {
  const [completionPrompts, setCompletionPrompts] = useState<Set<string>>(new Set());
  const [feedbackSessions, setFeedbackSessions] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const promptedSessions = useRef<Set<string>>(new Set());

  // Check for sessions that need completion prompts
  const checkForCompletionPrompts = () => {
    sessions.forEach(session => {
      // Skip if already prompted for this session
      if (promptedSessions.current.has(session.id)) {
        return;
      }

      // Check if session just ended and needs completion prompt
      if (shouldShowCompletionPrompt(session)) {
        console.log('🏁 Session ended, showing completion prompt:', session.id);
        showCompletionPrompt(session);
        promptedSessions.current.add(session.id);
      }
    });
  };

  // Show completion confirmation dialog
  const showCompletionPrompt = (session: TrainingSession) => {
    const sessionName = session.template?.name || session.type || 'Training Session';
    
    Alert.alert(
      'Session Ended',
      `Your "${sessionName}" training session has ended. Did you complete the session?`,
      [
        {
          text: 'No, I missed it',
          style: 'cancel',
          onPress: () => handleSessionNotCompleted(session),
        },
        {
          text: 'Yes, completed!',
          onPress: () => handleSessionCompleted(session),
        },
      ],
      { cancelable: false }
    );
  };

  // Handle when user says they didn't complete the session
  const handleSessionNotCompleted = async (session: TrainingSession) => {
    try {
      // Update session status to missed or no_show
      const success = await completeTrainingSession(session.id, {
        trainer_notes: 'Client reported session as not completed',
        session_rating: 0,
        duration_minutes: 0,
      });

      if (success) {
        Alert.alert(
          'Session Updated',
          'The session has been marked as not completed. Don\'t worry, it happens! Keep up with your fitness journey.',
          [{ text: 'OK' }]
        );
        
        onSessionCompleted?.(session.id, {
          sessionId: session.id,
          completed: false,
        });
      } else {
        Alert.alert('Error', 'Failed to update session status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating session as not completed:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  // Handle when user says they completed the session
  const handleSessionCompleted = (session: TrainingSession) => {
    setCompletionPrompts(prev => new Set([...prev, session.id]));
    showFeedbackPrompt(session);
  };

  // Show feedback and rating prompt
  const showFeedbackPrompt = (session: TrainingSession) => {
    const sessionName = session.template?.name || session.type || 'Training Session';
    
    Alert.alert(
      'Great Job! 🎉',
      `You completed "${sessionName}"! How would you rate this session?`,
      [
        { text: '⭐ 1 Star', onPress: () => collectDetailedFeedback(session, 1) },
        { text: '⭐⭐ 2 Stars', onPress: () => collectDetailedFeedback(session, 2) },
        { text: '⭐⭐⭐ 3 Stars', onPress: () => collectDetailedFeedback(session, 3) },
        { text: '⭐⭐⭐⭐ 4 Stars', onPress: () => collectDetailedFeedback(session, 4) },
        { text: '⭐⭐⭐⭐⭐ 5 Stars', onPress: () => collectDetailedFeedback(session, 5) },
      ],
      { cancelable: false }
    );
  };

  // Collect detailed feedback
  const collectDetailedFeedback = (session: TrainingSession, rating: number) => {
    const sessionName = session.template?.name || session.type || 'Training Session';
    
    // For now, we'll use a simple alert for feedback. In a real app, you'd use a modal with text input
    Alert.alert(
      'Session Feedback',
      `Thanks for rating "${sessionName}" ${rating} star${rating !== 1 ? 's' : ''}! Any additional feedback?`,
      [
        {
          text: 'Skip',
          onPress: () => submitFeedback(session, rating, ''),
        },
        {
          text: 'Good session!',
          onPress: () => submitFeedback(session, rating, 'Good session overall'),
        },
        {
          text: 'Could be better',
          onPress: () => submitFeedback(session, rating, 'Session could be improved'),
        },
        {
          text: 'Excellent!',
          onPress: () => submitFeedback(session, rating, 'Excellent session, very satisfied'),
        },
      ]
    );
  };

  // Submit feedback to backend
  const submitFeedback = async (session: TrainingSession, rating: number, feedback: string) => {
    try {
      const durationMinutes = session.duration_minutes || session.template?.estimated_duration_minutes || 60;
      
      const success = await completeTrainingSession(session.id, {
        session_rating: rating,
        trainer_notes: feedback || `Client completed session with ${rating} star rating`,
        duration_minutes: durationMinutes,
      });

      if (success) {
        setCompletionPrompts(prev => {
          const newSet = new Set(prev);
          newSet.delete(session.id);
          return newSet;
        });

        setFeedbackSessions(prev => new Set([...prev, session.id]));

        Alert.alert(
          'Thank You! 🙏',
          'Your feedback has been submitted successfully. Keep up the great work!',
          [{ text: 'OK' }]
        );

        onSessionCompleted?.(session.id, {
          sessionId: session.id,
          completed: true,
          rating,
          feedback,
        });
      } else {
        Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting session feedback:', error);
      Alert.alert('Error', 'An error occurred while submitting feedback. Please try again.');
    }
  };

  // Get ongoing sessions with time remaining
  const getOngoingSessions = () => {
    return sessions
      .filter(session => isSessionOngoing(session))
      .map(session => ({
        ...session,
        timeRemaining: getSessionTimeRemaining(session),
      }));
  };

  // Manual trigger for testing
  const triggerCompletionPrompt = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      showCompletionPrompt(session);
    }
  };

  // Start checking for completion prompts
  useEffect(() => {
    if (sessions.length === 0) return;

    // Initial check
    checkForCompletionPrompts();

    // Set up interval checking
    intervalRef.current = setInterval(checkForCompletionPrompts, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessions, checkInterval]);

  // Clean up prompted sessions when sessions change
  useEffect(() => {
    const currentSessionIds = new Set(sessions.map(s => s.id));
    const newPromptedSessions = new Set(
      Array.from(promptedSessions.current).filter(id => currentSessionIds.has(id))
    );
    promptedSessions.current = newPromptedSessions;
  }, [sessions]);

  return {
    ongoingSessions: getOngoingSessions(),
    completionPrompts: Array.from(completionPrompts),
    feedbackSessions: Array.from(feedbackSessions),
    triggerCompletionPrompt, // For manual testing
  };
};
