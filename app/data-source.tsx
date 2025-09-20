import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

interface DataMetric {
  id: string;
  name: string;
  icon: string;
  source: string;
  color: string;
}

export default function DataSourceScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [dataMetrics] = useState<DataMetric[]>([
    {
      id: 'steps',
      name: 'Steps',
      icon: '🏃',
      source: 'Google Fit',
      color: '#FF6B35',
    },
    {
      id: 'heart-rate',
      name: 'Heart Rate',
      icon: '❤️',
      source: 'Google Fit',
      color: '#FF4444',
    },
  ]);

  const handleMetricPress = (metric: DataMetric) => {
    // Handle metric source selection
    console.log('Selected metric:', metric);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Data Source</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            Some metrics can only sync with one data source. Choose which of your connected 
            integrations sync your fitness data.
          </Text>
        </View>

        {/* Data Metrics */}
        <View style={styles.metricsList}>
          {dataMetrics.map((metric) => (
            <TouchableOpacity
              key={metric.id}
              style={styles.metricItem}
              onPress={() => handleMetricPress(metric)}
            >
              <View style={styles.metricLeft}>
                <Text style={styles.metricIcon}>{metric.icon}</Text>
                <Text style={styles.metricName}>{metric.name}</Text>
              </View>
              <View style={styles.metricRight}>
                <Text style={styles.metricSource}>{metric.source}</Text>
                <ChevronDown size={16} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          ))}
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
  content: {
    flex: 1,
  },
  description: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  descriptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  metricsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
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
  metricName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricSource: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
  },
});