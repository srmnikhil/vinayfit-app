import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Calendar, ChevronDown, Footprints, Flame, Heart, MapPin, CreditCard as Edit3 } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';

const activityIcons = {
  'run': Footprints,
  'walk': Footprints,
  'cycling': Footprints,
  'swimming': Footprints,
  'default': Footprints,
};

const activityColors = {
  'run': '#10B981',
  'walk': '#8B5CF6',
  'cycling': '#3B82F6',
  'swimming': '#06B6D4',
  'default': '#6B7280',
};

export default function LogActivityScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { activity } = useLocalSearchParams();
  
  const activityName = typeof activity === 'string' ? activity : 'Run';
  const activityKey = activityName.toLowerCase().replace(/\s+/g, '');
  const IconComponent = activityIcons[activityKey as keyof typeof activityIcons] || activityIcons.default;
  const activityColor = activityColors[activityKey as keyof typeof activityColors] || activityColors.default;

  // Form state
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [distance, setDistance] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  // Initialize with current time
  useEffect(() => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const currentDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    setStartTime(`${currentDate}, ${currentTime}`);
    
    // Set end time 1 hour later as default
    const endDate = new Date(now.getTime() + 60 * 60 * 1000);
    const endTimeString = endDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    setEndTime(`${currentDate}, ${endTimeString}`);
    setDuration('1 hr');
  }, []);

  const handleLogActivity = () => {
    // Handle activity logging
    const activityData = {
      name: activityName,
      startTime,
      endTime,
      duration,
      calories: calories ? `${calories} kcal` : null,
      distance: distance ? `${distance} ${distanceUnit}` : null,
      heartRate: heartRate ? `${heartRate} bpm` : null,
      notes,
      date: new Date().toISOString(),
    };
    
    console.log('Logging activity:', activityData);
    
    // Navigate back to home or show success message
    router.push('/(tabs)');
  };

  const distanceUnits = ['km', 'mi', 'm', 'ft'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{activityName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Activity Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.activityIconCircle, { backgroundColor: `${activityColor}20` }]}>
            <IconComponent size={32} color={activityColor} />
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Start Time */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Start Time</Text>
            <TouchableOpacity style={styles.timeInput}>
              <Text style={styles.timeText}>{startTime}</Text>
            </TouchableOpacity>
          </View>

          {/* End Time */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>End Time</Text>
            <TouchableOpacity style={styles.timeInput}>
              <Text style={styles.timeText}>{endTime}</Text>
            </TouchableOpacity>
          </View>

          {/* Duration */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Duration</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g., 1 hr, 30 min"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Calories */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Calories</Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                style={[styles.input, styles.inputWithUnitText]}
                value={calories}
                onChangeText={setCalories}
                placeholder="--"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>kcal</Text>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Distance</Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                style={[styles.input, styles.inputWithUnitText]}
                value={distance}
                onChangeText={setDistance}
                placeholder="--"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              <TouchableOpacity 
                style={styles.unitSelector}
                onPress={() => setShowUnitPicker(true)}
              >
                <Text style={styles.unitText}>{distanceUnit}</Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Average Heart Rate */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Avg Heart Rate</Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                style={[styles.input, styles.inputWithUnitText]}
                value={heartRate}
                onChangeText={setHeartRate}
                placeholder="--"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>bpm</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>NOTE</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about your workout..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Log Activity Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.logButton} onPress={handleLogActivity}>
          <Text style={styles.logButtonText}>Log Activity</Text>
        </TouchableOpacity>
      </View>

      {/* Unit Picker Modal */}
      <Modal
        visible={showUnitPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUnitPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Distance Unit</Text>
          
          <View style={styles.unitOptions}>
            {distanceUnits.map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.unitOption,
                  distanceUnit === unit && styles.selectedUnitOption
                ]}
                onPress={() => {
                  setDistanceUnit(unit);
                  setShowUnitPicker(false);
                }}
              >
                <Text style={[
                  styles.unitOptionText,
                  distanceUnit === unit && styles.selectedUnitOptionText
                ]}>
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
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
    fontSize: 20,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  activityIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  formField: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  timeInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  timeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inputWithUnitText: {
    flex: 1,
    borderBottomWidth: 0,
    textAlign: 'right',
    paddingRight: 8,
  },
  unitText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  notesInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    backgroundColor: colors.surface,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  logButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  unitOptions: {
    gap: 12,
  },
  unitOption: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  selectedUnitOption: {
    backgroundColor: colors.primary,
  },
  unitOptionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  selectedUnitOptionText: {
    color: '#FFFFFF',
  },
});