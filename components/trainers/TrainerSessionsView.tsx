import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Calendar, Clock, Users, Filter, Search, AlertCircle } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserContext';
import { getTrainerTrainingSessions } from '@/lib/trainingSessionQueries';
import { TrainingSession } from '@/types/workout';
import SessionFeedbackCard from '@/components/SessionFeedbackCard';
import { determineEnhancedSessionStatus, getSessionStatusColor, formatSessionStatus } from '@/utils/sessionUtils';

export default function TrainerSessionsView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const [selectedFilter, setSelectedFilter] = useState('all');

const { user } = useAuth();
const { userRole } = useUserRole();
const [sessions, setSessions] = useState<TrainingSession[]>([]);
const [loading, setLoading] = useState(false);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (user && userRole === 'trainer') {
    fetchSessions();
  }
}, [user, userRole]);

async function fetchSessions() {
  setLoading(true);
  try {
    const sessions = await getTrainerTrainingSessions(user!.id);
    setSessions(sessions);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    setError('Unable to fetch sessions.');
  } finally {
    setLoading(false);
  }
}

const onRefresh = async () => {
  setRefreshing(true);
  await fetchSessions();
  setRefreshing(false);
};

const filteredSessions = sessions.filter(session => {
  if (selectedFilter === 'all') return true;
  
  // Map different status values to filter categories
  if (selectedFilter === 'scheduled') {
    return session.status === 'scheduled' || session.status === 'confirmed';
  }
  
  if (selectedFilter === 'cancelled') {
    return session.status === 'cancelled' || session.status === 'no_show';
  }
  
  return session.status === selectedFilter;
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return colors.success;
    case 'scheduled':
    case 'confirmed': return colors.primary;
    case 'cancelled':
    case 'no_show': return colors.error;
    case 'ongoing': return colors.warning || '#FFA500';
    case 'missed': return colors.error;
    case 'pending': return colors.warning || '#FF9500';
    default: return colors.textSecondary;
  }
};

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // If it's already in HH:MM format, convert to 12-hour format
      if (timeString && timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
      }
      return timeString || 'Time TBD';
    } catch {
      return timeString || 'Time TBD';
    }
  };

  const renderSessionCard = (session: TrainingSession) => {
    // Determine the dynamic status for display
    const dynamicStatus = determineEnhancedSessionStatus(session);
    const displayStatus = formatSessionStatus(dynamicStatus);
    
    return (
    <View key={session.id} style={styles.sessionCard}>
      <TouchableOpacity 
        onPress={() => router.push(`/session-details/${session.id}`)}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTime}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={styles.sessionTimeText}>{formatTime(session.scheduled_time)}</Text>
            <Text style={styles.sessionDate}>{formatDate(session.scheduled_date)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dynamicStatus) }]}>
            <Text style={styles.statusText}>{displayStatus}</Text>
          </View>
        </View>
        
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionClient}>
            {session.client?.full_name || 'Unknown Client'}
          </Text>
          <Text style={styles.sessionType}>
            {session.template?.name || session.session_type || 'Training Session'}
          </Text>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionDetail}>
              📍 {session.location || 'Location TBD'}
            </Text>
            <Text style={styles.sessionDetail}>
              ⏱️ {session.duration_minutes || session.template?.estimated_duration || 60} min
            </Text>
          </View>
          {session.meeting_link && (
            <Text style={styles.meetingLink} numberOfLines={1}>
              🔗 Meeting Link Available
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Client Feedback Section - Only show for completed sessions from client's perspective */}
      <SessionFeedbackCard 
        session={session} 
        colors={colors} 
        onFeedbackSubmitted={fetchSessions}
      />
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Training Sessions</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/trainers/new-session')}
        >
          <Plus size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'scheduled', 'completed', 'cancelled'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.activeFilterTab
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter && styles.activeFilterTabText
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sessions List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sessions.filter(s => s.status === 'scheduled' || s.status === 'confirmed').length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sessions.filter(s => s.status === 'completed').length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sessions.filter(s => s.status === 'cancelled' || s.status === 'no_show').length}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading sessions...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color={colors.error} />
            <Text style={styles.errorTitle}>Error Loading Sessions</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchSessions}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No sessions found</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all' 
                ? 'You haven\'t scheduled any sessions yet' 
                : `No ${selectedFilter} sessions found`}
            </Text>
          </View>
        ) : (
          filteredSessions.map(renderSessionCard)
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/trainers/new-session')}
      >
        <Plus size={24} color="#FFFFFF" />
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
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
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
    fontSize: 24,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionTimeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  sessionDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
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
    textTransform: 'capitalize',
  },
  sessionInfo: {
    gap: 4,
  },
  sessionClient: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  sessionType: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  sessionDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  sessionDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
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
  fab: {
    position: 'absolute',
    bottom: 90,
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  meetingLink: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
});
