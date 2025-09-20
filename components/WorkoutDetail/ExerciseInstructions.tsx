import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Info, X, Target, Clock, Dumbbell } from 'lucide-react-native';

interface ExerciseInstructionsProps {
  exercise: {
    id: string;
    name: string;
    instructions?: string;
    muscle_groups?: string[];
    equipment?: string[];
    difficulty_level?: string;
  };
  colors: any;
}

export function ExerciseInstructions({ exercise, colors }: ExerciseInstructionsProps) {
  const [showModal, setShowModal] = useState(false);

  const styles = createStyles(colors);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return colors.success;
      case 'intermediate':
        return colors.warning;
      case 'advanced':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.infoButton}
        onPress={() => setShowModal(true)}
      >
        <Info size={16} color={colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={2}>
              {exercise.name}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Exercise Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailsGrid}>
                {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Target size={16} color={colors.primary} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Muscle Groups</Text>
                      <Text style={styles.detailValue}>
                        {exercise.muscle_groups.join(', ')}
                      </Text>
                    </View>
                  </View>
                )}

                {exercise.equipment && exercise.equipment.length > 0 && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Dumbbell size={16} color={colors.primary} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Equipment</Text>
                      <Text style={styles.detailValue}>
                        {exercise.equipment.join(', ')}
                      </Text>
                    </View>
                  </View>
                )}

                {exercise.difficulty_level && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Clock size={16} color={colors.primary} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Difficulty</Text>
                      <Text style={[
                        styles.detailValue,
                        { color: getDifficultyColor(exercise.difficulty_level) }
                      ]}>
                        {exercise.difficulty_level?.charAt(0).toUpperCase() + 
                         exercise.difficulty_level?.slice(1).toLowerCase()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Instructions */}
            {exercise.instructions && (
              <View style={styles.instructionsSection}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <Text style={styles.instructionsText}>
                  {exercise.instructions}
                </Text>
              </View>
            )}

            {!exercise.instructions && (
              <View style={styles.noInstructionsContainer}>
                <Text style={styles.noInstructionsText}>
                  No detailed instructions available for this exercise.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    flex: 1,
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginRight: 16,
    lineHeight: 26,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailsSection: {
    paddingVertical: 20,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  instructionsSection: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  instructionsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  noInstructionsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noInstructionsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});