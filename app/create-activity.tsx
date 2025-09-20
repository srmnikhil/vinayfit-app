import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Check } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

interface TrackingField {
  id: string;
  name: string;
  enabled: boolean;
  required?: boolean;
}

export default function CreateActivityScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [activityName, setActivityName] = useState('');
  const [trackingFields, setTrackingFields] = useState<TrackingField[]>([
    { id: 'duration', name: 'Duration', enabled: true, required: true },
    { id: 'calories', name: 'Calories', enabled: false },
    { id: 'distance', name: 'Distance', enabled: false },
    { id: 'elevation', name: 'Elevation Gain', enabled: false },
    { id: 'heartRate', name: 'Avg Heart Rate', enabled: false },
    { id: 'cadence', name: 'Avg Cadence', enabled: false },
    { id: 'power', name: 'Avg Power', enabled: false },
    { id: 'reps', name: 'Reps', enabled: false },
  ]);

  const toggleTrackingField = (fieldId: string) => {
    setTrackingFields(prev => 
      prev.map(field => 
        field.id === fieldId && !field.required
          ? { ...field, enabled: !field.enabled }
          : field
      )
    );
  };

  const handleNextStep = () => {
    if (!activityName.trim()) {
      return;
    }

    const selectedFields = trackingFields.filter(field => field.enabled);
    
    // Create the custom activity data
    const customActivity = {
      name: activityName.trim(),
      trackingFields: selectedFields,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    console.log('Creating custom activity:', customActivity);
    
    // Navigate to the log activity screen with the custom activity
    router.push(`/log-activity/${encodeURIComponent(activityName.trim())}`);
  };

  const isNextEnabled = activityName.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create new activity</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Activity Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.activityIconCircle}>
            <Star size={32} color="#F59E0B" fill="#F59E0B" />
          </View>
        </View>

        {/* Activity Name Input */}
        <View style={styles.nameContainer}>
          <TextInput
            style={styles.nameInput}
            value={activityName}
            onChangeText={setActivityName}
            placeholder="Name your activity"
            placeholderTextColor={colors.textTertiary}
            textAlign="center"
            maxLength={50}
          />
        </View>

        {/* Tracking Fields Section */}
        <View style={styles.trackingSection}>
          <Text style={styles.sectionTitle}>TRACKING FIELD</Text>
          
          <View style={styles.trackingFields}>
            {trackingFields.map((field) => (
              <TouchableOpacity
                key={field.id}
                style={styles.trackingField}
                onPress={() => toggleTrackingField(field.id)}
                disabled={field.required}
              >
                <Text style={[
                  styles.fieldName,
                  field.required && styles.requiredFieldName
                ]}>
                  {field.name}
                </Text>
                
                <View style={[
                  styles.checkbox,
                  field.enabled && styles.checkedBox,
                  field.required && styles.requiredBox
                ]}>
                  {field.enabled && (
                    <Check 
                      size={16} 
                      color={field.required ? colors.primary : '#FFFFFF'} 
                      strokeWidth={3}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Next Step Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.nextButton,
            !isNextEnabled && styles.disabledButton
          ]} 
          onPress={handleNextStep}
          disabled={!isNextEnabled}
        >
          <Text style={[
            styles.nextButtonText,
            !isNextEnabled && styles.disabledButtonText
          ]}>
            Next Step
          </Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  activityIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  nameInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trackingSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  trackingFields: {
    gap: 0,
  },
  trackingField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  fieldName: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  requiredFieldName: {
    color: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: colors.textSecondary,
    borderColor: colors.textSecondary,
  },
  requiredBox: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
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
  nextButton: {
    backgroundColor: colors.textSecondary,
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
  disabledButton: {
    backgroundColor: colors.borderLight,
  },
  nextButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: colors.textTertiary,
  },
});