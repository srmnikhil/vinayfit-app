import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Timer, User, X, MoreHorizontal } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import { getTrainingSession, cancelTrainingSession, rescheduleTrainingSession } from '../../lib/trainingSessionQueries';
import { determineSessionStatus } from '../../utils/sessionUtils';
import { TrainingSession } from '../../types/workout';

export default function SessionPreview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [session, setSession] = useState<(TrainingSession & { trainer?: { full_name?: string } }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    try {
      setLoading(true);
      if (id) {
        const sessionData = await getTrainingSession(id);
        setSession(sessionData);
        if (sessionData?.notes) setNotes(sessionData.notes);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Session', 'Are you sure you want to cancel this training session?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: confirmCancel },
    ]);
  };

  const confirmCancel = async () => {
    try {
      setActionLoading(true);
      if (id) {
        await cancelTrainingSession(id);
        Alert.alert('Success', 'Session cancelled successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = () => {
    if (session) {
      const sessionDate = new Date(session.scheduled_date);
      setNewDate(sessionDate.toISOString().split('T')[0]);
      setNewTime(session.scheduled_time || sessionDate.toTimeString().slice(0, 5));
      setRescheduleModalVisible(true);
    }
  };

  const confirmReschedule = async () => {
    if (!newDate || !newTime) {
      Alert.alert('Error', 'Please enter both date and time');
      return;
    }
    try {
      setActionLoading(true);
      if (id) {
        await rescheduleTrainingSession(id, newDate, newTime);
        setRescheduleModalVisible(false);
        Alert.alert('Success', 'Session rescheduled successfully', [
          { text: 'OK', onPress: loadSession },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reschedule session');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };
  const formatTime = (time: string | null) => {
    if (!time) return '';
    return time.length === 5 ? time : time.slice(0, 5);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading session details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sessionStatus = determineSessionStatus(session);

  return (
    <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Preview</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MoreHorizontal size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Session Card */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#3730A3', '#1E40AF'] : ['#F093FB', '#F5576C']}
          style={styles.sessionCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionTitle}>{session.template?.name || 'Training Session'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.primary }]}> 
              <Text style={styles.statusText}>{sessionStatus.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.sessionDetails}>
            <View style={styles.detailRow}>
              <Calendar size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.detailText}>{formatDate(session.scheduled_date)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.detailText}>{formatTime(session.scheduled_time)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Timer size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.detailText}>{session.duration || 60} minutes</Text>
            </View>
            {session.trainer?.full_name ? (
              <View style={styles.detailRow}>
                <User size={20} color="rgba(255,255,255,0.8)" />
                <Text style={styles.detailText}>{session.trainer.full_name}</Text>
              </View>
            ) : session.trainer_id && (
              <View style={styles.detailRow}>
                <User size={20} color="rgba(255,255,255,0.8)" />
                <Text style={styles.detailText}>Trainer ID: {session.trainer_id}</Text>
              </View>
            )}
          </View>
          {session.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Notes:</Text>
              <Text style={styles.notesText}>{session.notes}</Text>
            </View>
          )}
        </LinearGradient>
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rescheduleButton]}
            onPress={handleReschedule}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Calendar size={20} color="white" />
                <Text style={styles.actionButtonText}>Reschedule</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancel}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <X size={20} color="white" />
                <Text style={styles.actionButtonText}>Cancel Session</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reschedule Session</Text>
              <TouchableOpacity onPress={() => setRescheduleModalVisible(false)} style={styles.closeButton}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date (YYYY-MM-DD):</Text>
              <TextInput
                style={styles.input}
                value={newDate}
                onChangeText={setNewDate}
                placeholder="2024-01-15"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Time (HH:MM):</Text>
              <TextInput
                style={styles.input}
                value={newTime}
                onChangeText={setNewTime}
                placeholder="14:30"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optional):</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setRescheduleModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={confirmReschedule}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmModalButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginTop: 16,
    marginBottom: 24,
    fontFamily: 'Inter-SemiBold',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionCard: {
    margin: 20,
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
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
  sessionDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Inter-Medium',
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  notesTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  rescheduleButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.surfaceSecondary,
    color: colors.text,
    fontFamily: 'Inter-Regular',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: colors.textSecondary,
  },
  confirmModalButton: {
    backgroundColor: colors.primary,
  },
  cancelModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  confirmModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

