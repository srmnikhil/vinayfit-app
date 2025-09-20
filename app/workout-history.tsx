import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  Dumbbell,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { WorkoutSession, WorkoutTemplate } from '@/types/workout';
import { getSessions } from '@/utils/storage';
import { formatDuration, calculateSessionVolume } from '@/utils/workoutUtils';
import { getWorkoutTemplateById } from '@/lib/planDatabase';

const { width } = Dimensions.get('window');

interface SessionWithTemplate extends WorkoutSession {
  templateName: string;
}

export default function WorkoutHistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [sessions, setSessions] = useState<SessionWithTemplate[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithTemplate[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'completed', label: 'Completed' },
    { id: 'this-week', label: 'This Week' },
    { id: 'this-month', label: 'This Month' },
  ];

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, selectedFilter]);

  const loadWorkoutHistory = async () => {
    try {
      const allSessions = await getSessions();
      const clientId = 'current-user'; // TODO: Get from user context
      const clientSessions = allSessions.filter(session => session.clientId === clientId);
      
      // Load template names for each session
      const sessionsWithTemplates = await Promise.all(
        clientSessions.map(async (session) => {
          const template = await getWorkoutTemplateById(session.templateId);
          return {
            ...session,
            templateName: template?.name || 'Unknown Workout'
          };
        })
      );

      // Sort by date (newest first)
      sessionsWithTemplates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setSessions(sessionsWithTemplates);
    } catch (error) {
      console.error('Error loading workout history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = sessions;

    switch (selectedFilter) {
      case 'completed':
        filtered = sessions.filter(session => session.completed);
        break;
      case 'this-week':
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        filtered = sessions.filter(session => new Date(session.date) >= weekStart);
        break;
      case 'this-month':
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        filtered = sessions.filter(session => new Date(session.date) >= monthStart);
        break;
      default:
        filtered = sessions;
    }

    setFilteredSessions(filtered);
  };

  const getSessionDuration = (session: WorkoutSession): string => {
    if (session.startTime && session.endTime) {
      const start = new Date(`${session.date}T${session.startTime}`);
      const end = new Date(`${session.date}T${session.endTime}`);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      return formatDuration(durationMinutes);
    }
    return 'N/A';
  };

  const getSessionStats = () => {
    const completedSessions = sessions.filter(s => s.completed);
    const totalSessions = completedSessions.length;
    
    const totalVolume = completedSessions.reduce((sum, session) => {
      return sum + calculateSessionVolume(session);
    }, 0);

    const totalDuration = completedSessions.reduce((sum, session) => {
      if (session.startTime && session.endTime) {
        const start = new Date(`${session.date}T${session.startTime}`);
        const end = new Date(`${session.date}T${session.endTime}`);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60);
      }
      return sum;
    }, 0);

    return {
      totalSessions,
      totalVolume: Math.round(totalVolume),
      averageDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0
    };
  };

  const renderSessionCard = (session: SessionWithTemplate) => (
    <TouchableOpacity
      key={session.id}
      style={styles.sessionCard}
      onPress={() => router.push(`/session-details/${session.id}`)}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName}>{session.templateName}</Text>
          <Text style={styles.sessionDate}>
            {new Date(session.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}
          </Text>
        </View>
        
        <View style={[
          styles.statusBadge,
          { backgroundColor: session.completed ? colors.success : colors.warning }
        ]}>
          <Text style={styles.statusText}>
            {session.completed ? 'Completed' : 'In Progress'}
          </Text>
        </View>
      </View>

      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{getSessionDuration(session)}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Dumbbell size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{session.exercises.length} exercises</Text>
        </View>
        
        <View style={styles.statItem}>
          <TrendingUp size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>
            {calculateSessionVolume(session).toLocaleString()} kg
          </Text>
        </View>
      </View>

      {session.notes && (
        <Text style={styles.sessionNotes} numberOfLines={2}>
          {session.notes}
        </Text>
      )}
    </TouchableOpacity>
  );

  const stats = getSessionStats();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Workout History</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalSessions}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalVolume.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Volume (kg)</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{formatDuration(stats.averageDuration)}</Text>
          <Text style={styles.statLabel}>Avg Duration</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.activeFilterChip
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter.id && styles.activeFilterText
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sessions List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No workouts found</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all' 
                ? "You haven't completed any workouts yet. Start your first workout to see it here!"
                : "No workouts match the selected filter. Try adjusting your filter selection."}
            </Text>
          </View>
        ) : (
          filteredSessions.map(renderSessionCard)
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
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
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    maxHeight: 40,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sessionCard: {
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
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  sessionDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  sessionNotes: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
});