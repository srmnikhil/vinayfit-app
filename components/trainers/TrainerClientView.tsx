import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Users, MessageSquare, Phone, Video, TrendingUp, Calendar, Plus } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

const clients = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    avatar: '👩‍💼',
    joinDate: '2024-01-15',
    lastWorkout: '2 days ago',
    progress: 85,
    status: 'active',
    nextSession: 'Today 10:00 AM',
    completedWorkouts: 24,
    totalWorkouts: 28,
    goals: ['Weight Loss', 'Strength']
  },
  {
    id: 2,
    name: 'Mike Chen',
    email: 'mike@example.com',
    avatar: '👨‍💻',
    joinDate: '2024-02-01',
    lastWorkout: 'Today',
    progress: 92,
    status: 'active',
    nextSession: 'Tomorrow 11:30 AM',
    completedWorkouts: 31,
    totalWorkouts: 32,
    goals: ['Muscle Gain', 'Endurance']
  },
  {
    id: 3,
    name: 'Emma Wilson',
    email: 'emma@example.com',
    avatar: '👩‍🎨',
    joinDate: '2024-01-20',
    lastWorkout: '1 week ago',
    progress: 45,
    status: 'inactive',
    nextSession: 'Not scheduled',
    completedWorkouts: 12,
    totalWorkouts: 28,
    goals: ['Flexibility', 'Wellness']
  },
  {
    id: 4,
    name: 'David Lee',
    email: 'david@example.com',
    avatar: '👨‍🎯',
    joinDate: '2024-02-10',
    lastWorkout: 'Yesterday',
    progress: 78,
    status: 'active',
    nextSession: 'Today 3:00 PM',
    completedWorkouts: 18,
    totalWorkouts: 22,
    goals: ['Athletic Performance']
  }
];

export default function TrainerClientsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || client.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleClientPress = (client: any) => {
    router.push(`/client-detail/${client.id}`);
  };

  const renderClientCard = (client: any) => (
    <TouchableOpacity 
      key={client.id} 
      style={styles.clientCard}
      onPress={() => handleClientPress(client)}
    >
      <View style={styles.clientHeader}>
        <View style={styles.clientLeft}>
          <View style={styles.clientAvatarContainer}>
            <Text style={styles.clientAvatar}>{client.avatar}</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientEmail}>{client.email}</Text>
            <Text style={styles.clientLastWorkout}>Last workout: {client.lastWorkout}</Text>
            <View style={styles.clientGoals}>
              {client.goals.map((goal, index) => (
                <View key={index} style={styles.goalTag}>
                  <Text style={styles.goalText}>{goal}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        
        <View style={styles.clientRight}>
          <View style={styles.clientActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <MessageSquare size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Phone size={16} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Video size={16} color={colors.warning} />
            </TouchableOpacity>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: client.status === 'active' ? colors.success : colors.warning }
          ]}>
            <Text style={styles.statusText}>
              {client.status === 'active' ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.clientProgress}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Workout Completion</Text>
          <Text style={styles.progressText}>
            {client.completedWorkouts}/{client.totalWorkouts} completed
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${client.progress}%`,
                  backgroundColor: client.status === 'active' ? colors.success : colors.warning
                }
              ]} 
            />
          </View>
          <Text style={styles.progressPercentage}>{client.progress}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>My Clients</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Plus size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'active', 'inactive'].map((filter) => (
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

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
            <Users size={20} color={colors.primary} />
          </View>
          <Text style={styles.statNumber}>{clients.length}</Text>
          <Text style={styles.statLabel}>Total Clients</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
            <TrendingUp size={20} color={colors.success} />
          </View>
          <Text style={styles.statNumber}>{clients.filter(c => c.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
            <Calendar size={20} color={colors.warning} />
          </View>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Sessions Today</Text>
        </View>
      </View>

      {/* Clients List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Clients ({filteredClients.length})</Text>
        
        {filteredClients.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No clients found</Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'Try adjusting your search' 
                : 'You haven\'t added any clients yet'}
            </Text>
          </View>
        ) : (
          filteredClients.map(renderClientCard)
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
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
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  clientCard: {
    backgroundColor: colors.surface,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  clientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatarContainer: {
    marginRight: 16,
  },
  clientAvatar: {
    fontSize: 32,
    width: 48,
    height: 48,
    textAlign: 'center',
    lineHeight: 48,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  clientEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  clientLastWorkout: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  clientGoals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  goalTag: {
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  goalText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: colors.primary,
  },
  clientRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  clientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
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
  clientProgress: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentage: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 30,
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