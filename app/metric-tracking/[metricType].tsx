import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
  PanResponder,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { Metric, MetricEntry, TimeRange } from '@/types/metrics';
import { getMetric } from '@/utils/metricsStorage';
import { getUserMetrics } from '@/lib/metricsDatabase';
import { getCurrentUser } from '@/lib/supabase';
import WeightMetricsCard from '@/components/WeightMetricsCard';

const { width, height } = Dimensions.get('window');

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  date: string;
  index: number;
}

interface GroupedEntry {
  period: string;
  entries: MetricEntry[];
  averageValue: number;
  latestValue: number;
  startDate: string;
  endDate: string;
}

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  initialSnap?: number;
  colors: any;
};

// Move createStyles outside so it can be reused
const createStyles = (colors: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  bottomSheetContainer: {
    flex: 1,
    // justifyContent: 'flex-end',
  },
  bottomSheetContent: {
   height: height,
  width: '100%', // <-- Add this line
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 20,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  bottomSheetBody: {
    flex: 1,
    padding: 20,
  },
});

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  title,
  snapPoints = [0.3, 0.6, 0.9],
  initialSnap = 0,
  colors,
}) => {
  const translateY = useRef(new Animated.Value(height)).current;
  const lastGestureDy = useRef(0);
  const currentSnapIndex = useRef(initialSnap);
  const [isVisible, setIsVisible] = useState(false); // Add this state

  const styles = createStyles(colors);

  const snapPointsPixels = snapPoints.map(point => height * (1 - point));

  useEffect(() => {
    if (visible) {
      setIsVisible(true); // Show immediately
      // Add a small delay to prevent the flash
      setTimeout(() => {
        Animated.spring(translateY, {
          toValue: snapPointsPixels[currentSnapIndex.current],
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }, 50); // 50ms delay
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false); // Hide after animation
      });
    }
  }, [visible]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      lastGestureDy.current = 0;
    },
    onPanResponderMove: (_, gestureState) => {
      const newTranslateY = snapPointsPixels[currentSnapIndex.current] + gestureState.dy;
      
      if (newTranslateY < snapPointsPixels[snapPointsPixels.length - 1]) {
        return;
      }
      
      const maxTranslateY = height + 50;
      const clampedTranslateY = Math.min(newTranslateY, maxTranslateY);
      
      translateY.setValue(clampedTranslateY);
      lastGestureDy.current = gestureState.dy;
    },
    onPanResponderRelease: (_, gestureState) => {
      const velocity = gestureState.vy;
      const currentY = snapPointsPixels[currentSnapIndex.current] + gestureState.dy;
      
      if (gestureState.dy > 100 || velocity > 0.5) {
        if (currentSnapIndex.current === 0) {
          onClose();
          return;
        } else {
          currentSnapIndex.current = Math.max(0, currentSnapIndex.current - 1);
        }
      } else if (gestureState.dy < -100 || velocity < -0.5) {
        currentSnapIndex.current = Math.min(snapPoints.length - 1, currentSnapIndex.current + 1);
      } else {
        let closestIndex = 0;
        let closestDistance = Math.abs(currentY - snapPointsPixels[0]);
        
        for (let i = 1; i < snapPointsPixels.length; i++) {
          const distance = Math.abs(currentY - snapPointsPixels[i]);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
          }
        }
        
        currentSnapIndex.current = closestIndex;
      }
      
      Animated.spring(translateY, {
        toValue: snapPointsPixels[currentSnapIndex.current],
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    },
  });

  const backdropOpacity = translateY.interpolate({
    inputRange: [snapPointsPixels[snapPointsPixels.length - 1], height],
    outputRange: [0.5, 0],
    extrapolate: 'clamp',
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.bottomSheetContainer,
            {
              transform: [{ translateY }],
            }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.bottomSheetContent, { backgroundColor: colors.background }]}>
            <View style={styles.bottomSheetHandle} />
            
            <View style={styles.bottomSheetHeader}>
              <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.bottomSheetBody}>
              {children}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Chart Line Component
