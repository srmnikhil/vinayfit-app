import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Minus } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { MetricData, MetricType } from '@/types/metrics';
import { getMetrics } from '@/utils/metricsStorage';
import { addMetricEntryToSupabase } from '@/lib/metricsDatabase';
import { getCurrentUser } from '@/lib/supabase';

interface MetricInput {
  metricType: MetricType;
  value: string;
  enabled: boolean;
}

export default function LogAllMetricsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? 'light');
  const styles = createStyles(colors);

  const [metrics, setMetrics] = useState<MetricData>({});
  const [metricInputs, setMetricInputs] = useState<MetricInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const loadedMetrics = await getMetrics();
      setMetrics(loadedMetrics);
      
      // Initialize metric inputs
      const inputs: MetricInput[] = Object.keys(loadedMetrics).map(metricType => ({
        metricType: metricType as MetricType,
        value: '',
        enabled: false,
      }));
      setMetricInputs(inputs);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMetricInput = (metricType: MetricType, field: keyof MetricInput, value: any) => {
    setMetricInputs(prev => prev.map(input => 
      input.metricType === metricType 
        ? { ...input, [field]: value }
        : input
    ));
  };

  const handleSaveAll = async () => {
    const enabledInputs = metricInputs.filter(input => input.enabled && input.value.trim());
    
    if (enabledInputs.length === 0) {
      Alert.alert('Error', 'Please enable and enter values for at least one metric');
      return;
    }

    // Validate all values are numeric
    for (const input of enabledInputs) {
      const numericValue = parseFloat(input.value);
      if (isNaN(numericValue)) {
        Alert.alert('Error', `Please enter a valid number for ${metrics[input.metricType]?.name}`);
        return;
      }
    }

    setSaving(true);
    try {
      const { user } = await getCurrentUser();
      if (!user) throw new Error('Not logged in');
      
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Save all enabled metrics
      for (const input of enabledInputs) {
        const numericValue = parseFloat(input.value);
        await addMetricEntryToSupabase({
          user_id: user.id,
          metric_type: input.metricType,
          value: numericValue,
          date: currentDate,
          time: currentTime,
        });
      }

      Alert.alert(
        'Success',
        `Successfully logged ${enabledInputs.length} metric${enabledInputs.length > 1 ? 's' : ''}!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving metrics:', error);
      Alert.alert('Error', 'Failed to save metrics');
    } finally {
      setSaving(false);
    }
  };

  const renderMetricInput = (input: MetricInput) => {
    const metric = metrics[input.metricType];
    if (!metric) return null;

    return (
      <View key={input.metricType} style={styles.metricRow}>
        <TouchableOpacity
          style={styles.metricToggle}
          onPress={() => updateMetricInput(input.metricType, 'enabled', !input.enabled)}
        >
          <View style={[
            styles.checkbox,
            input.enabled && styles.checkedBox
          ]}>
            {input.enabled && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.metricInfo}>
          <Text style={styles.metricIcon}>{metric.icon}</Text>
          <Text style={styles.metricName}>{metric.name}</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.valueInput,
              !input.enabled && styles.disabledInput
            ]}
            value={input.value}
            onChangeText={(value) => updateMetricInput(input.metricType, 'value', value)}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            editable={input.enabled}
          />
          <Text style={styles.unitLabel}>{metric.unit}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading metrics...</Text>
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
        <Text style={styles.title}>Log All Metrics</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveAll}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.instructions}>
          Select the metrics you want to log and enter their values. All selected metrics will be saved with the current date and time.
        </Text>

        <View style={styles.metricsContainer}>
          {metricInputs.map(renderMetricInput)}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
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
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  instructions: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    textAlign: 'center',
  },
  metricsContainer: {
    paddingHorizontal: 20,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  metricToggle: {
    marginRight: 16,
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  metricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  metricName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  valueInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
    minWidth: 60,
    marginRight: 8,
  },
  disabledInput: {
    backgroundColor: colors.borderLight,
    color: colors.textTertiary,
  },
  unitLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
});