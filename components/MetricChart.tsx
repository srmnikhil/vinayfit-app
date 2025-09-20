import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export interface MetricChartPoint {
  date: string;
  value: number;
}

interface MetricChartProps {
  data: MetricChartPoint[];
  colors: any;
  height?: number;
  widthOverride?: number;
}

export const MetricChart: React.FC<MetricChartProps> = ({ data, colors, height = 200, widthOverride }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyChart, { height }]}> 
        <Text style={{ color: colors.textSecondary }}>No data</Text>
      </View>
    );
  }

  const chartWidth = widthOverride || width - 120;
  const chartHeight = height;
  const chartPadding = 40;
  const availableWidth = chartWidth - chartPadding;
  const availableHeight = chartHeight - 40;

  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;

  // Calculate chart points
  const points = data.map((point, index) => {
    const x = chartPadding + (index / Math.max(data.length - 1, 1)) * availableWidth;
    const normalizedValue = (point.value - min) / range;
    const y = 20 + (1 - normalizedValue) * availableHeight;
    return { ...point, x, y };
  });

  // Y-axis labels
  const yLabels = [max, (max + min) / 2, min].map(v => v.toFixed(1));

  // X-axis labels (show at most 4, spaced)
  const xLabelIndexes = points.length <= 4 ? points.map((_, i) => i) : [0, Math.floor(points.length/3), Math.floor(2*points.length/3), points.length-1];

  return (
    <View style={[styles.chartContainer, { height: chartHeight }]}> 
      <View style={styles.chartWrapper}>
        {/* Y-Axis Labels */}
        <View style={styles.yAxisLabels}>
          {yLabels.map((label, idx) => (
            <Text key={idx} style={[styles.yAxisLabel, { color: colors.textTertiary }]}>{label}</Text>
          ))}
        </View>
        {/* Chart Area */}
        <View style={[styles.chartArea, { width: chartWidth - 40, height: chartHeight - 40 }]}> 
          {/* Chart lines */}
          {points.map((point, idx) => {
            if (idx === 0) return null;
            const prev = points[idx - 1];
            const dx = point.x - prev.x;
            const dy = point.y - prev.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View
                key={`line-${idx}`}
                style={{
                  position: 'absolute',
                  left: prev.x - chartPadding,
                  top: prev.y - 20,
                  width: length,
                  height: 2,
                  backgroundColor: colors.primary,
                  transform: [{ rotate: `${angle}deg` }],
                }}
              />
            );
          })}
          {/* Chart points */}
          {points.map((point, idx) => (
            <View
              key={`point-${idx}`}
              style={{
                position: 'absolute',
                left: point.x - chartPadding - 6,
                top: point.y - 20 - 6,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: colors.surface,
              }}
            />
          ))}
        </View>
      </View>
      {/* X-axis labels */}
      <View style={styles.xAxisLabels}>
        {xLabelIndexes.map(idx => (
          <Text key={idx} style={[styles.xAxisLabel, { left: points[idx].x - 30, color: colors.textTertiary }]}> 
            {points[idx].date}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    width: '100%',
  },
  chartWrapper: {
    flexDirection: 'row',
    height: 160,
    width: '100%',
  },
  yAxisLabels: {
    width: 40,
    justifyContent: 'space-between',
    paddingVertical: 10,
    height: 160,
  },
  yAxisLabel: {
    fontSize: 12,
    textAlign: 'right',
  },
  chartArea: {
    position: 'relative',
    backgroundColor: 'transparent',
    flex: 1,
  },
  xAxisLabels: {
    height: 20,
    position: 'relative',
    width: '100%',
    marginTop: 4,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    width: 60,
    textAlign: 'center',
  },
  emptyChart: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
