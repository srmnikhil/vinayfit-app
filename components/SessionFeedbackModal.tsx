import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Star } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';

interface SessionFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitFeedback: (rating: number, feedback: string) => Promise<boolean>;
  sessionInfo?: {
    trainerName?: string;
    sessionType?: string;
    date?: string;
  };
}

export default function SessionFeedbackModal({
  visible,
  onClose,
  onSubmitFeedback,
  sessionInfo,
}: SessionFeedbackModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating for your session.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmitFeedback(rating, feedback);
      if (success) {
        // Reset form
        setRating(0);
        setFeedback('');
        onClose();
        Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
      } else {
        Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while submitting feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form when closing
      setRating(0);
      setFeedback('');
      onClose();
    }
  };

  const renderStarRating = () => {
    return (
      <View style={styles.starContainer}>
        <Text style={styles.ratingLabel}>How was your session?</Text>
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
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Session Feedback</Text>
            <TouchableOpacity 
              onPress={handleClose} 
              style={styles.closeButton}
              disabled={isSubmitting}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {sessionInfo && (
            <View style={styles.sessionInfoContainer}>
              <Text style={styles.sessionInfoText}>
                Session with {sessionInfo.trainerName || 'your trainer'}
              </Text>
              {sessionInfo.sessionType && (
                <Text style={styles.sessionTypeText}>{sessionInfo.sessionType}</Text>
              )}
              {sessionInfo.date && (
                <Text style={styles.sessionDateText}>{sessionInfo.date}</Text>
              )}
            </View>
          )}

          {renderStarRating()}

          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>
              Additional feedback (optional)
            </Text>
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

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, isSubmitting && styles.disabledButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isSubmitting || rating === 0) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay || 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  sessionInfoContainer: {
    backgroundColor: colors.surfaceSecondary || colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  sessionInfoText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  sessionTypeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  sessionDateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  starContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
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
  feedbackContainer: {
    marginBottom: 24,
  },
  feedbackLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  feedbackInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    height: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary || colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  submitButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
