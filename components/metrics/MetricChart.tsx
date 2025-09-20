import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface MetricDataPoint {
  date: string;
  value: number;
}

interface MetricChartProps {
  data: MetricDataPoint[];
  unit: string;
  colors: any;
  showYAxis?: boolean;
  showXAxis?: boolean;
  showTrend?: boolean;
  onPointPress?: (point: MetricDataPoint, index: number) => void;
  lineColor?: string;
  pointColor?: string;
  fillArea?: boolean;
  animated?: boolean;
  aspectRatio?: number;
  minHeight?: number;
  maxHeight?: number;
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  date: string;
  index: number;
}

// Custom hook for screen dimensions
const useScreenDimensions = () => {
  const [dimensions, setDimensions] = useState({
    width: screenWidth,
    height: screenHeight,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
};

// Chart Line Component with better performance
const ChartLine: React.FC<{ 
  points: ChartPoint[]; 
  colors: any; 
  lineColor?: string;
  strokeWidth?: number;
}> = ({ points, colors, lineColor, strokeWidth = 2 }) => {
  if (points.length < 2) return null;
  
  const lines = useMemo(() => {
    return points.slice(1).map((point, index) => {
      const prevPoint = points[index];
      const dx = point.x - prevPoint.x;
      const dy = point.y - prevPoint.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      return {
        key: `line-${index}`,
        style: {
          position: 'absolute' as const,
          left: prevPoint.x,
          top: prevPoint.y,
          width: length,
          height: strokeWidth,
          backgroundColor: lineColor || colors.primary,
          transform: [{ rotate: `${angle}deg` }],
          transformOrigin: 'left center' as const,
        }
      };
    });
  }, [points, lineColor, colors.primary, strokeWidth]);
  
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {lines.map((line) => (
        <View key={line.key} style={line.style} />
      ))}
    </View>
  );
};

// Responsive Grid Lines
const GridLines: React.FC<{
  chartWidth: number;
  chartHeight: number;
  colors: any;
  yAxisValues: number[];
  padding: number;
}> = ({ chartWidth, chartHeight, colors, yAxisValues, padding }) => {
  const gridColor = `${colors.textTertiary}20`;
  
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Horizontal grid lines */}
      {yAxisValues.map((_, index) => (
        <View
          key={`hgrid-${index}`}
          style={[
            styles.gridLine,
            {
              top: padding + (index * (chartHeight - padding * 2)) / (yAxisValues.length - 1),
              left: padding,
              width: chartWidth - padding * 2,
              backgroundColor: gridColor,
            }
          ]}
        />
      ))}
      
      {/* Vertical grid lines */}
      {Array.from({ length: 5 }, (_, index) => (
        <View
          key={`vgrid-${index}`}
          style={[
            styles.gridLine,
            {
              left: padding + (index * (chartWidth - padding * 2)) / 4,
              top: padding,
              height: chartHeight - padding * 2,
              width: 1,
              backgroundColor: gridColor,
            }
          ]}
        />
      ))}
    </View>
  );
};

