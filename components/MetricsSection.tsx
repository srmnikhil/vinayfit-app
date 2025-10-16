import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { MiniLineChart } from './MiniLineChart';

interface DataPoint {
  label: string;
  value: number;
}

interface Metric {
  key: string;
  label: string;
  data: DataPoint[];
}

interface MetricsSectionProps {
  metricsToShow?: string[]; // array of keys you want to show
}

const allMetrics: Metric[] = [
  {
    key: 'bodyweight',
    label: 'Bodyweight',
    data: [
      { label: 'Mon', value: 72 },
      { label: 'Tue', value: 71.8 },
      { label: 'Wed', value: 71.5 },
      { label: 'Thu', value: 71.7 },
      { label: 'Fri', value: 71.3 },
      { label: 'Sat', value: 71.2 },
      { label: 'Sun', value: 71 },
    ],
  },
  {
    key: 'sleep',
    label: 'Sleep',
    data: [
      { label: 'Mon', value: 7.5 },
      { label: 'Tue', value: 6.8 },
      { label: 'Wed', value: 7.2 },
      { label: 'Thu', value: 8.1 },
      { label: 'Fri', value: 7.8 },
      { label: 'Sat', value: 8.5 },
      { label: 'Sun', value: 7.9 },
    ],
  },
  {
    key: 'steps',
    label: 'Steps',
    data: [
      { label: 'Mon', value: 5000 },
      { label: 'Tue', value: 6200 },
      { label: 'Wed', value: 5800 },
      { label: 'Thu', value: 7000 },
      { label: 'Fri', value: 6400 },
      { label: 'Sat', value: 7100 },
      { label: 'Sun', value: 8000 },
    ],
  },
];

export const MetricsSection: React.FC<MetricsSectionProps> = ({
  metricsToShow = ['bodyweight'], // default metrics
}) => {
  const metrics = allMetrics.filter((metric) =>
    metricsToShow.includes(metric.key)
  );
  const { width: screenWidth } = useWindowDimensions();
  const horizontalPadding = 32; // ScrollView px-4 + container spacing
  const gap = 12; // gap between two cards

  return (
    <View className="flex-row flex-wrap justify-between">
      {metrics.map((metric, index) => {
        // Determine card width
        let cardWidth = (screenWidth - horizontalPadding - gap) / 2; // default half-width
        if (metrics.length === 1) cardWidth = screenWidth - horizontalPadding; // single metric full width
        if (metrics.length === 3 && index === 2)
          cardWidth = screenWidth - horizontalPadding; // third metric full width

        return (
          <View
            key={metric.key}
            className="bg-cardBackground border border-cardBorder rounded-2xl p-4 mb-3"
            style={{ width: cardWidth }}
          >
            <Text className="text-textPrimary text-[14px] font-inter-semibold mb-1">
              {metric.label}
            </Text>
            <Text className="text-textSecondary text-[12px] mb-3">7d</Text>
            <View style={{ alignItems: 'center' }}>
              <MiniLineChart
                data={metric.data}
                showDots
                width={cardWidth - 25}
              />
            </View>
            {/* subtract padding inside card for chart */}
          </View>
        );
      })}
    </View>
  );
};
