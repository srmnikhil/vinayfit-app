import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

const metricConfig = {
  chest: { 
    name: 'Chest', 
    unit: 'in', 
    color: '#10B981',
    data: [
      { date: '2024-05-29', value: 34, displayDate: '5/29' },
      { date: '2024-06-01', value: 35, displayDate: '6/1' },
      { date: '2024-06-04', value: 35.5, displayDate: '6/4' },
      { date: '2024-06-05', value: 36, displayDate: '6/5' },
      { date: '2024-06-10', value: 36.2, displayDate: '6/10' },
      { date: '2024-06-16', value: 36.5, displayDate: '6/16' },
      { date: '2024-06-22', value: 36.8, displayDate: '6/22' },
      { date: '2024-06-28', value: 37, displayDate: '6/28' },
    ]
  },
  shoulders: { 
    name: 'Shoulders', 
    unit: 'in', 
    color: '#F59E0B',
    data: [
      { date: '2024-06-01', value: 40, displayDate: '6/1' },
      { date: '2024-06-08', value: 41, displayDate: '6/8' },
      { date: '2024-06-15', value: 41.5, displayDate: '6/15' },
      { date: '2024-06-22', value: 42, displayDate: '6/22' },
      { date: '2024-06-28', value: 42.2, displayDate: '6/28' },
    ]
  },
  waist: { 
    name: 'Waist', 
    unit: 'in', 
    color: '#EF4444',
    data: [
      { date: '2024-06-01', value: 34, displayDate: '6/1' },
      { date: '2024-06-08', value: 33.5, displayDate: '6/8' },
      { date: '2024-06-15', value: 33, displayDate: '6/15' },
      { date: '2024-06-22', value: 32.5, displayDate: '6/22' },
      { date: '2024-06-28', value: 32, displayDate: '6/28' },
    ]
  },
  thigh: { 
    name: 'Thigh', 
    unit: 'in', 
    color: '#8B5CF6',
    data: [
      { date: '2024-06-01', value: 22, displayDate: '6/1' },
      { date: '2024-06-08', value: 22.5, displayDate: '6/8' },
      { date: '2024-06-15', value: 23, displayDate: '6/15' },
      { date: '2024-06-22', value: 23.5, displayDate: '6/22' },
      { date: '2024-06-28', value: 24, displayDate: '6/28' },
    ]
  },
  hip: { 
    name: 'Hip', 
    unit: 'in', 
    color: '#EC4899',
    data: [
      { date: '2024-06-01', value: 36, displayDate: '6/1' },
      { date: '2024-06-08', value: 36.5, displayDate: '6/8' },
      { date: '2024-06-15', value: 37, displayDate: '6/15' },
      { date: '2024-06-22', value: 37.5, displayDate: '6/22' },
      { date: '2024-06-28', value: 38, displayDate: '6/28' },
    ]
  },
  bodyfat: { 
    name: 'Body Fat', 
    unit: '%', 
    color: '#06B6D4',
    data: [
      { date: '2024-06-01', value: 18, displayDate: '6/1' },
      { date: '2024-06-08', value: 17.5, displayDate: '6/8' },
      { date: '2024-06-15', value: 17, displayDate: '6/15' },
      { date: '2024-06-22', value: 16.5, displayDate: '6/22' },
      { date: '2024-06-28', value: 16, displayDate: '6/28' },
    ]
  },
  bicep: { 
    name: 'Bicep', 
    unit: 'in', 
    color: '#F97316',
    data: [
      { date: '2024-06-01', value: 12, displayDate: '6/1' },
      { date: '2024-06-08', value: 12.5, displayDate: '6/8' },
      { date: '2024-06-15', value: 13, displayDate: '6/15' },
      { date: '2024-06-22', value: 13.5, displayDate: '6/22' },
      { date: '2024-06-28', value: 14, displayDate: '6/28' },
    ]
  },
  water: { 
    name: 'Water intake', 
    unit: 'L', 
    color: '#0EA5E9',
    data: [
      { date: '2024-06-24', value: 2.0, displayDate: '6/24' },
      { date: '2024-06-25', value: 2.2, displayDate: '6/25' },
      { date: '2024-06-26', value: 2.5, displayDate: '6/26' },
      { date: '2024-06-27', value: 2.8, displayDate: '6/27' },
      { date: '2024-06-28', value: 3.0, displayDate: '6/28' },
    ]
  },
  steps: { 
    name: 'Steps', 
    unit: 'steps', 
    color: '#84CC16',
    data: [
      { date: '2024-06-24', value: 8500, displayDate: '6/24' },
      { date: '2024-06-25', value: 9200, displayDate: '6/25' },
      { date: '2024-06-26', value: 10100, displayDate: '6/26' },
      { date: '2024-06-27', value: 9800, displayDate: '6/27' },
      { date: '2024-06-28', value: 10500, displayDate: '6/28' },
    ]
  },
};

