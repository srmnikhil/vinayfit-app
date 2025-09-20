import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Moon } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';

interface SleepCardProps {
  sleepData: number[];
  dates: string[];
  todaySleep: number;
  goal: number;
  isLoading?: boolean;
}

export default function SleepCard({
  sleepData,
  dates,
  todaySleep,
  goal,
  isLoading = false
}: SleepCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  
  // Calculate width based on screen size
  const [cardWidth, setCardWidth] = React.useState(Dimensions.get('window').width - 40); // 40 = marginHorizontal * 2
  const horizontalPadding = 8; // match styles.container padding
  
  // Calculate percentage of goal
  const goalPercentage = Math.min(Math.round((todaySleep / goal) * 100), 100);
  
  // Convert hours to hours and minutes format
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };
  
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
          fontFamily: 'Inter-SemiBold'
        }]}>
          Sleep
        </Text>
        <View style={styles.goalContainer}>
          <Text style={[styles.goalText, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Regular'
          }]}>
            Goal: {goal} hours
          </Text>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.sleepInfoContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryDark }]}>
            <Moon size={24} color={colors.primary} />
          </View>
          <View style={styles.sleepTextContainer}>
            <Text style={[styles.sleepValue, { 
              color: colors.primary,
              fontFamily: 'Inter-SemiBold'
            }]}>
              {formatHours(todaySleep)}
            </Text>
            <Text style={[styles.sleepLabel, { 
              color: colors.textSecondary,
              fontFamily: 'Inter-Regular'
            }]}>
              last night
            </Text>
          </View>
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
            fontFamily: 'Inter-Medium'
          }]}>
            {goalPercentage}% of goal
          </Text>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <BarChart
            data={{
              labels: formattedLabels,
              datasets: [
                {
                  data: sleepData,
                },
              ],
            }}
            width={Math.max(cardWidth - horizontalPadding * 2, 100)}
            height={180}
            yAxisSuffix="h"
            yAxisLabel=""
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
              barPercentage: 0.5,
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: colors.border,
                strokeOpacity: 0.2,
              },
            }}
            style={styles.chart}
            withInnerLines={true}
            withHorizontalLabels={true}
            showBarTops={false}
            fromZero={true}
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
  sleepInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sleepTextContainer: {
    justifyContent: 'center',
  },
  sleepValue: {
    fontSize: 18,
  },
  sleepLabel: {
    fontSize: 12,
  },
  progressContainer: {
    width: '50%',
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