// Fixed Chart Line Component
const ChartLine: React.FC<{ points: ChartPoint[]; colors: any }> = ({ points, colors }) => {
  if (points.length < 2) return null;
  
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {points.map((point, index) => {
        if (index === 0) return null;
        const prevPoint = points[index - 1];
        
        const dx = point.x - prevPoint.x;
        const dy = point.y - prevPoint.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        return (
          <View
            key={`line-${index}`}
            style={[
              {
                position: 'absolute',
                left: prevPoint.x,
                top: prevPoint.y,
                width: length,
                height: 2,
                backgroundColor: colors.primary,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: 'left center', // This ensures rotation happens from the left edge
              }
            ]}
          />
        );
      })}
    </View>
  );
};

export default function MetricTrackingScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? 'light');
  const { metricType } = useLocalSearchParams();

  const [metric, setMetric] = useState<Metric | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [selectedPeriod, setSelectedPeriod] = useState('By Week');
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentRangeIndex, setCurrentRangeIndex] = useState(0);
  const [filteredEntries, setFilteredEntries] = useState<MetricEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const timeRanges: TimeRange[] = ['1W', '1M', '2M', '1Y'];
  const periodOptions = ['By Week', 'By Month', 'By Year'];

  // Create styles function
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
      marginTop: 16,
      color: colors.textSecondary,
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: colors.error,
      fontSize: 18,
      fontWeight: '600',
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
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    content: {
      flex: 1,
    },
    rangeSelector: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 8,
    },
    rangeButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
    },
    activeRangeButton: {
      backgroundColor: colors.primary,
    },
    rangeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    activeRangeButtonText: {
      color: colors.surface,
    },
    currentSection: {
      padding: 20,
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    currentLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    currentValueContainer: {
      alignItems: 'flex-start',
    },
    currentValue: {
      fontSize: 36,
      fontWeight: '800',
      color: colors.primary,
      marginBottom: 8,
    },
    currentMeta: {
      gap: 4,
    },
    currentDate: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    currentTrend: {
      fontSize: 13,
      color: colors.textTertiary,
      fontWeight: '500',
    },
    chartNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    navButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surfaceSecondary,
    },
    navButtonDisabled: {
      opacity: 0.5,
    },
    chartTitle: {
      alignItems: 'center',
    },
    chartTitleText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    chartSubtitle: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    chartSection: {
      // backgroundColor: colors.surface,
      marginHorizontal: 20,
      // marginBottom: 20,
      // borderRadius: 16,
      // padding: 16,
      // borderWidth: 1,
      // borderColor: colors.border,
    },
    chartLoading: {
      height: 240,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    chartLoadingText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    chartContainer: {
      height: 240,
    },
    chartWrapper: {
      flexDirection: 'row',
      height: 200,
    },
    yAxisLabels: {
      width: 40,
      justifyContent: 'space-between',
      paddingVertical: 20,
    },
    yAxisLabel: {
      fontSize: 12,
      color: colors.textTertiary,
      textAlign: 'right',
    },
    chartArea: {
      position: 'relative',
      backgroundColor: 'transparent',
    },
    chartPoint: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.surface,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    chartPointActive: {
      width: 16,
      height: 16,
      borderRadius: 8,
      transform: [{ scale: 1.2 }],
    },
    chartPointTouchTarget: {
      position: 'absolute',
      width: 40,
      height: 40,
    },
    chartLabels: {
      height: 40,
      position: 'relative',
    },
    chartLabel: {
      position: 'absolute',
      fontSize: 10,
      color: colors.textTertiary,
      textAlign: 'center',
      width: 110,
    },
    emptyChart: {
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyChartText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    tooltip: {
      position: 'absolute',
      backgroundColor: colors.text,
      borderRadius: 8,
      padding: 8,
      minWidth: 100,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    tooltipContent: {
      alignItems: 'center',
    },
    tooltipDate: {
      color: colors.surface,
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 2,
    },
    tooltipValue: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: '700',
    },
    tooltipArrow: {
      position: 'absolute',
      bottom: -4,
      width: 8,
      height: 8,
      backgroundColor: colors.text,
      transform: [{ rotate: '45deg' }],
    },
    historySection: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    historyTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    historyTitleText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    periodSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
    },
    periodText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    historyItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyItemContent: {
      flex: 1,
    },
    historyPeriod: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    historySubtext: {
      fontSize: 13,
      color: colors.textTertiary,
    },
    historyValue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    historyValueText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    expandIcon: {
      // No transition in React Native - handled with state
    },
    expandIconRotated: {
      transform: [{ rotate: '180deg' }],
    },
    expandedContent: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      marginTop: -8,
    },
    entryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    entryInfo: {
      flex: 1,
    },
    entryDate: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    entryTime: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    entryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    periodSummary: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 4,
    },
    summaryText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    emptyHistory: {
      padding: 40,
      alignItems: 'center',
    },
    emptyHistoryText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    floatingButton: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    // Bottom Sheet Styles
    modalOverlay: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000',
    },
    bottomSheetContainer: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    bottomSheetContent: {
      height: height,
      width: width, // Changed from '100%' to explicit width
    maxWidth: width, // Add maxWidth constraint
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 20,
      alignSelf: 'center',
    position: 'relative',
    },
    bottomSheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: '#ccc',
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    bottomSheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bottomSheetTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    closeButton: {
      padding: 4,
    },
    bottomSheetBody: {
      flex: 1,
      padding: 20,
    },
    // Add Options Styles
    addOptionsContainer: {
      gap: 16,
    },
    addOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      gap: 16,
    },
    addOptionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addOptionContent: {
      flex: 1,
    },
    addOptionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    addOptionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    // Period Options Styles
    periodOptionsContainer: {
      gap: 8,
    },
    periodOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
    },
    selectedPeriodOption: {
      backgroundColor: colors.primary,
    },
    periodOptionText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    selectedPeriodOptionText: {
      color: colors.surface,
    },
    checkmark: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmarkText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
  });

  const styles = createStyles(colors);

  useEffect(() => {
    loadMetric();
  }, [metricType]);

  useEffect(() => {
    if (metric) {
      updateFilteredData();
    }
  }, [metric, selectedRange, currentRangeIndex]);

  const loadMetric = async () => {
    try {
      setLoading(true);
      
      // Load metric configuration from local storage
      const loadedMetric = await getMetric(metricType as any);
      setMetric(loadedMetric);
      
      // Load metric entries from Supabase
      const { user } = await getCurrentUser();
      if (user) {
        const entries = await getUserMetrics(user.id, metricType as string);
        
        // Transform Supabase entries to match MetricEntry format
        const transformedEntries: MetricEntry[] = entries.map(entry => ({
          id: entry.id,
          value: entry.value,
          date: entry.date,
          time: entry.time || '',
          unit: entry.unit || loadedMetric?.unit || '',
        }));
        
        // Update the metric with entries from Supabase
        setMetric(prev => prev ? { ...prev, entries: transformedEntries } : null);
      }
    } catch (error) {
      console.error('Error loading metric:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeForIndex = (range: TimeRange, index: number): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    let rangeDays = 0;
    switch (range) {
      case '1W':
        rangeDays = 7;
        break;
      case '1M':
        rangeDays = 30;
        break;
      case '2M':
        rangeDays = 60;
        break;
      case '1Y':
        rangeDays = 365;
        break;
    }

    const totalDaysBack = rangeDays * (index + 1);
    end.setDate(now.getDate() - (rangeDays * index));
    start.setDate(now.getDate() - totalDaysBack);

    return { start, end };
  };

  const updateFilteredData = async () => {
    if (!metric || !metric.entries) return;

    setIsUpdating(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    const { start, end } = getDateRangeForIndex(selectedRange, currentRangeIndex);
    
    const filtered = metric.entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    });

    const sortedEntries = [...filtered].sort((a, b) => {
      const aDateTime = new Date(`${a.date}T${a.time || '00:00:00'}`);
      const bDateTime = new Date(`${b.date}T${b.time || '00:00:00'}`);
      return aDateTime.getTime() - bDateTime.getTime();
    });

    setFilteredEntries(sortedEntries);
    setIsUpdating(false);
  };

  const groupEntriesByPeriod = (): GroupedEntry[] => {
    if (!filteredEntries.length) return [];

    const grouped: { [key: string]: MetricEntry[] } = {};

    filteredEntries.forEach(entry => {
      const date = new Date(entry.date);
      let key: string;

      switch (selectedPeriod) {
        case 'By Week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'By Month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'By Year':
          key = date.getFullYear().toString();
          break;
        default:
          key = entry.date;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(entry);
    });

    return Object.entries(grouped)
    .map(([period, entries]) => {
      const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const values = sortedEntries.map(e => e.value); // Use sorted entries
      const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      return {
        period: formatPeriodLabel(period, selectedPeriod),
        entries: sortedEntries,
        averageValue,
        latestValue: sortedEntries[0].value,
        startDate: sortedEntries[0].date,
        endDate: sortedEntries[sortedEntries.length - 1].date,
      };
    })
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  };

  const formatPeriodLabel = (period: string, periodType: string): string => {
    switch (periodType) {
      case 'By Week':
        const weekDate = new Date(period);
        const weekEnd = new Date(weekDate);
        weekEnd.setDate(weekDate.getDate() + 6);
        return `Week of ${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'By Month':
        const [year, month] = period.split('-');
        const monthDate = new Date(parseInt(year), parseInt(month) - 1);
        return monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'By Year':
        return period;
      default:
        return period;
    }
  };

  const getYAxisLabels = (): string[] => {
    if (filteredEntries.length === 0) return ['0', '50', '100'];
    
    const values = filteredEntries.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    return [
      max.toFixed(1),
      ((min + max) / 2).toFixed(1),
      min.toFixed(1)
    ];
  };

  const renderTooltip = () => {
    // This function is no longer needed as tooltip is handled by WeightMetricsCard
    return null;
  };

  const renderAddOptions = () => (
    <View style={styles.addOptionsContainer}>
      <TouchableOpacity
        style={styles.addOption}
        onPress={() => {
          setShowAddModal(false);
          // Navigate to add entry screen
          router.push(`/add-metric/${metricType}?mode=single`);
        }}
      >
        <View style={styles.addOptionIcon}>
          <Plus size={24} color={colors.primary} />
        </View>
        <View style={styles.addOptionContent}>
          <Text style={styles.addOptionTitle}>Add Single Value</Text>
          <Text style={styles.addOptionDescription}>Record a single measurement</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addOption}
        onPress={() => {
          setShowAddModal(false);
          // Navigate to bulk add screen
          router.push(`/add-metric/${metricType}?mode=bulk`);
        }}
      >
        <View style={styles.addOptionIcon}>
          <Plus size={24} color={colors.primary} />
        </View>
        <View style={styles.addOptionContent}>
          <Text style={styles.addOptionTitle}>Add Multiple Values</Text>
          <Text style={styles.addOptionDescription}>Record several measurements at once</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderPeriodOptions = () => (
    <View style={styles.periodOptionsContainer}>
      {periodOptions.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.periodOption,
            selectedPeriod === option && styles.selectedPeriodOption,
          ]}
          onPress={() => {
            setSelectedPeriod(option);
            setShowPeriodPicker(false);
          }}
        >
          <Text
            style={[
              styles.periodOptionText,
              selectedPeriod === option && styles.selectedPeriodOptionText,
            ]}
          >
            {option}
          </Text>
          {selectedPeriod === option && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading metric data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!metric) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Metric not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedEntries = groupEntriesByPeriod();

  const latestEntry = filteredEntries.length > 0 ? filteredEntries[filteredEntries.length - 1] : undefined;

  const chartData = filteredEntries.map(entry => {
    const dateObj = new Date(entry.date);
    const formattedDate = !isNaN(dateObj.getTime())
      ? `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
      : entry.date;
    return {
      value: entry.value,
      date: formattedDate,
      time: entry.time || ''
    };
  });
  
  const reversedChartData = [...chartData].reverse();
  console.log('reversedChartData', reversedChartData)
  const latestGraphEntry = reversedChartData.length > 0 ? reversedChartData[reversedChartData.length - 1] : undefined;
  const latestValue = latestGraphEntry ? latestGraphEntry.value : undefined;
  console.log('latestValue', latestValue)

  const latestTime = latestGraphEntry ? latestGraphEntry.time || '' : '';
  const latestDate = latestGraphEntry ? latestGraphEntry.date : '';

  const navigateRange = (direction: 'prev' | 'next') => {
    setCurrentRangeIndex(prev => {
      if (direction === 'prev') {
        return prev + 1;
      } else {
        return Math.max(0, prev - 1);
      }
    });
  };

  const getCurrentDateRange = (): string => {
    if (filteredEntries.length === 0) return '';

    const dates = filteredEntries.map(e => new Date(e.date)).sort((a, b) => a.getTime() - b.getTime());
    const start = dates[0];
    const end = dates[dates.length - 1];

    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined
    });

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{metric.name}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Range Selector */}
        <View style={styles.rangeSelector}>
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.rangeButton,
                selectedRange === range && styles.activeRangeButton,
              ]}
              onPress={() => {
                setSelectedRange(range);
                setCurrentRangeIndex(0);
              }}
            >
              <Text
                style={[
                  styles.rangeButtonText,
                  selectedRange === range && styles.activeRangeButtonText,
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Value Section */}
        <View style={styles.currentSection}>
          <Text style={styles.currentLabel}>CURRENT VALUE</Text>
          <View style={styles.currentValueContainer}>
            <Text style={styles.currentValue}>{latestValue !== undefined ? latestValue.toFixed(1) : 'N/A'}</Text>
            <View style={styles.currentMeta}>
              <Text style={styles.currentDate}>
                {latestDate}
                {latestTime ? ` at ${latestTime}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Chart Navigation */}
        <View style={styles.chartNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateRange('prev')}
          >
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.chartTitle}>
            <Text style={styles.chartTitleText}>
              {selectedRange} View
            </Text>
            <Text style={styles.chartSubtitle}>
              {filteredEntries.length > 0 ? getCurrentDateRange() : ''}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.navButton,
              currentRangeIndex === 0 && styles.navButtonDisabled,
            ]}
            onPress={() => navigateRange('next')}
            disabled={currentRangeIndex === 0}
          >
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <WeightMetricsCard
            weightData={reversedChartData.map(e => e.value)}
            dates={reversedChartData.map(e => e.date)}
            times={reversedChartData.map(e => e.time)}
            unit={metric.unit || ''}
            isLoading={isUpdating}
            currentValue={latestValue}
            currentDate={latestDate}
            currentTime={latestTime}
          />
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <View style={styles.historyTitle}>
              <Text style={styles.historyTitleText}>History</Text>
            </View>
            <TouchableOpacity
              style={styles.periodSelector}
              onPress={() => setShowPeriodPicker(true)}
            >
              <Text style={styles.periodText}>{selectedPeriod}</Text>
              <ChevronDown size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {groupedEntries.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No entries for this period</Text>
            </View>
          ) : (
            groupedEntries.map((group, index) => (
          <View key={index}>
            <TouchableOpacity
              style={styles.historyItem}
              onPress={() => {
                setExpandedPeriod(
                  expandedPeriod === group.period ? null : group.period
                );
              }}
            >
              <View style={styles.historyItemContent}>
                <Text style={styles.historyPeriod}>{group.period}</Text>
                <Text style={styles.historySubtext}>
                  {group.entries.length} entries • Avg: {group.averageValue.toFixed(1)}
                </Text>
              </View>
              <View style={styles.historyValue}>
                <Text style={styles.historyValueText}>
                  {group.latestValue}
                </Text>
                <ChevronDown
                  size={20}
                  color={colors.textSecondary}
                  style={[
                    styles.expandIcon,
                    expandedPeriod === group.period && styles.expandIconRotated,
                  ]}
                />
              </View>
            </TouchableOpacity>
            {expandedPeriod === group.period && (
              <View style={styles.expandedContent}>
                {group.entries.map((entry, entryIdx) => (
                  <View key={entryIdx} style={styles.entryItem}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryDate}>
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.entryTime}>
                        {entry.time
                          ? entry.time
                          : new Date(entry.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.entryValue}>{entry.value}</Text>
                  </View>
                ))}
                <View style={styles.periodSummary}>
                  <Text style={styles.summaryText}>
                    Total entries: {group.entries.length}
                  </Text>
                  <Text style={styles.summaryText}>
                    Average value: {group.averageValue.toFixed(2)}
                  </Text>
                  <Text style={styles.summaryText}>
                    Latest value: {group.latestValue}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ))
      )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={24} color={colors.surface} />
      </TouchableOpacity>

      {/* Add Options Bottom Sheet */}
      <BottomSheet
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Entry"
        snapPoints={[0.4, 0.6]}
        initialSnap={0}
        colors={colors}
      >
        {renderAddOptions()}
      </BottomSheet>

      <BottomSheet
        visible={showPeriodPicker}
        onClose={() => setShowPeriodPicker(false)}
        title="Group By Period"
        snapPoints={[0.4]}
        initialSnap={0}
        colors={colors}
      >
        {renderPeriodOptions()}
      </BottomSheet>
    </SafeAreaView>
  );
}