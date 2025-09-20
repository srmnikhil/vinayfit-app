import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Heart } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';

interface HeartRateCardProps {
  heartRateData: number[];
  times: string[];
  currentRate: number;
  restingRate: number;
  isLoading?: boolean;
}

export default function HeartRateCard({
  heartRateData,
  times,
  currentRate,
  restingRate,
  isLoading = false
}: HeartRateCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  
  // Calculate width based on screen size
  const [cardWidth, setCardWidth] = React.useState(Dimensions.get('window').width - 40); // 40 = marginHorizontal * 2
  const horizontalPadding = 8; // match styles.container padding
  
  // Format times to 'M/D' for x-axis labels
  const formattedLabels = times.map(timeStr => {
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return timeStr;
  });
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]} onLayout={e => setCardWidth(e.nativeEvent.layout.width)}>
      <View style={styles.header}>
        <Text style={[styles.title, { 
          color: colors.text,
          fontFamily: 'Inter-SemiBold'
        }]}>
          Heart Rate
        </Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.heartRateInfoContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary[900] }]}>
            <Heart size={24} color={'#FF5252'} fill={'#FF5252'} />
          </View>
          <View style={styles.heartRateTextContainer}>
            <Text style={[styles.heartRateValue, { 
              color: '#FF5252',
              fontFamily: 'Inter-SemiBold'
            }]}>
              {currentRate} <Text style={styles.bpmLabel}>BPM</Text>
            </Text>
            <Text style={[styles.heartRateLabel, { 
              color: colors.textSecondary,
              fontFamily: 'Inter-Regular'
            }]}>
              current
            </Text>
          </View>
        </View>
        
        <View style={styles.restingContainer}>
          <Text style={[styles.restingValue, { 
            color: colors.text,
            fontFamily: 'Inter-SemiBold'
          }]}>
            {restingRate} <Text style={[styles.bpmLabel, { color: colors.textSecondary }]}>BPM</Text>
          </Text>
          <Text style={[styles.restingLabel, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Regular'
          }]}>
            resting rate
          </Text>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: formattedLabels,
              datasets: [
                {
                  data: heartRateData,
                  color: () => '#FF5252', // Red line
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
              decimalPlaces: 0,
              color: (opacity = 1) => colors.textSecondary,
              labelColor: (opacity = 1) => colors.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#FF5252', // Red color for dots
                fill: '#FF5252',   // Red color for dots
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heartRateInfoContainer: {
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
  heartRateTextContainer: {
    justifyContent: 'center',
  },
  heartRateValue: {
    fontSize: 24,
  },
  bpmLabel: {
    fontSize: 14,
  },
  heartRateLabel: {
    fontSize: 12,
  },
  restingContainer: {
    alignItems: 'flex-end',
  },
  restingValue: {
    fontSize: 18,
  },
  restingLabel: {
    fontSize: 12,
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