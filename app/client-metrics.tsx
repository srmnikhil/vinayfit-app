import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Plus, ChevronDown } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { MetricData, MetricType } from '@/types/metrics';
import { getUserMetrics } from '@/lib/metricsDatabase';
import { getCurrentUser } from '@/lib/supabase';
import { getMetrics } from '@/utils/metricsStorage';

export default function ClientMetricsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? 'light');
  const styles = createStyles(colors);

  const [metrics, setMetrics] = useState<MetricData>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      // Load metric configurations from local storage
      const metricConfigs = await getMetrics();
      
      // Load metric entries from Supabase
      const { user } = await getCurrentUser();
      if (user) {
        const entries = await getUserMetrics(user.id);
        
        // Combine configurations with latest entries
        const combinedMetrics: MetricData = {};
        
        Object.keys(metricConfigs).forEach(metricType => {
          const config = metricConfigs[metricType as MetricType];
          
          // Debug: Check what we're working with
          console.log('metricType:', metricType);
          console.log('entries:', entries);
          console.log('entries length:', entries.length);
          
          const metricEntries = entries.filter(entry => entry.metric_type === metricType);
          
          // Debug: Check the filter results
          console.log('metricEntries:', metricEntries);
          console.log('metricEntries length:', metricEntries.length);
          
          // Check if any entries have this metric_type
          const allMetricTypes = entries.map(entry => entry.metric_type);
          console.log('all metric types in entries:', [...new Set(allMetricTypes)]);
          
          // Log the actual dates for debugging
          console.log('metricEntries dates:', metricEntries.map(e => e.date));
          // More robust date sorting
          const parseDateTime = (date, time) => {
            // Try to parse as ISO if possible, else fallback
            if (date && time) {
              // Try to handle both 24h and 12h time formats
              const isoString = `${date}T${time.length <= 5 ? time : convertTo24Hour(time)}`;
              return new Date(isoString);
            }
            return new Date(date);
          };

          // Helper to convert 12h time (e.g., '9:00 AM') to 24h (e.g., '09:00')
          function convertTo24Hour(timeStr) {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            if (modifier && modifier.toLowerCase() === 'pm' && hours !== '12') {
              hours = String(parseInt(hours, 10) + 12);
            }
            if (modifier && modifier.toLowerCase() === 'am' && hours === '12') {
              hours = '00';
            }
            return `${hours.padStart(2, '0')}:${minutes}`;
          }

          // In your sort:
          const latestEntry = metricEntries.length > 0
            ? metricEntries
                .slice()
                .sort((a, b) =>
                  parseDateTime(b.date, b.time).getTime() - parseDateTime(a.date, a.time).getTime()
                )[0]
            : null;
          console.log('latest entry for', metricType, ':', latestEntry);
          
          combinedMetrics[metricType as MetricType] = {
            ...config,
            currentValue: latestEntry ? latestEntry.value : null,
            
            lastUpdated: latestEntry ? latestEntry.date : null,
            entries: metricEntries.map(entry => ({
              id: entry.id,
              value: entry.value,
              date: entry.date,
              time: entry.time || '',
              unit: entry.unit || config.unit,
            }))
          };
        });
        
        setMetrics(combinedMetrics);
      } else {
        // Fallback to local storage only
        setMetrics(metricConfigs);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMetricPress = (metricType: MetricType) => {
    router.push(`/metric-tracking/${metricType}`);
  };

  const handleLogAllMetrics = () => {
    router.push('/log-all-metrics');
  };

  const renderMetricItem = (metricType: MetricType) => {
    const metric = metrics[metricType];
    if (!metric) return null;

    return (
      <TouchableOpacity
        key={metricType}
        style={styles.metricItem}
        onPress={() => handleMetricPress(metricType)}
      >
        <View style={styles.metricLeft}>
          <Text style={styles.metricIcon}>{metric.icon}</Text>
          <View style={styles.metricInfo}>
            <Text style={styles.metricName}>{metric.name}</Text>
            {metric.lastUpdated && (
              <Text style={styles.metricUpdated}>
                updated on {new Date(metric.lastUpdated).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.metricRight}>
          {metric.currentValue !== null && metric.currentValue !== undefined && (
            <Text style={styles.metricValue}>
              {metric.currentValue} {metric.unit}
            </Text>
          )}
          <ChevronRight size={20} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
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
        <Text style={styles.title}>Metrics</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Plus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Metrics Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.metricsIcon}>
            <Text style={styles.iconEmoji}>📊</Text>
          </View>
        </View>

        {/* Metrics List */}
        <View style={styles.metricsList}>
          {Object.keys(metrics).map((metricType) => 
            renderMetricItem(metricType as MetricType)
          )}
        </View>

        {/* Log All Metrics Button */}
        <TouchableOpacity style={styles.logAllButton} onPress={handleLogAllMetrics}>
          <Text style={styles.logAllText}>Log all metrics</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Metric Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <ChevronDown size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add data</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {Object.keys(metrics).map((metricType) => {
              const metric = metrics[metricType as MetricType];
              return (
                <TouchableOpacity
                  key={metricType}
                  style={styles.modalMetricItem}
                  onPress={() => {
                    setShowAddModal(false);
                    router.push(`/add-metric/${metricType}`);
                  }}
                >
                  <Text style={styles.modalMetricIcon}>{metric.icon}</Text>
                  <Text style={styles.modalMetricName}>{metric.name}</Text>
                  <ChevronRight size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
    fontSize: 20,
    color: colors.text,
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  metricsIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 32,
  },
  metricsList: {
    paddingHorizontal: 20,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  metricUpdated: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
  },
  logAllButton: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  logAllText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  modalMetricIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  modalMetricName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
});