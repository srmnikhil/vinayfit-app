import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Star, MessageSquare } from 'lucide-react-native';
import { TrainingSession } from '@/types/workout';
import { 
  updateSessionClientFeedback,
  submitSessionFeedback,
  getSessionFeedbackSummary 
} from '@/lib/trainingSessionQueries';
import SessionFeedbackModal from './SessionFeedbackModal';

interface SessionFeedbackCardProps {
  session: TrainingSession;
  colors: any;
  onFeedbackSubmitted?: () => void;
}

export default function SessionFeedbackCard({ 
  session, 
  colors,
  onFeedbackSubmitted 
}: SessionFeedbackCardProps) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const styles = createStyles(colors);

  // Only show feedback component for completed sessions
  if (session.status !== 'completed') {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Enhanced feedback submission using the new comprehensive function
  const handleSubmitFeedbackEnhanced = async (rating: number, feedback: string): Promise<boolean> => {
    const result = await submitSessionFeedback({
      sessionId: session.id,
      rating,
      feedback,
      onSuccess: (updatedSession) => {
        console.log('✅ Feedback submitted successfully:', {
          sessionId: updatedSession.id,
          rating: updatedSession.session_rating,
          hasFeedback: !!updatedSession.client_feedback,
        });
        
        // Update local state/UI - the parent component should refresh
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        }
      },
      onError: (error) => {
        console.error('❌ Failed to submit feedback:', error);
        // You could show a toast notification here
      },
      onLoadingChange: (isLoading) => {
        console.log('🔄 Loading state changed:', isLoading);
        // You could update a loading indicator here
      },
    });

    return result.success;
  };

  // Original feedback submission (kept for compatibility)
  const handleSubmitFeedback = async (rating: number, feedback: string): Promise<boolean> => {
    try {
      const success = await updateSessionClientFeedback(session.id, rating, feedback);
      if (success && onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
      return success;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            color={star <= rating ? colors.warning || '#FFD700' : colors.border}
            fill={star <= rating ? colors.warning || '#FFD700' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  const sessionInfo = {
    trainerName: session.trainer?.full_name,
    sessionType: session.template?.name || session.type || 'Training Session',
    date: formatDate(session.scheduled_date),
  };

  return (
    <View style={styles.container}>
      {session.session_rating && session.client_feedback ? (
        // Show existing feedback
        <View style={styles.feedbackDisplay}>
          <View style={styles.feedbackHeader}>
            <Text style={styles.feedbackTitle}>Your Feedback</Text>
            {renderStars(session.session_rating)}
          </View>
          {session.client_feedback && (
            <Text style={styles.feedbackText} numberOfLines={2}>
              {session.client_feedback}
            </Text>
          )}
        </View>
      ) : session.session_rating ? (
        // Show rating only
        <View style={styles.ratingOnlyDisplay}>
          <Text style={styles.ratingLabel}>Your Rating:</Text>
          {renderStars(session.session_rating)}
        </View>
      ) : (
        // Show feedback prompt
        <TouchableOpacity 
          style={styles.feedbackPrompt}
          onPress={() => setShowFeedbackModal(true)}
        >
          <View style={styles.promptContent}>
            <MessageSquare size={20} color={colors.primary} />
            <Text style={styles.promptText}>Share your feedback</Text>
          </View>
          <Text style={styles.promptSubtext}>
            How was your session with {session.trainer?.full_name || 'your trainer'}?
          </Text>
        </TouchableOpacity>
      )}

      <SessionFeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmitFeedback={handleSubmitFeedback}
        sessionInfo={sessionInfo}
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginTop: 12,
  },
  feedbackDisplay: {
    backgroundColor: colors.surfaceSecondary || colors.surface,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  feedbackText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  ratingOnlyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceSecondary || colors.surface,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  ratingLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.text,
  },
  feedbackPrompt: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  promptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  promptText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  promptSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
