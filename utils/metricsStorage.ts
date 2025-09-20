import AsyncStorage from '@react-native-async-storage/async-storage';
import { MetricData, Metric, MetricType, MetricEntry } from '@/types/metrics';

const METRICS_STORAGE_KEY = 'user_metrics';

// Default metrics configuration
const defaultMetrics: MetricData = {
  weight: {
    id: 'weight',
    name: 'Weight',
    unit: 'kg',
    icon: '⚖️',
    entries: [],
  },
  body_fat: {
    id: 'body_fat',
    name: 'Body Fat',
    unit: '%',
    icon: '📊',
    entries: [],
  },
  muscle_mass: {
    id: 'muscle_mass',
    name: 'Muscle Mass',
    unit: 'kg',
    icon: '💪',
    entries: [],
  },
  chest: {
    id: 'chest',
    name: 'Chest',
    unit: 'cm',
    icon: '📏',
    entries: [],
  },
  waist: {
    id: 'waist',
    name: 'Waist',
    unit: 'cm',
    icon: '📐',
    entries: [],
  },
  hips: {
    id: 'hips',
    name: 'Hips',
    unit: 'cm',
    icon: '📏',
    entries: [],
  },
  biceps: {
    id: 'biceps',
    name: 'Biceps',
    unit: 'cm',
    icon: '💪',
    entries: [],
  },
  thighs: {
    id: 'thighs',
    name: 'Thighs',
    unit: 'cm',
    icon: '🦵',
    entries: [],
  },
  height: {
    id: 'height',
    name: 'Height',
    unit: 'cm',
    icon: '📏',
    entries: [],
  },
  blood_pressure: {
    id: 'blood_pressure',
    name: 'Blood Pressure',
    unit: 'mmHg',
    icon: '❤️',
    entries: [],
  },
  heart_rate: {
    id: 'heart_rate',
    name: 'Heart Rate',
    unit: 'bpm',
    icon: '💓',
    entries: [],
  },
  steps: {
    id: 'steps',
    name: 'Steps',
    unit: 'steps',
    icon: '👟',
    entries: [],
  },
  sleep_hours: {
    id: 'sleep_hours',
    name: 'Sleep',
    unit: 'hours',
    icon: '😴',
    entries: [],
  },
  water_intake: {
    id: 'water_intake',
    name: 'Water Intake',
    unit: 'L',
    icon: '💧',
    entries: [],
  },
};

export const getMetrics = async (): Promise<MetricData> => {
  try {
    const stored = await AsyncStorage.getItem(METRICS_STORAGE_KEY);
    if (stored) {
      const parsedMetrics = JSON.parse(stored);
      // Merge with defaults to ensure all metrics exist
      return { ...defaultMetrics, ...parsedMetrics };
    }
    
    // Initialize with default metrics
    await AsyncStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(defaultMetrics));
    return defaultMetrics;
  } catch (error) {
    console.error('Error loading metrics:', error);
    return defaultMetrics;
  }
};

export const getMetric = async (metricType: MetricType): Promise<Metric> => {
  const metrics = await getMetrics();
  return metrics[metricType] || defaultMetrics[metricType];
};

export const saveMetric = async (metricType: MetricType, metric: Metric): Promise<void> => {
  try {
    const metrics = await getMetrics();
    metrics[metricType] = metric;
    await AsyncStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
  } catch (error) {
    console.error('Error saving metric:', error);
    throw error;
  }
};

export const addMetricEntry = async (
  metricType: MetricType,
  value: number,
  date: string = new Date().toISOString(),
  notes?: string
): Promise<void> => {
  try {
    const metric = await getMetric(metricType);
    
    const newEntry: MetricEntry = {
      id: Date.now().toString(),
      value,
      date,
      notes,
      created_at: new Date().toISOString(),
    };
    
    metric.entries.push(newEntry);
    metric.entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    metric.currentValue = value;
    metric.lastUpdated = new Date().toISOString();
    
    await saveMetric(metricType, metric);
  } catch (error) {
    console.error('Error adding metric entry:', error);
    throw error;
  }
};

export const deleteMetricEntry = async (
  metricType: MetricType,
  entryId: string
): Promise<void> => {
  try {
    const metric = await getMetric(metricType);
    metric.entries = metric.entries.filter(entry => entry.id !== entryId);
    
    // Update current value to the latest entry
    if (metric.entries.length > 0) {
      const sortedEntries = metric.entries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      metric.currentValue = sortedEntries[0].value;
      metric.lastUpdated = sortedEntries[0].date;
    } else {
      metric.currentValue = undefined;
      metric.lastUpdated = undefined;
    }
    
    await saveMetric(metricType, metric);
  } catch (error) {
    console.error('Error deleting metric entry:', error);
    throw error;
  }
};

export const clearAllMetrics = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(METRICS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing metrics:', error);
    throw error;
  }
};