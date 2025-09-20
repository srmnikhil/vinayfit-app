import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { LineChart } from 'react-native-chart-kit';

interface WeightMetricsCardProps {
  weightData: number[];
  dates: string[];
  unit: string;
  isLoading?: boolean;
  times?: string[]; // Add times prop
  currentValue?: number;
  currentDate?: string;
  currentTime?: string;
}

export default function WeightMetricsCard({
  weightData,
  dates,
  unit = 'KG',
  isLoading = false,
  times = [], // Default to empty array
  currentValue,
  currentDate,
  currentTime,
}: WeightMetricsCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const [cardWidth, setCardWidth] = React.useState(Dimensions.get('window').width - 40); // 40 = marginHorizontal * 2
  const horizontalPadding = 8; // match styles.container padding

  // Guard: If no data, show fallback UI
  if (!Array.isArray(weightData) || weightData.length === 0 || !Array.isArray(dates) || dates.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter-SemiBold' }]}>WEIGHT ({unit})</Text>
        <Text style={{ color: colors.textSecondary, marginVertical: 24, textAlign: 'center' }}>No weight data available.</Text>
      </View>
    );
  }

  // Get current value (last entry or override)
  const displayValue = currentValue !== undefined ? currentValue : weightData[weightData.length - 1];
  const displayTime = currentTime !== undefined ? currentTime : (times && times.length > 0 ? times[times.length - 1] : undefined);
  const displayDate = currentDate !== undefined ? currentDate : (dates && dates.length > 0 ? dates[dates.length - 1] : undefined);

  // Format dates to 'M/D' (e.g., '6/12') for x-axis labels
  const formattedLabels = dates.map(dateStr => {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    // If already in M/D format or invalid, return as is (but strip time if present)
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      // Remove any time part if present
      return dateStr.split(' ')[0];
    }
    return dateStr;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]} onLayout={e => setCardWidth(e.nativeEvent.layout.width)}>
      <Text style={[styles.title, { 
        color: colors.text,
        fontFamily: 'Inter-SemiBold' 
      }]}> 
        WEIGHT ({unit})
      </Text>
      <Text style={[styles.currentWeight, { 
        color: colors.text,
        fontFamily: 'Inter-SemiBold' 
      }]}> 
        {displayValue}
        {displayTime && (
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>  {displayTime}</Text>
        )}
      </Text>
      {displayDate && (
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>{displayDate}</Text>
      )}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: formattedLabels,
              datasets: [
                {
                  data: weightData,
                  color: () => colors.primary,
                  strokeWidth: 2,
                },
              ],
            }}
            width={Math.max(cardWidth - horizontalPadding * 2, 100)}
            height={180}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 1,
              color: (opacity = 1) => colors.textSecondary,
              labelColor: (opacity = 1) => colors.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.primary,
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: colors.border,
                strokeOpacity: 0.2,
              },
            }}
            bezier
            style={styles.chart}
            withShadow={false}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            fromZero={false}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 2,
  },
  title: {
    fontSize: 14,
    marginBottom: 8,
  },
  currentWeight: {
    fontSize: 24,
    marginBottom: 16,
  },
  chartContainer: {
    // alignItems removed for perfect fit
  },
  chart: {
    borderRadius: 16,
    marginVertical: 4,
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
