import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { Route } from 'lucide-react-native';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface WalkMapProps {
  route: Coordinate[];
  distance: number;
  duration: number;
  date: string;
}

export default function WalkMap({ 
  route, 
  distance, 
  duration,
  date 
}: WalkMapProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  
  // Format duration to minutes and seconds
  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  // Format distance to km with one decimal place
  const formatDistance = (distanceInMeters: number) => {
    const km = distanceInMeters / 1000;
    return `${km.toFixed(1)} km`;
  };

  // If no route data, show empty state
  if (!route || route.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { 
            color: colors.text,
            fontFamily: 'Inter-SemiBold'
          }]}>
            Recent Activity
          </Text>
        </View>
        <View style={styles.noDataContainer}>
          <Route size={48} color={colors.textSecondary} />
          <Text style={[styles.noDataText, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Medium'
          }]}>
            No recent walk activities
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { 
          color: colors.text,
          fontFamily: 'Inter-SemiBold'
        }]}>
          Recent Activity
        </Text>
        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Regular'
          }]}>
            {date}
          </Text>
        </View>
      </View>
      
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.border }]}>
        <Route size={48} color={colors.textSecondary} />
        <Text style={[styles.mapPlaceholderText, { 
          color: colors.textSecondary,
          fontFamily: 'Inter-Medium'
        }]}>
          Map view is not available on web
        </Text>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { 
            color: colors.primary,
            fontFamily: 'Inter-SemiBold'
          }]}>
            {formatDistance(distance)}
          </Text>
          <Text style={[styles.statLabel, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Regular'
          }]}>
            Distance
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { 
            color: colors.primary,
            fontFamily: 'Inter-SemiBold'
          }]}>
            {formatDuration(duration)}
          </Text>
          <Text style={[styles.statLabel, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Regular'
          }]}>
            Duration
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { 
            color: colors.primary,
            fontFamily: 'Inter-SemiBold'
          }]}>
            {(distance / 1000 / (duration / 60)).toFixed(1)} km/h
          </Text>
          <Text style={[styles.statLabel, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Regular'
          }]}>
            Avg Speed
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
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
  dateContainer: {
    backgroundColor: 'rgba(0, 191, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 12,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    marginTop: 16,
    fontSize: 16,
  },
});