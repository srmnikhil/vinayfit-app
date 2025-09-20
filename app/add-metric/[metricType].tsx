import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { Metric, MetricType } from '@/types/metrics';
import { getMetric } from '@/utils/metricsStorage';
import { addMetricEntryToSupabase } from '@/lib/metricsDatabase';
import { getCurrentUser } from '@/lib/supabase';

const units = {
  weight: ['kg', 'lbs'],
  chest: ['in', 'cm'],
  shoulders: ['in', 'cm'],
  waist: ['in', 'cm'],
  thigh: ['in', 'cm'],
  hip: ['in', 'cm'],
  bodyFat: ['%'],
  bicep: ['in', 'cm'],
  waterIntake: ['L', 'ml', 'cups'],
  steps: ['steps'],
};

export default function AddMetricScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { metricType } = useLocalSearchParams();

  const [metric, setMetric] = useState<Metric | null>(null);
  const [value, setValue] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(
    new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })
  );
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMetric();
  }, []);

  const loadMetric = async () => {
    try {
      const loadedMetric = await getMetric(metricType as MetricType);
      if (loadedMetric) {
        setMetric(loadedMetric);
        setSelectedUnit(loadedMetric.unit);
      }
    } catch (error) {
      console.error('Error loading metric:', error);
    }
  };

  const handleSave = async () => {
    if (!value.trim() || !metric) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    setLoading(true);
    try {
      const { user } = await getCurrentUser();
      if (!user) throw new Error('Not logged in');
      await addMetricEntryToSupabase({
        user_id: user.id,
        metric_type: metricType as string,
        value: numericValue,
        unit: selectedUnit,
        date,
        time,
      });
      router.back();
    } catch (error) {
      console.error('Error saving metric:', error);
      Alert.alert('Error', 'Failed to save metric entry');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const today = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${today}, ${currentTime}`;
  };

  if (!metric) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Metric not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const availableUnits = units[metricType as keyof typeof units] || [metric.unit];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronDown size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add data</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Metric Name */}
        <Text style={styles.metricName}>{metric.name}</Text>

        {/* Value Input */}
        <View style={styles.valueContainer}>
          <TextInput
            style={styles.valueInput}
            value={value}
            onChangeText={setValue}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            autoFocus
          />
          
          {availableUnits.length > 1 ? (
            <TouchableOpacity 
              style={styles.unitSelector}
              onPress={() => setShowUnitPicker(true)}
            >
              <Text style={styles.unitText}>{selectedUnit}</Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.unitText}>{selectedUnit}</Text>
          )}
        </View>

        {/* Date & Time */}
        <View style={styles.dateTimeSection}>
          <Text style={styles.dateTimeLabel}>Date & Time</Text>
          <Text style={styles.dateTimeValue}>{getCurrentDateTime()}</Text>
        </View>
      </View>

      {/* Add Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? 'Adding...' : 'Add'}
          </Text>
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
          <Text style={styles.modalTitle}>Select Unit</Text>
          
          <View style={styles.unitOptions}>
            {availableUnits.map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.unitOption,
                  selectedUnit === unit && styles.selectedUnitOption
                ]}
                onPress={() => {
                  setSelectedUnit(unit);
                  setShowUnitPicker(false);
                }}
              >
                <Text style={[
                  styles.unitOptionText,
                  selectedUnit === unit && styles.selectedUnitOptionText
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.error,
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
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  metricName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  valueInput: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: colors.text,
    textAlign: 'center',
    minWidth: 120,
    marginRight: 16,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  unitText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: colors.textSecondary,
    marginRight: 4,
  },
  dateTimeSection: {
    alignItems: 'center',
  },
  dateTimeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  dateTimeValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  addButton: {
    backgroundColor: colors.textSecondary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
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