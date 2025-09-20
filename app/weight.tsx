import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface WeightData {
  date: string;
  weight: number;
  displayDate: string;
}

const weightHistory: WeightData[] = [
  { date: '2024-05-29', weight: 58, displayDate: '5/29' },
  { date: '2024-06-01', weight: 52, displayDate: '6/1' },
  { date: '2024-06-04', weight: 58, displayDate: '6/4' },
  { date: '2024-06-05', weight: 78, displayDate: '6/5' },
  { date: '2024-06-10', weight: 75, displayDate: '6/10' },
  { date: '2024-06-16', weight: 72, displayDate: '6/16' },
  { date: '2024-06-22', weight: 70, displayDate: '6/22' },
  { date: '2024-06-28', weight: 68, displayDate: '6/28' },
];

const weeklyData = [
  { period: 'Jun 2 - Jun 8', weight: 68, trend: 'up' },
  { period: 'May 26 - Jun 1', weight: 52, trend: 'down' },
  { period: 'Apr 21 - Apr 27', weight: 58, trend: 'up' },
];

export default function WeightScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [currentWeight] = useState(78);
  const [selectedDataPoint, setSelectedDataPoint] = useState<WeightData | null>(
    weightHistory.find(d => d.weight === 78) || null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const lineAnimations = weightHistory.map(() => new Animated.Value(0));
  const pointAnimations = weightHistory.map(() => new Animated.Value(0));
  const shimmerAnim = new Animated.Value(0);

  const periods = ['1W', '1M', '2M', '1Y'];

  useEffect(() => {
    // Start loading animation
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    // Simulate loading time
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      shimmerAnimation.stop();
      
      // Start graph animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        // Animate lines sequentially
        Animated.stagger(100, 
          lineAnimations.map(anim => 
            Animated.timing(anim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: false,
            })
          )
        ),
        // Animate points with delay
        Animated.sequence([
          Animated.delay(300),
          Animated.stagger(80, 
            pointAnimations.map(anim => 
              Animated.spring(anim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              })
            )
          )
        ])
      ]).start();
    }, 2000);

    return () => {
      clearTimeout(loadingTimer);
      shimmerAnimation.stop();
    };
  }, []);

  const renderLoadingGraph = () => {
    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-200, 200],
    });

    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingGraph}>
          {/* Shimmer effect */}
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
          
          {/* Loading skeleton */}
          <View style={styles.skeletonContainer}>
            {[...Array(8)].map((_, index) => (
              <View key={index} style={styles.skeletonPoint} />
            ))}
          </View>
          
          {/* Pulsing logo */}
          <Animated.View
            style={[
              styles.loadingLogo,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 1, 0.3],
                }),
                transform: [
                  {
                    scale: shimmerAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.9, 1.1, 0.9],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.logoText}>VF</Text>
          </Animated.View>
        </View>
        
        <View style={styles.loadingLabels}>
          {[...Array(8)].map((_, index) => (
            <View key={index} style={styles.skeletonLabel} />
          ))}
        </View>
      </View>
    );
  };

  const renderChart = () => {
    if (isLoading) {
      return renderLoadingGraph();
    }

    const chartWidth = width - 80;
    const chartHeight = 200;
    const maxWeight = Math.max(...weightHistory.map(d => d.weight));
    const minWeight = Math.min(...weightHistory.map(d => d.weight));
    const range = maxWeight - minWeight;
    const padding = range * 0.1;

    return (
      <Animated.View 
        style={[
          styles.chartContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
          {/* Y-axis labels */}
          <Animated.View 
            style={[
              styles.yAxisLabels,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.yAxisLabel}>100</Text>
            <Text style={styles.yAxisLabel}>80</Text>
            <Text style={styles.yAxisLabel}>60</Text>
          </Animated.View>

          {/* Chart area */}
          <View style={styles.chartArea}>
            {/* Data points and line */}
            {weightHistory.map((point, index) => {
              const x = (index / (weightHistory.length - 1)) * (chartWidth - 60);
              const y = chartHeight - 60 - ((point.weight - minWeight + padding) / (range + 2 * padding)) * (chartHeight - 80);
              
              return (
                <View key={point.date}>
                  {/* Animated line to next point */}
                  {index < weightHistory.length - 1 && (
                    <Animated.View
                      style={[
                        styles.chartLine,
                        {
                          left: x + 30,
                          top: y + 4,
                          width: lineAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, Math.sqrt(
                              Math.pow((chartWidth - 60) / (weightHistory.length - 1), 2) +
                              Math.pow(
                                ((weightHistory[index + 1].weight - minWeight + padding) / (range + 2 * padding)) * (chartHeight - 80) -
                                ((point.weight - minWeight + padding) / (range + 2 * padding)) * (chartHeight - 80),
                                2
                              )
                            )],
                          }),
                          transform: [
                            {
                              rotate: `${Math.atan2(
                                ((weightHistory[index + 1].weight - minWeight + padding) / (range + 2 * padding)) * (chartHeight - 80) -
                                ((point.weight - minWeight + padding) / (range + 2 * padding)) * (chartHeight - 80),
                                (chartWidth - 60) / (weightHistory.length - 1)
                              )}rad`,
                            },
                          ],
                        },
                      ]}
                    />
                  )}
                  
                  {/* Animated data point */}
                  <Animated.View
                    style={[
                      styles.dataPoint,
                      {
                        left: x + 26,
                        top: y,
                        opacity: pointAnimations[index],
                        transform: [
                          { scale: pointAnimations[index] },
                        ],
                      },
                      selectedDataPoint?.date === point.date && styles.selectedDataPoint,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.dataPointTouchable}
                      onPress={() => setSelectedDataPoint(point)}
                    />
                  </Animated.View>
                </View>
              );
            })}

            {/* Animated tooltip */}
            {selectedDataPoint && (
              <Animated.View 
                style={[
                  styles.tooltip,
                  { opacity: fadeAnim }
                ]}
              >
                <Text style={styles.tooltipDate}>
                  {selectedDataPoint.date === '2024-06-05' ? 'Jun 5' : selectedDataPoint.displayDate}
                </Text>
                <Text style={styles.tooltipWeight}>{selectedDataPoint.weight} kg</Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* X-axis labels */}
        <Animated.View 
          style={[
            styles.xAxisLabels,
            { opacity: fadeAnim }
          ]}
        >
          {weightHistory.map((point, index) => (
            <Text key={point.date} style={styles.xAxisLabel}>
              {point.displayDate}
            </Text>
          ))}
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Weight</Text>
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

        {/* Current Weight */}
        <View style={styles.currentWeightSection}>
          <Text style={styles.currentLabel}>CURRENT</Text>
          <Text style={styles.currentWeight}>{currentWeight} kg</Text>
          
          <View style={styles.dateNavigation}>
            <TouchableOpacity>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.dateRange}>May 29 - Jun 28</Text>
            <TouchableOpacity>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        {renderChart()}

        {/* Weekly Data */}
        <View style={styles.weeklySection}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.weeklyTitle}>Weight</Text>
            <TouchableOpacity style={styles.addWeightButton}>
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.weeklyFilter}>By Week</Text>
          </View>

          {weeklyData.map((week, index) => (
            <TouchableOpacity key={index} style={styles.weeklyItem}>
              <Text style={styles.weeklyPeriod}>{week.period}</Text>
              <View style={styles.weeklyRight}>
                <Text style={styles.weeklyWeight}>{week.weight} kg</Text>
                <ChevronRight size={16} color={colors.textTertiary} />
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
  currentWeightSection: {
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
  currentWeight: {
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
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  yAxisLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  chartArea: {
    marginLeft: 30,
    position: 'relative',
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.primary,
    transformOrigin: 'left center',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataPointTouchable: {
    width: 20,
    height: 20,
    position: 'absolute',
    top: -6,
    left: -6,
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
  tooltipWeight: {
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
  weeklySection: {
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
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weeklyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    flex: 1,
  },
  addWeightButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  weeklyFilter: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  weeklyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  weeklyPeriod: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  weeklyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklyWeight: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  // Loading animation styles
  loadingContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  loadingGraph: {
    height: 200,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 200,
  },
  skeletonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 30,
    paddingVertical: 20,
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  skeletonPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  loadingLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  loadingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  skeletonLabel: {
    width: 20,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
  },
});