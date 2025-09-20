import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Search, Filter, Calendar, Users, Clock, CreditCard as Edit, Trash2, Copy, X, ChevronRight } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { 
  WorkoutPlan, 
  ClientProfile,
  getWorkoutPlans,
  getTrainerClients,
  deleteWorkoutPlan
} from '@/lib/planDatabase';

export default function WorkoutPlansScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? 'light');
  const styles = createStyles(colors);

  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<WorkoutPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const filters = ['all', 'active', 'upcoming', 'completed'];

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    filterPlans();
  }, [plans, searchQuery, selectedFilter]);

  const loadPlans = async () => {
    try {
      const [loadedPlans, loadedClients] = await Promise.all([
        getWorkoutPlans(),
        getTrainerClients()
      ]);
      setPlans(loadedPlans);
      setClients(loadedClients);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPlans = () => {
    let filtered = plans;

    if (selectedFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(plan => {
        switch (selectedFilter) {
          case 'active':
            return plan.start_date <= today && plan.end_date >= today;
          case 'upcoming':
            return plan.start_date > today;
          case 'completed':
            return plan.end_date < today;
          default:
            return true;
        }
      });
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(plan =>
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getClientName(plan.client_id).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPlans(filtered);
  };

  const getClientName = (clientId: string): string => {
    const client = clients.find(c => c.id === clientId);
    return client?.full_name || 'Unknown Client';
  };

  const handleCreatePlan = () => {
    router.push('/create-plan');
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    router.push(`/create-plan?edit=${plan.id}`);
  };

  const handleDuplicatePlan = (plan: WorkoutPlan) => {
    router.push(`/create-plan?duplicate=${plan.id}`);
  };

  const handleDeletePlan = (plan: WorkoutPlan) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteWorkoutPlan(plan.id);
            if (success) {
              Alert.alert('Success', 'Plan deleted successfully');
              loadPlans();
            } else {
              Alert.alert('Error', 'Failed to delete plan');
            }
          }
        }
      ]
    );
  };

  const handleViewPlan = (plan: WorkoutPlan) => {
    router.push(`/plan-details/${plan.id}`);
  };

  const getPlanStatus = (plan: WorkoutPlan): { status: string; color: string } => {
    const today = new Date().toISOString().split('T')[0];
    
    if (plan.end_date < today) {
      return { status: 'Completed', color: colors.success };
    } else if (plan.start_date > today) {
      return { status: 'Upcoming', color: colors.warning };
    } else {
      return { status: 'Active', color: colors.primary };
    }
  };

  const getDuration = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} days`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  };

  const renderPlanCard = (plan: WorkoutPlan) => {
    const { status, color } = getPlanStatus(plan);
    const clientName = getClientName(plan.client_id);
    const duration = getDuration(plan.start_date, plan.end_date);

    return (
      <TouchableOpacity
        key={plan.id}
        style={styles.planCard}
        onPress={() => handleViewPlan(plan)}
        activeOpacity={0.7}
      >
        <View style={styles.planHeader}>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.clientName}>{clientName}</Text>
            <Text style={styles.planDates}>
              {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.planActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditPlan(plan)}
            >
              <Edit size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDuplicatePlan(plan)}
            >
              <Copy size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeletePlan(plan)}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.planMeta}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{duration}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {plan.schedule_type} schedule
            </Text>
          </View>
        </View>

        <View style={styles.planFooter}>
          <View style={[styles.statusBadge, { backgroundColor: `${color}15` }]}>
            <Text style={[styles.statusText, { color }]}>
              {status}
            </Text>
          </View>
          <ChevronRight size={16} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  // if (loading) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <View style={styles.loadingContainer}>
  //         <Text style={styles.loadingText}>Loading workout plans...</Text>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Workout Plans</Text>
        <TouchableOpacity
          onPress={handleCreatePlan}
          style={styles.createButton}
        >
          <Plus size={20} color={colors.primary} />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search plans..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.activeFilterChip
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterChipText,
              selectedFilter === filter && styles.activeFilterChipText
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Plans List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No workout plans found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedFilter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Create your first workout plan to get started'}
            </Text>
            {!searchQuery && selectedFilter === 'all' && (
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={handleCreatePlan}
              >
                <Text style={styles.createFirstButtonText}>Create Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {filteredPlans.length} Plan{filteredPlans.length !== 1 ? 's' : ''}
            </Text>
            {filteredPlans.map(renderPlanCard)}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Plans</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterOptions}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterOption,
                  selectedFilter === filter && styles.selectedFilter
                ]}
                onPress={() => {
                  setSelectedFilter(filter);
                  setShowFilterModal(false);
                }}
              >
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter && styles.selectedFilterText
                ]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
                {selectedFilter === filter && (
                  <Text style={styles.selectedIndicator}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
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
  filterButton: {
    padding: 4,
  },
  filtersContainer: {
    maxHeight: 40,
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: colors.surfaceSecondary,
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
  filterChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  planCard: {
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
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
    marginRight: 12,
  },
  planName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  clientName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  planDates: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  planActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planMeta: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
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
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createFirstButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  filterOptions: {
    padding: 20,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  selectedFilter: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  selectedFilterText: {
    color: colors.primary,
  },
  selectedIndicator: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.primary,
  },
});