export default function MetricDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { metric } = useLocalSearchParams();
  
  const metricKey = typeof metric === 'string' ? metric : 'chest';
  const config = metricConfig[metricKey as keyof typeof metricConfig] || metricConfig.chest;

  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [selectedDataPoint, setSelectedDataPoint] = useState(config.data[config.data.length - 1]);

  const periods = ['1W', '1M', '2M', '1Y'];
  const currentValue = config.data[config.data.length - 1]?.value || 0;

  const renderChart = () => {
    const chartWidth = width - 80;
    const chartHeight = 200;
    const maxValue = Math.max(...config.data.map(d => d.value));
    const minValue = Math.min(...config.data.map(d => d.value));
    const range = maxValue - minValue;
    const padding = range * 0.1;

    return (
      <View style={styles.chartContainer}>
        <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
          {/* Chart area */}
          <View style={styles.chartArea}>
            {/* Data points and line */}
            {config.data.map((point, index) => {
              const x = (index / (config.data.length - 1)) * (chartWidth - 60);
              const y = chartHeight - 60 - ((point.value - minValue + padding) / (range + 2 * padding)) * (chartHeight - 80);
              
              return (
                <View key={point.date}>
                  {/* Line to next point */}
                  {index < config.data.length - 1 && (
                    <View
                      style={[
                        styles.chartLine,
                        {
                          backgroundColor: config.color,
                          left: x + 30,
                          top: y + 4,
                          width: Math.sqrt(
                            Math.pow((chartWidth - 60) / (config.data.length - 1), 2) +
                            Math.pow(
                              ((config.data[index + 1].value - minValue + padding) / (range + 2 * padding)) * (chartHeight - 80) -
                              ((point.value - minValue + padding) / (range + 2 * padding)) * (chartHeight - 80),
                              2
                            )
                          ),
                          transform: [
                            {
                              rotate: `${Math.atan2(
                                ((config.data[index + 1].value - minValue + padding) / (range + 2 * padding)) * (chartHeight - 80) -
                                ((point.value - minValue + padding) / (range + 2 * padding)) * (chartHeight - 80),
                                (chartWidth - 60) / (config.data.length - 1)
                              )}rad`,
                            },
                          ],
                        },
                      ]}
                    />
                  )}
                  
                  {/* Data point */}
                  <TouchableOpacity
                    style={[
                      styles.dataPoint,
                      {
                        backgroundColor: config.color,
                        left: x + 26,
                        top: y,
                      },
                      selectedDataPoint?.date === point.date && styles.selectedDataPoint,
                    ]}
                    onPress={() => setSelectedDataPoint(point)}
                  />
                </View>
              );
            })}

            {/* Tooltip */}
            {selectedDataPoint && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipDate}>{selectedDataPoint.displayDate}</Text>
                <Text style={styles.tooltipValue}>
                  {selectedDataPoint.value} {config.unit}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          {config.data.map((point, index) => (
            <Text key={point.date} style={styles.xAxisLabel}>
              {point.displayDate}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{config.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.selectedPeriodButton,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === period && styles.selectedPeriodText,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Value */}
        <View style={styles.currentValueSection}>
          <Text style={styles.currentLabel}>CURRENT</Text>
          <Text style={styles.currentValue}>
            {currentValue} {config.unit}
          </Text>
          
          <View style={styles.dateNavigation}>
            <TouchableOpacity>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.dateRange}>
              {config.data[0]?.displayDate} - {config.data[config.data.length - 1]?.displayDate}
            </Text>
            <TouchableOpacity>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        {renderChart()}

        {/* Add Data Section */}
        <View style={styles.addDataSection}>
          <View style={styles.addDataHeader}>
            <Text style={styles.addDataTitle}>{config.name}</Text>
            <TouchableOpacity 
              style={styles.addDataButton}
              onPress={() => router.push(`/add-metric/${metricKey}`)}
            >
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.addDataSubtitle}>
            Track your {config.name.toLowerCase()} progress over time
          </Text>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  selectedPeriodButton: {
    backgroundColor: colors.text,
  },
  periodText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedPeriodText: {
    color: colors.background,
  },
  currentValueSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  currentLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  currentValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: colors.text,
    marginBottom: 16,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateRange: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  chart: {
    position: 'relative',
    marginBottom: 16,
  },
  chartArea: {
    marginLeft: 30,
    position: 'relative',
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  selectedDataPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
  },
  tooltip: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: colors.text,
    borderRadius: 8,
    padding: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  tooltipDate: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.background,
    marginBottom: 2,
  },
  tooltipValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: colors.background,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  xAxisLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  addDataSection: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  addDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addDataTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  addDataButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addDataSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});