export const MetricChart: React.FC<MetricChartProps> = ({
  data,
  unit,
  colors,
  showYAxis = true,
  showXAxis = true,
  showTrend = true,
  onPointPress,
  lineColor,
  pointColor,
  fillArea = false,
  animated = false,
  aspectRatio = 2.5,
  minHeight = 120,
  maxHeight = 300,
}) => {
  const { width: currentWidth } = useScreenDimensions();
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  // Calculate responsive dimensions
  const containerPadding = 20;
  const chartWidth = currentWidth - containerPadding * 2;
  const calculatedHeight = Math.min(Math.max(chartWidth / aspectRatio, minHeight), maxHeight);
  const chartHeight = calculatedHeight;

  // Memoized chart calculations
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const chartPadding = 20;
    const yAxisWidth = showYAxis ? 50 : 0;
    const xAxisHeight = showXAxis ? 30 : 0;
    
    const availableWidth = chartWidth - yAxisWidth - chartPadding * 2;
    const availableHeight = chartHeight - xAxisHeight - chartPadding * 2;

    const values = data.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    // Add padding to min/max for better visualization
    const paddedMin = minValue - range * 0.1;
    const paddedMax = maxValue + range * 0.1;
    const paddedRange = paddedMax - paddedMin;

    const chartPoints: ChartPoint[] = data.map((point, index) => {
      const x = chartPadding + yAxisWidth + (index / Math.max(data.length - 1, 1)) * availableWidth;
      const normalizedValue = (point.value - paddedMin) / paddedRange;
      const y = chartPadding + (1 - normalizedValue) * availableHeight;
      
      return {
        x,
        y,
        value: point.value,
        date: point.date,
        index
      };
    });

    const yAxisLabels = [
      paddedMax.toFixed(1),
      ((paddedMin + paddedMax) / 2).toFixed(1),
      paddedMin.toFixed(1)
    ];

    return {
      chartPoints,
      yAxisLabels,
      yAxisValues: [paddedMax, (paddedMin + paddedMax) / 2, paddedMin],
      availableWidth,
      availableHeight,
      chartPadding,
      yAxisWidth,
      xAxisHeight,
      values,
      minValue,
      maxValue,
    };
  }, [data, chartWidth, chartHeight, showYAxis, showXAxis]);

  // Calculate trend
  const trend = useMemo(() => {
    if (!data || data.length < 2) return { direction: 'neutral', percentage: 0 };
    
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = lastValue - firstValue;
    const percentage = Math.abs((change / firstValue) * 100);
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: percentage.toFixed(1)
    };
  }, [data]);

  const handlePointPress = (point: MetricDataPoint, index: number) => {
    setSelectedPoint(index);
    onPointPress?.(point, index);
  };

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyChart, { height: chartHeight }]}>
        <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
          No data available
        </Text>
      </View>
    );
  }

  if (!chartData) return null;

  const {
    chartPoints,
    yAxisLabels,
    yAxisValues,
    chartPadding,
    yAxisWidth,
    xAxisHeight,
    values,
    minValue,
    maxValue,
  } = chartData;

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: containerPadding }}
    >
      {/* Trend Indicator */}
      {showTrend && (
        <View style={styles.trendContainer}>
          <View style={[styles.trendIndicator, { backgroundColor: `${colors.primary}15` }]}>
            {trend.direction === 'up' && <TrendingUp size={16} color={colors.success} />}
            {trend.direction === 'down' && <TrendingDown size={16} color={colors.error} />}
            {trend.direction === 'neutral' && <Minus size={16} color={colors.textSecondary} />}
            <Text style={[
              styles.trendText,
              { 
                color: trend.direction === 'up' ? colors.success : 
                       trend.direction === 'down' ? colors.error : 
                       colors.textSecondary 
              }
            ]}>
              {trend.percentage}%
            </Text>
          </View>
        </View>
      )}

      {/* Chart Container */}
      <View style={[styles.chartContainer, { height: chartHeight }]}>
        {/* Grid Lines */}
        <GridLines 
          chartWidth={chartWidth}
          chartHeight={chartHeight - xAxisHeight}
          colors={colors}
          yAxisValues={yAxisValues}
          padding={chartPadding}
        />

        <View style={styles.chartWrapper}>
          {/* Y-Axis Labels */}
          {showYAxis && (
            <View style={[styles.yAxisLabels, { 
              width: yAxisWidth, 
              height: chartHeight - xAxisHeight 
            }]}>
              {yAxisLabels.map((label, index) => (
                <Text key={index} style={[styles.yAxisLabel, { color: colors.textTertiary }]}>
                  {label}
                </Text>
              ))}
            </View>
          )}

          {/* Chart Area */}
          <View
            style={[
              styles.chartArea,
              {
                width: chartWidth - yAxisWidth,
                height: chartHeight - xAxisHeight,
              }
            ]}
          >
            {/* Fill Area */}
            {fillArea && (
              <View style={StyleSheet.absoluteFillObject}>
                <View
                  style={{
                    position: 'absolute',
                    left: chartPadding,
                    top: chartPoints[0]?.y || 0,
                    width: chartWidth - yAxisWidth - chartPadding * 2,
                    height: (chartHeight - xAxisHeight) - (chartPoints[0]?.y || 0),
                    backgroundColor: `${colors.primary}15`,
                    borderRadius: 4,
                  }}
                />
              </View>
            )}

            {/* Chart Line */}
            <ChartLine 
              points={chartPoints} 
              colors={colors} 
              lineColor={lineColor}
              strokeWidth={Platform.OS === 'ios' ? 2 : 3}
            />
            
            {/* Chart Points */}
            {chartPoints.map((point, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.chartPoint,
                  {
                    left: point.x - 6,
                    top: point.y - 6,
                    backgroundColor: pointColor || colors.primary,
                    borderColor: colors.surface,
                    transform: [{ scale: selectedPoint === index ? 1.3 : 1 }],
                    opacity: selectedPoint === null || selectedPoint === index ? 1 : 0.6,
                  }
                ]}
                onPress={() => handlePointPress(data[index], index)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              />
            ))}
          </View>
        </View>

        {/* X-Axis Labels */}
        {showXAxis && (
          <View style={[styles.chartLabels, { 
            width: chartWidth - yAxisWidth,
            marginLeft: yAxisWidth,
            height: xAxisHeight,
          }]}>
            {chartPoints.map((point, index) => {
              const shouldShow = data.length <= 5 || 
                index === 0 || 
                index === data.length - 1 || 
                index % Math.ceil(data.length / 3) === 0;
              
              if (!shouldShow) return null;
              
              const date = new Date(point.date);
              const label = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
              
              return (
                <Text
                  key={index}
                  style={[
                    styles.chartLabel,
                    { 
                      left: point.x - yAxisWidth - 20,
                      color: colors.textTertiary 
                    },
                  ]}
                >
                  {label}
                </Text>
              );
            })}
          </View>
        )}
      </View>

      {/* Chart Summary */}
      <View style={[styles.chartSummary, { borderTopColor: `${colors.textTertiary}20` }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Current</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {data[data.length - 1]?.value.toFixed(1)} {unit}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Average</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {(values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1)} {unit}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Range</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {minValue.toFixed(1)} - {maxValue.toFixed(1)} {unit}
          </Text>
        </View>
      </View>

      {/* Selected Point Details */}
      {selectedPoint !== null && (
        <View style={[styles.selectedPointDetails, { 
          backgroundColor: `${colors.primary}10`,
          borderColor: `${colors.primary}30`,
        }]}>
          <Text style={[styles.selectedPointTitle, { color: colors.text }]}>
            Selected Point
          </Text>
          <Text style={[styles.selectedPointValue, { color: colors.primary }]}>
            {data[selectedPoint].value.toFixed(1)} {unit}
          </Text>
          <Text style={[styles.selectedPointDate, { color: colors.textSecondary }]}>
            {new Date(data[selectedPoint].date).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  trendContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  chartWrapper: {
    flexDirection: 'row',
    flex: 1,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 11,
    textAlign: 'right',
    fontWeight: '500',
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
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chartLabels: {
    position: 'relative',
    justifyContent: 'center',
  },
  chartLabel: {
    position: 'absolute',
    fontSize: 10,
    textAlign: 'center',
    width: 40,
    fontWeight: '500',
  },
  gridLine: {
    position: 'absolute',
    height: 1,
  },
  emptyChart: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '500',
  },
  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedPointDetails: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedPointTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  selectedPointValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  selectedPointDate: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default MetricChart;