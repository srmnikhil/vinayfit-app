import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, MapPin, User, X, ChevronDown, Save } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/lib/supabase';

const sessionTypes = [
  'Personal Training',
  'Strength Training',
  'HIIT Session',
  'Cardio Training',
  'Athletic Performance',
  'Flexibility Training',
  'Rehabilitation',
  'Group Training',
  'Virtual Session',
];

const locations = [
  'Gym A - Main Floor',
  'Gym B - Upper Level',
  'Studio A - Yoga Room',
  'Studio B - Dance Room',
  'Outdoor Area',
  'Pool Area',
  'Virtual/Online',
  'Client\'s Home',
];

export default function SessionEditScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams();
  
  const [session, setSession] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [sessionType, setSessionType] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  // Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Fetch session data
  const fetchSessionData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== 'string') {
        setError('Invalid session ID.');
        setLoading(false);
        return;
      }

      console.log('Fetching session data for ID:', id);
      
      // Fetch session data with client join
      const { data: sessionData, error: sessionError } = await supabase
        .from('training_sessions')
        .select(`
          *,
          client:profiles!training_sessions_client_id_fkey(
            id,
            full_name,
            email,
            created_at
          )
        `)
        .eq('id', id)
        .single();

      console.log('Session data result:', { sessionData, sessionError });

      if (sessionError || !sessionData) {
        setError('Session not found.');
        setLoading(false);
        return;
      }

      // Set session data
      setSession(sessionData);
      
      // Set client data
      if (sessionData.client) {
        setClient({
          id: sessionData.client.id,
          name: sessionData.client.full_name || sessionData.client.email,
          email: sessionData.client.email,
        });
      }

      // Pre-fill form with existing data
      setSessionType(sessionData.type || '');
      setSelectedDate(new Date(sessionData.scheduled_date));
      setSelectedTime(new Date(`2000-01-01T${sessionData.scheduled_time}`));
      setDuration(sessionData.duration_minutes?.toString() || '60');
      setLocation(sessionData.location || '');
      setNotes(sessionData.notes || '');

    } catch (err: any) {
      console.error('Error fetching session data:', err);
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [id]);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
    }
  };

  const handleSaveSession = async () => {
    if (!sessionType) {
      Alert.alert('Error', 'Please select a session type');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    setSaving(true);
    try {
      // Format date and time for database
      const sessionDate = selectedDate.toISOString().split('T')[0];
      const sessionTime = selectedTime.toTimeString().split(' ')[0];

      // Update session in database
      const { data, error } = await supabase
        .from('training_sessions')
        .update({
          type: sessionType,
          scheduled_date: sessionDate,
          scheduled_time: sessionTime,
          duration_minutes: parseInt(duration),
          location: location,
          notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Session updated successfully:', data);
      Alert.alert('Success', 'Session updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);

    } catch (err: any) {
      console.error('Error updating session:', err);
      Alert.alert('Error', 'Failed to update session: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !session || !client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Session Not Found</Text>
          <Text style={styles.errorText}>{error || 'The requested session could not be found.'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Session</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSaveSession}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Save size={20} color={colors.background} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Client Info */}
        <View style={styles.clientCard}>
          <View style={styles.clientAvatar}>
            <User size={24} color={colors.primary} />
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientEmail}>{client.email}</Text>
          </View>
        </View>

        {/* Session Type */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Session Type</Text>
          <TouchableOpacity 
            style={styles.pickerButton} 
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={[styles.pickerText, !sessionType && styles.placeholderText]}>
              {sessionType || 'Select session type'}
            </Text>
            <ChevronDown size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Date & Time */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          
          <TouchableOpacity 
            style={styles.pickerButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={colors.primary} />
            <Text style={styles.pickerText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.pickerButton} 
            onPress={() => setShowTimePicker(true)}
          >
            <Clock size={20} color={colors.primary} />
            <Text style={styles.pickerText}>{formatTime(selectedTime)}</Text>
          </TouchableOpacity>
        </View>

        {/* Duration */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Duration (minutes)</Text>
          <TextInput
            style={styles.textInput}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholder="60"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Location */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity 
            style={styles.pickerButton} 
            onPress={() => setShowLocationPicker(true)}
          >
            <MapPin size={20} color={colors.primary} />
            <Text style={[styles.pickerText, !location && styles.placeholderText]}>
              {location || 'Select location'}
            </Text>
            <ChevronDown size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add session notes..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          </View>
        </View>
      </Modal>

      {/* Session Type Picker Modal */}
      <Modal visible={showTypePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Session Type</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {sessionTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSessionType(type);
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    sessionType === type && styles.pickerItemTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Location Picker Modal */}
      <Modal visible={showLocationPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {locations.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={styles.pickerItem}
                  onPress={() => {
                    setLocation(loc);
                    setShowLocationPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    location === loc && styles.pickerItemTextSelected
                  ]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  placeholderText: {
    color: colors.textTertiary,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  pickerItemTextSelected: {
    color: colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.background,
  },
});