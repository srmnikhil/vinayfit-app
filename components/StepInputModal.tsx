import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { X, Plus, Minus } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';

interface StepInputModalProps {
  visible: boolean;
  onClose: () => void;
  onAddSteps: (steps: number) => Promise<boolean>;
  totalSteps: number;
  title: string;
  currentLabel: string;
  inputLabel: string;
  addButtonLabel?: string;
}

export default function StepInputModal({
  visible,
  onClose,
  onAddSteps,
  totalSteps,
  title,
  currentLabel,
  inputLabel,
  addButtonLabel = 'Add',
}: StepInputModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [stepsToAdd, setStepsToAdd] = useState('1000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSteps = async () => {
    const steps = parseInt(stepsToAdd, 10);
    if (isNaN(steps) || steps <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of steps.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onAddSteps(steps);
      if (success) {
        setStepsToAdd('1000');
        onClose();
      } else {
        Alert.alert('Error', 'Failed to add steps. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAddSteps = (amount: number) => {
    setStepsToAdd(amount.toString());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.currentStepsContainer}>
            <Text style={styles.currentStepsLabel}>{currentLabel}</Text>
            <Text style={styles.currentStepsValue}>
              {totalSteps.toLocaleString()}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{inputLabel}</Text>
            <TextInput
              style={styles.textInput}
              value={stepsToAdd}
              onChangeText={setStepsToAdd}
              keyboardType="numeric"
              placeholder="Enter steps"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.quickAddContainer}>
            <Text style={styles.quickAddLabel}>Quick Add</Text>
            <View style={styles.quickAddButtons}>
              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => quickAddSteps(500)}
              >
                <Text style={styles.quickAddText}>+500</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => quickAddSteps(1000)}
              >
                <Text style={styles.quickAddText}>+1K</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => quickAddSteps(2000)}
              >
                <Text style={styles.quickAddText}>+2K</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => quickAddSteps(5000)}
              >
                <Text style={styles.quickAddText}>+5K</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>New Total</Text>
            <Text style={styles.previewValue}>
              {(totalSteps + parseInt(stepsToAdd, 10) || 0).toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addButton, isSubmitting && styles.addButtonDisabled]}
            onPress={handleAddSteps}
            disabled={isSubmitting}
          >
            <Text style={styles.addButtonText}>
              {isSubmitting ? 'Adding...' : addButtonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
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
  currentStepsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  currentStepsLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  currentStepsValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: colors.text,
  },
  quickAddContainer: {
    marginBottom: 24,
  },
  quickAddLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickAddText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  previewLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  previewValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.success,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
}); 