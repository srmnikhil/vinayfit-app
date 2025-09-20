import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Star, CheckCircle, XCircle } from 'lucide-react-native';
import { TrainingSession } from '@/types/workout';
import {
  submitSessionFeedback,
  getSessionFeedbackSummary,
  FeedbackSubmissionResult,
} from '@/lib/trainingSessionQueries';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';

interface SessionFeedbackExampleProps {
  session: TrainingSession;
  onSessionUpdated?: (updatedSession: TrainingSession) => void;
  onRefreshNeeded?: () => void;
}

/**
 * Example component demonstrating comprehensive feedback submission
 * with enhanced state management and UI feedback
 */
export default function SessionFeedbackExample({
  session,
  onSessionUpdated,
  onRefreshNeeded,
}: SessionFeedbackExampleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  // Local state for feedback submission
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Get feedback summary using utility function
  const feedbackSummary = getSessionFeedbackSummary(session);

  // Enhanced feedback submission with comprehensive state management
  const handleSubmitFeedback = useCallback(async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating for your session.');
      return;
    }

    // Clear previous results
    setSubmissionResult(null);

    try {
      const result: FeedbackSubmissionResult = await submitSessionFeedback({
        sessionId: session.id,
        rating,
        feedback: feedback.trim() || undefined,
        
        // Success callback - called when feedback is successfully submitted
        onSuccess: (updatedSession) => {
          console.log('✅ Feedback submission successful:', {
            sessionId: updatedSession.id,
            rating: updatedSession.session_rating,
            hasFeedback: !!updatedSession.client_feedback,
            trainerName: updatedSession.trainer?.full_name,
          });

          // Update parent component with new session data
          if (onSessionUpdated) {
            onSessionUpdated(updatedSession);
          }

          // Trigger refresh if needed
          if (onRefreshNeeded) {
            onRefreshNeeded();
          }

          // Show success message
          setSubmissionResult({
            success: true,
            message: 'Your feedback has been submitted successfully!',
          });

          // Reset form
          setRating(0);
          setFeedback('');

          // Auto-hide success message after 3 seconds
          setTimeout(() => {
            setSubmissionResult(null);
          }, 3000);
        },

        // Error callback - called when feedback submission fails
        onError: (error) => {
          console.error('❌ Feedback submission failed:', error);
          
          setSubmissionResult({
            success: false,
            message: error || 'Failed to submit feedback. Please try again.',
          });

          // Show alert for critical errors
          Alert.alert(
            'Submission Failed',
            error || 'An unexpected error occurred. Please try again.',
            [{ text: 'OK' }]
          );
        },

        // Loading state callback - called when loading state changes
        onLoadingChange: (isLoading) => {
          console.log('🔄 Feedback submission loading state:', isLoading);
          setIsSubmitting(isLoading);
        },
      });

      // Handle the result
      if (!result.success) {
        console.warn('⚠️ Feedback submission completed but was not successful:', result.error);
      }

    } catch (error) {
      console.error('💥 Unexpected error during feedback submission:', error);
      setSubmissionResult({
        success: false,
        message: 'An unexpected error occurred. Please try again.',
      });
      setIsSubmitting(false);
    }
  }, [session.id, rating, feedback, onSessionUpdated, onRefreshNeeded]);

  // Render star rating component
  const renderStarRating = () => (
    <View style={styles.starContainer}>
      <Text style={styles.ratingLabel}>Rate your session:</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
            disabled={isSubmitting}
          >
            <Star
              size={32}
              color={star <= rating ? colors.warning || '#FFD700' : colors.border}
              fill={star <= rating ? colors.warning || '#FFD700' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingHint}>
        {rating === 1 && 'Poor'}
        {rating === 2 && 'Fair'}
        {rating === 3 && 'Good'}
        {rating === 4 && 'Very Good'}
        {rating === 5 && 'Excellent'}
        {rating === 0 && 'Tap a star to rate'}
      </Text>
    </View>
  );

  // Render submission result
  const renderSubmissionResult = () => {
    if (!submissionResult) return null;

    return (
      <View style={[
        styles.resultContainer,
        submissionResult.success ? styles.successContainer : styles.errorContainer
      ]}>
        <View style={styles.resultHeader}>
          {submissionResult.success ? (
            <CheckCircle size={20} color={colors.success} />
          ) : (
            <XCircle size={20} color={colors.error} />
          )}
          <Text style={[
            styles.resultText,
            { color: submissionResult.success ? colors.success : colors.error }
          ]}>
            {submissionResult.message}
          </Text>
        </View>
      </View>
    );
  };

  // Don't show for non-completed sessions
  if (session.status !== 'completed') {
    return null;
  }

  // Show existing feedback if already submitted
  if (feedbackSummary.isComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.existingFeedback}>
          <Text style={styles.existingTitle}>Your Feedback</Text>
          <View style={styles.existingRating}>
            <Text style={styles.ratingText}>{feedbackSummary.displayText}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  color={star <= feedbackSummary.rating ? colors.warning || '#FFD700' : colors.border}
                  fill={star <= feedbackSummary.rating ? colors.warning || '#FFD700' : 'transparent'}
                />
              ))}
            </View>
          </View>
          {feedbackSummary.hasFeedback && (
            <Text style={styles.existingFeedbackText} numberOfLines={3}>
              {feedbackSummary.feedback}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Your Feedback</Text>
      <Text style={styles.subtitle}>
        How was your session with {session.trainer?.full_name || 'your trainer'}?
      </Text>

      {renderStarRating()}

      <View style={styles.feedbackInputContainer}>
        <Text style={styles.feedbackLabel}>Additional comments (optional):</Text>
        <TextInput
          style={styles.feedbackInput}
          value={feedback}
          onChangeText={setFeedback}
          placeholder="Share your thoughts about the session..."
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!isSubmitting}
        />
      </View>

      {renderSubmissionResult()}

      <TouchableOpacity
        style={[
          styles.submitButton,
          (isSubmitting || rating === 0) && styles.disabledButton
        ]}
        onPress={handleSubmitFeedback}
        disabled={isSubmitting || rating === 0}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Feedback</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  starContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    minHeight: 20,
  },
  feedbackInputContainer: {
    marginBottom: 20,
  },
  feedbackLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  feedbackInput: {
    backgroundColor: colors.surfaceSecondary || colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    height: 100,
  },
  resultContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successContainer: {
    backgroundColor: colors.successBackground || '#f0f9ff',
    borderWidth: 1,
    borderColor: colors.success,
  },
  errorContainer: {
    backgroundColor: colors.errorBackground || '#fef2f2',
    borderWidth: 1,
    borderColor: colors.error,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  existingFeedback: {
    backgroundColor: colors.surfaceSecondary || colors.surface,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  existingTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  existingRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
  },
  existingFeedbackText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
