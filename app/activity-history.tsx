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
import { 
  ArrowLeft, 
  ChevronDown,
  Clock,
  Dumbbell,
  Star,
  ArrowUp,
  Footprints,
  Waves,
  Bike,
  Heart,
  Flame,
  MapPin,
  TrendingUp,
  Calendar as CalendarIcon,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface CalendarDay {
  date: number;
  dayOfWeek: string;
  hasActivity: boolean;
  isToday: boolean;
  isSelected: boolean;
  fullDate: string;
  isCurrentMonth: boolean;
}

interface ActivityEntry {
  id: string;
  date: string;
  name: string;
  duration: string;
  timeRange: string;
  calories?: number;
  distance?: number;
  heartRate?: number;
  notes?: string;
  rating?: {
    text: string;
    emoji: string;
  };
  type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other';
  icon: any;
  color: string;
}

// Extended sample activity data across multiple weeks/months
const activityHistory: ActivityEntry[] = [
  // January 2025 - Week 1
  {
    id: '1',
    date: '2025-01-03',
    name: 'Walk',
    duration: '1 hr',
    timeRange: '12:10 PM - 1:10 PM',
    calories: 280,
    distance: 5.2,
    heartRate: 125,
    type: 'cardio',
    icon: Footprints,
    color: '#10B981',
    notes: 'Nice walk in the park, felt energized'
  },
  {
    id: '2',
    date: '2025-01-03',
    name: 'Run',
    duration: '45 min',
    timeRange: '7:00 AM - 7:45 AM',
    calories: 420,
    distance: 6.8,
    heartRate: 165,
    type: 'cardio',
    icon: Footprints,
    color: '#3B82F6',
    rating: {
      text: 'Great workout',
      emoji: '💪'
    }
  },
  {
    id: '3',
    date: '2025-01-03',
    name: 'Free Diving',
    duration: '2 hr',
    timeRange: '2:30 PM - 4:30 PM',
    calories: 320,
    type: 'sports',
    icon: Waves,
    color: '#06B6D4',
    notes: 'Amazing underwater experience, reached 15m depth'
  },
  // January 2025 - Previous days
  {
    id: '4',
    date: '2025-01-02',
    name: 'Strength Training',
    duration: '1 hr 15 min',
    timeRange: '6:00 PM - 7:15 PM',
    calories: 380,
    type: 'strength',
    icon: Dumbbell,
    color: '#DC2626',
    rating: {
      text: 'Challenging',
      emoji: '🔥'
    }
  },
  {
    id: '5',
    date: '2025-01-01',
    name: 'Yoga Flow',
    duration: '45 min',
    timeRange: '7:30 AM - 8:15 AM',
    calories: 180,
    type: 'flexibility',
    icon: Heart,
    color: '#EC4899',
    rating: {
      text: 'Relaxing',
      emoji: '🧘‍♀️'
    }
  },
  // December 2024
  {
    id: '6',
    date: '2024-12-31',
    name: 'HIIT Workout',
    duration: '30 min',
    timeRange: '6:00 PM - 6:30 PM',
    calories: 350,
    heartRate: 175,
    type: 'cardio',
    icon: Flame,
    color: '#F59E0B',
    notes: 'Intense session, pushed my limits'
  },
  {
    id: '7',
    date: '2024-12-30',
    name: 'Swimming',
    duration: '1 hr',
    timeRange: '11:00 AM - 12:00 PM',
    calories: 400,
    distance: 2.1,
    type: 'cardio',
    icon: Waves,
    color: '#06B6D4'
  },
  {
    id: '8',
    date: '2024-12-28',
    name: 'Cycling',
    duration: '1 hr 30 min',
    timeRange: '8:00 AM - 9:30 AM',
    calories: 450,
    distance: 25.3,
    heartRate: 145,
    type: 'cardio',
    icon: Bike,
    color: '#8B5CF6'
  },
  // January 2025 - Week 2 (future dates for demo)
  {
    id: '9',
    date: '2025-01-10',
    name: 'Morning Run',
    duration: '35 min',
    timeRange: '6:30 AM - 7:05 AM',
    calories: 320,
    distance: 5.5,
    heartRate: 155,
    type: 'cardio',
    icon: Footprints,
    color: '#3B82F6'
  },
  {
    id: '10',
    date: '2025-01-12',
    name: 'Weight Training',
    duration: '1 hr',
    timeRange: '5:00 PM - 6:00 PM',
    calories: 300,
    type: 'strength',
    icon: Dumbbell,
    color: '#DC2626'
  }
];

export default function ActivityHistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [selectedDate, setSelectedDate] = useState(3);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date(2025, 0, 2)); // January 2, 2025 (Thursday)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'cardio' | 'strength' | 'flexibility' | 'sports'>('all');
  const [showStats, setShowStats] = useState(false);
  const [slideAnimation] = useState(new Animated.Value(0));

  // Get the start of the week (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Generate calendar days for the current week
  const generateCalendarDays = (): CalendarDay[] => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const weekStart = getWeekStart(currentWeekStart);
    const calendarDays: CalendarDay[] = [];
    const today = new Date();
    
    // Get dates with activities
    const activeDates = [...new Set(activityHistory.map(activity => activity.date))];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === today.toDateString();
      
      calendarDays.push({
        date: date.getDate(),
        dayOfWeek: days[i],
        hasActivity: activeDates.includes(dateString),
        isToday,
        isSelected: date.getDate() === selectedDate && 
                   date.getMonth() === currentWeekStart.getMonth() && 
                   date.getFullYear() === currentWeekStart.getFullYear(),
        fullDate: dateString,
        isCurrentMonth: date.getMonth() === currentWeekStart.getMonth(),
      });
    }
    
    return calendarDays;
  };

  const calendarDays = generateCalendarDays();

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    
    Animated.timing(slideAnimation, {
      toValue: -1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentWeekStart(newWeekStart);
      slideAnimation.setValue(1);
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentWeekStart(newWeekStart);
      slideAnimation.setValue(-1);
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  // Go to current week
  const goToCurrentWeek = () => {
    const today = new Date();
    setCurrentWeekStart(today);
    setSelectedDate(today.getDate());
  };

  // Filter activities based on selected date and filter
  const getFilteredActivities = () => {
    const selectedFullDate = calendarDays.find(day => day.isSelected)?.fullDate;
    
    let filtered = activityHistory;
    
    // Filter by date
    if (selectedFullDate) {
      filtered = filtered.filter(activity => activity.date === selectedFullDate);
    }
    
    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === selectedFilter);
    }
    
    return filtered;
  };

  // Get activities grouped by date for timeline view
  const getGroupedActivities = () => {
    const grouped: { [key: string]: ActivityEntry[] } = {};
    
    let filtered = activityHistory;
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === selectedFilter);
    }
    
    filtered.forEach(activity => {
      if (!grouped[activity.date]) {
        grouped[activity.date] = [];
      }
      grouped[activity.date].push(activity);
    });
    
    return grouped;
  };

  // Calculate weekly stats for current week
  const getWeeklyStats = () => {
    const weekStart = getWeekStart(currentWeekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekActivities = activityHistory.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= weekStart && activityDate <= weekEnd;
    });

    const totalCalories = weekActivities.reduce((sum, activity) => sum + (activity.calories || 0), 0);
    const totalDuration = weekActivities.reduce((sum, activity) => {
      const duration = activity.duration;
      const hours = duration.includes('hr') ? parseInt(duration.split(' hr')[0]) : 0;
      const minutes = duration.includes('min') ? parseInt(duration.split('min')[0].split(' ').pop() || '0') : 0;
      return sum + (hours * 60) + minutes;
    }, 0);
    const totalDistance = weekActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0);

    return {
      workouts: weekActivities.length,
      calories: totalCalories,
      duration: Math.round(totalDuration / 60 * 10) / 10, // Convert to hours
      distance: Math.round(totalDistance * 10) / 10
    };
  };

  const handleDateSelect = (day: CalendarDay) => {
    setSelectedDate(day.date);
    // If selecting a date from a different month, navigate to that week
    if (!day.isCurrentMonth) {
      const newDate = new Date(day.fullDate);
      setCurrentWeekStart(newDate);
    }
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase();
  };

  const formatWeekRange = () => {
    const weekStart = getWeekStart(currentWeekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
    const year = weekStart.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${weekStart.getDate()}-${weekEnd.getDate()}, ${year}`;
    } else {
      return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}, ${year}`;
    }
  };

  const isCurrentWeek = () => {
    const today = new Date();
    const weekStart = getWeekStart(currentWeekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return today >= weekStart && today <= weekEnd;
  };

  const renderCalendarDay = (day: CalendarDay) => (
    <TouchableOpacity
      key={`${day.fullDate}-${day.dayOfWeek}`}
      style={[
        styles.calendarDay,
        day.isSelected && styles.selectedDay,
        day.isToday && !day.isSelected && styles.todayDay,
        !day.isCurrentMonth && styles.otherMonthDay
      ]}
      onPress={() => handleDateSelect(day)}
    >
      <Text style={[
        styles.dayOfWeek,
        day.isSelected && styles.selectedDayText,
        !day.isCurrentMonth && styles.otherMonthText
      ]}>
        {day.dayOfWeek}
      </Text>
      <Text style={[
        styles.dayDate,
        day.isSelected && styles.selectedDayText,
        day.isToday && !day.isSelected && styles.todayText,
        !day.isCurrentMonth && styles.otherMonthText
      ]}>
        {day.date}
      </Text>
      {day.hasActivity && !day.isSelected && (
        <View style={[
          styles.activityDot,
          !day.isCurrentMonth && styles.otherMonthDot
        ]} />
      )}
    </TouchableOpacity>
  );

  const renderActivityEntry = (activity: ActivityEntry) => {
    const IconComponent = activity.icon;
    
    return (
      <TouchableOpacity key={activity.id} style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
            <IconComponent size={20} color={activity.color} />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{activity.name}</Text>
            <View style={styles.activityMeta}>
              <View style={styles.metaItem}>
                <Clock size={12} color={colors.textSecondary} />
                <Text style={styles.metaText}>{activity.duration}</Text>
              </View>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.metaText}>{activity.timeRange}</Text>
            </View>
          </View>
          {activity.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingEmoji}>{activity.rating.emoji}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.activityStats}>
          {activity.calories && (
            <View style={styles.statItem}>
              <Flame size={14} color={colors.warning} />
              <Text style={styles.statText}>{activity.calories} cal</Text>
            </View>
          )}
          {activity.distance && (
            <View style={styles.statItem}>
              <MapPin size={14} color={colors.info} />
              <Text style={styles.statText}>{activity.distance} km</Text>
            </View>
          )}
          {activity.heartRate && (
            <View style={styles.statItem}>
              <Heart size={14} color={colors.error} />
              <Text style={styles.statText}>{activity.heartRate} bpm</Text>
            </View>
          )}
        </View>

        {activity.notes && (
          <Text style={styles.activityNotes}>{activity.notes}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyDay = (date: string) => (
    <View key={date} style={styles.emptyDay}>
      <View style={styles.emptyDayHeader}>
        <View style={styles.emptyActivityDot} />
        <Text style={styles.emptyActivityDate}>{formatDateHeader(date)}</Text>
      </View>
      <Text style={styles.emptyDayText}>No activities recorded</Text>
    </View>
  );

  const weeklyStats = getWeeklyStats();
  const filteredActivities = getFilteredActivities();
  const groupedActivities = getGroupedActivities();

  const translateX = slideAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-width, 0, width],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Activity History</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowStats(!showStats)}
          >
            <TrendingUp size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly Stats (collapsible) */}
      {showStats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>This Week</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.workouts}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.duration}h</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.distance}km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { id: 'all', name: 'All', icon: CalendarIcon },
          { id: 'cardio', name: 'Cardio', icon: Heart },
          { id: 'strength', name: 'Strength', icon: Dumbbell },
          { id: 'flexibility', name: 'Flexibility', icon: Heart },
          { id: 'sports', name: 'Sports', icon: Waves }
        ].map((filter) => {
          const IconComponent = filter.icon;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.activeFilterChip
              ]}
              onPress={() => setSelectedFilter(filter.id as any)}
            >
              <IconComponent 
                size={16} 
                color={selectedFilter === filter.id ? '#FFFFFF' : colors.textSecondary} 
              />
              <Text style={[
                styles.filterText,
                selectedFilter === filter.id && styles.activeFilterText
              ]}>
                {filter.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Enhanced Calendar Week View with Navigation */}
      <View style={styles.calendarContainer}>
        {/* Week Navigation Header */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity 
            style={styles.weekNavButton}
            onPress={goToPreviousWeek}
          >
            <ChevronLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.weekRangeContainer}
            onPress={goToCurrentWeek}
          >
            <Text style={styles.weekRangeText}>{formatWeekRange()}</Text>
            {!isCurrentWeek() && (
              <Text style={styles.goToTodayText}>Tap to go to current week</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.weekNavButton}
            onPress={goToNextWeek}
          >
            <ChevronRight size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Animated Calendar Week */}
        <Animated.View 
          style={[
            styles.calendarWeek,
            { transform: [{ translateX }] }
          ]}
        >
          {calendarDays.map(renderCalendarDay)}
        </Animated.View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selected Date Activities */}
        {filteredActivities.length > 0 ? (
          <View style={styles.daySection}>
            <View style={styles.daySectionHeader}>
              <View style={styles.activityDot} />
              <Text style={styles.daySectionTitle}>
                {formatDateHeader(calendarDays.find(day => day.isSelected)?.fullDate || '')}
              </Text>
            </View>
            {filteredActivities.map(renderActivityEntry)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <CalendarIcon size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No activities found</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all' 
                ? 'No activities recorded for this date'
                : `No ${selectedFilter} activities found for this date`
              }
            </Text>
          </View>
        )}

        {/* Timeline View for Other Days */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineSectionTitle}>Recent Activities</Text>
          {Object.entries(groupedActivities)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .slice(0, 5)
            .map(([date, activities]) => {
              const isSelectedDate = calendarDays.find(day => day.isSelected)?.fullDate === date;
              if (isSelectedDate) return null;
              
              return (
                <View key={date} style={styles.timelineDay}>
                  <View style={styles.timelineDayHeader}>
                    <View style={styles.timelineDot} />
                    <Text style={styles.timelineDayTitle}>{formatDateHeader(date)}</Text>
                  </View>
                  {activities.slice(0, 2).map(activity => (
                    <View key={activity.id} style={styles.timelineActivity}>
                      <View style={[styles.timelineActivityIcon, { backgroundColor: `${activity.color}15` }]}>
                        <activity.icon size={16} color={activity.color} />
                      </View>
                      <View style={styles.timelineActivityInfo}>
                        <Text style={styles.timelineActivityName}>{activity.name}</Text>
                        <Text style={styles.timelineActivityMeta}>
                          {activity.duration} • {activity.calories ? `${activity.calories} cal` : activity.timeRange}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {activities.length > 2 && (
                    <Text style={styles.moreActivitiesText}>
                      +{activities.length - 2} more activities
                    </Text>
                  )}
                </View>
              );
            })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/activities')}
      >
        <ArrowUp size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
 filterContainer: {
  marginTop: 16,
  marginBottom: 8,
  maxHeight: 50, // This allows natural sizing up to 50px
},
  filterContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  calendarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekRangeContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  weekRangeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  goToTodayText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.primary,
    marginTop: 2,
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarDay: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    minWidth: 40,
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: colors.primary,
  },
  todayDay: {
    backgroundColor: colors.surfaceSecondary,
  },
  otherMonthDay: {
    opacity: 0.5,
  },
  dayOfWeek: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dayDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  todayText: {
    color: colors.primary,
  },
  otherMonthText: {
    color: colors.textTertiary,
  },
  activityDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  otherMonthDot: {
    backgroundColor: colors.textTertiary,
  },
  content: {
    flex: 1,
  },
  daySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  daySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  daySectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaSeparator: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  ratingContainer: {
    marginLeft: 8,
  },
  ratingEmoji: {
    fontSize: 20,
  },
  activityStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  activityNotes: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  timelineSection: {
    paddingHorizontal: 20,
  },
  timelineSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  timelineDay: {
    marginBottom: 24,
  },
  timelineDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  timelineDayTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.textTertiary,
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  timelineActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginLeft: 16,
  },
  timelineActivityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineActivityInfo: {
    flex: 1,
  },
  timelineActivityName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  timelineActivityMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  moreActivitiesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 16,
    fontStyle: 'italic',
  },
  emptyDay: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  emptyDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyActivityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  emptyActivityDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.textTertiary,
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  emptyDayText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textTertiary,
    marginLeft: 20,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
});