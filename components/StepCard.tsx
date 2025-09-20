import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';

interface StepCardProps {
  steps: number[];
  dates: string[];
  goal: number;
  todaySteps: number;
  isLoading?: boolean;
}

export default function StepCard({ 
  steps, 
  dates, 
  goal, 
  todaySteps,
  isLoading = false 
}: StepCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  
  // Calculate width based on screen size
  const [cardWidth, setCardWidth] = React.useState(Dimensions.get('window').width - 40); // 40 = marginHorizontal * 2
  const horizontalPadding = 8; // match styles.container padding
  
  // Calculate percentage of goal
  const goalPercentage = Math.min(Math.round((todaySteps / goal) * 100), 100);
  
  // Format dates to 'M/D' for x-axis labels
  const formattedLabels = dates.map(dateStr => {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return dateStr;
  });
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]} onLayout={e => setCardWidth(e.nativeEvent.layout.width)}>
      <View style={styles.header}>
        <Text style={[styles.title, { 
          color: colors.text,
        }]}>
          Steps
        </Text>
        <View style={styles.goalContainer}>
          <Text style={[styles.goalText, { 
            color: colors.textSecondary,
          }]}>
            Goal: {goal.toLocaleString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View>
          <Text style={[styles.stepsCount, { 
            color: colors.primary,
          }]}>
            {todaySteps.toLocaleString()}
          </Text>
          <Text style={[styles.stepsLabel, { 
            color: colors.textSecondary,
          }]}>
            steps today
          </Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBackground, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.primary,
                  width: `${goalPercentage}%` 
                }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { 
            color: colors.textSecondary,
          }]}>
            {goalPercentage}% of daily goal
          </Text>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: formattedLabels,
              datasets: [
                {
                  data: steps,
                  color: () => colors.primary,
                  strokeWidth: 2,
                },
                {
                  data: Array(steps.length).fill(goal),
                  color: () => colors.textSecondary,
                  strokeWidth: 1,
                  strokeDashArray: [5, 5],
                },
              ],
            }}
            width={Math.max(cardWidth - horizontalPadding * 2, 100)}
            height={180}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
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
            fromZero={true}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
  },
  goalContainer: {
    backgroundColor: 'rgba(0, 191, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalText: {
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepsCount: {
    fontSize: 32,
  },
  stepsLabel: {
    fontSize: 14,
  },
  progressContainer: {
    width: '60%',
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  chartContainer: {
    marginTop: 0,
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chart: {
    marginTop: 4,
    borderRadius: 16,
  },
});