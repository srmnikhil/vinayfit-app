import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { 
  Users, 
  Search, 
  Filter, 
  Apple, 
  TrendingUp,
  Calendar,
  MessageSquare,
  ChevronRight,
  Target,
  Clock
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { router } from 'expo-router';

interface NutritionClient {
  id: string;
  name: string;
  email: string;
  avatar: string;
  lastMealLogged: string;
  compliance: number;
  currentWeight: number;
  goalWeight: number;
  calorieGoal: number;
  avgCalories: number;
  status: 'on-track' | 'needs-attention' | 'excellent';
  nextConsultation?: string;
  mealPlan: string;
}

const mockClients: NutritionClient[] = [
  {
    id: '1',
    name: 'Maria Garcia',
    email: 'maria@example.com',
    avatar: '👩‍🍳',
    lastMealLogged: 'Today',
    compliance: 88,
    currentWeight: 65,
    goalWeight: 60,
    calorieGoal: 1800,
    avgCalories: 1750,
    status: 'on-track',
    nextConsultation: '2024-06-15',
    mealPlan: 'Mediterranean Diet'
  },
  {
    id: '2',
    name: 'David Lee',
    email: 'david@example.com',
    avatar: '👨‍💼',
    lastMealLogged: '2 days ago',
    compliance: 65,
    currentWeight: 85,
    goalWeight: 78,
    calorieGoal: 2200,
    avgCalories: 2450,
    status: 'needs-attention',
    nextConsultation: '2024-06-12',
    mealPlan: 'High Protein'
  },
  {
    id: '3',
    name: 'Anna Smith',
    email: 'anna@example.com',
    avatar: '👩‍🎨',
    lastMealLogged: 'Yesterday',
    compliance: 92,
    currentWeight: 58,
    goalWeight: 55,
    calorieGoal: 1600,
    avgCalories: 1580,
    status: 'excellent',
    nextConsultation: '2024-06-18',
    mealPlan: 'Plant-Based'
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'james@example.com',
    avatar: '👨‍🔬',
    lastMealLogged: 'Today',
    compliance: 76,
    currentWeight: 92,
    goalWeight: 85,
    calorieGoal: 2400,
    avgCalories: 2380,
    status: 'on-track',
    mealPlan: 'Balanced Macro'
  },
];

export default function NutritionistClientListView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || client.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return colors.success;
      case 'on-track': return colors.primary;
      case 'needs-attention': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'on-track': return 'On Track';
      case 'needs-attention': return 'Needs Attention';
      default: return 'Unknown';
    }
  };

  const handleClientPress = (client: NutritionClient) => {
    router.push(`/nutrition/client/${client.id}?name=${encodeURIComponent(client.name)}`);
  };

  const renderClientCard = (client: NutritionClient) => (
    <TouchableOpacity 
      key={client.id} 
      style={styles.clientCard}
      onPress={() => handleClientPress(client)}
    >
      <View style={styles.clientHeader}>
        <View style={styles.clientInfo}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>{client.avatar}</Text>
          </View>
          
          <View style={styles.clientDetails}>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientEmail}>{client.email}</Text>
            <Text style={styles.clientMealPlan}>{client.mealPlan}</Text>
          </View>
        </View>
        
        <View style={styles.clientStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(client.status) }]}>
            <Text style={styles.statusText}>{getStatusText(client.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.clientMetrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Last Meal</Text>
          <Text style={styles.metricValue}>{client.lastMealLogged}</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Compliance</Text>
          <Text style={[styles.metricValue, { color: getStatusColor(client.status) }]}>
            {client.compliance}%
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Avg Calories</Text>
          <Text style={styles.metricValue}>{client.avgCalories}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Weight Progress</Text>
          <Text style={styles.progressText}>
            {client.currentWeight}kg → {client.goalWeight}kg
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min((client.currentWeight - client.goalWeight) / (client.currentWeight - client.goalWeight + 10) * 100, 100)}%`,
                backgroundColor: getStatusColor(client.status)
              }
            ]} 
          />
        </View>
      </View>

      {client.nextConsultation && (
        <View style={styles.consultationInfo}>
          <Calendar size={14} color={colors.textSecondary} />
          <Text style={styles.consultationText}>
            Next consultation: {new Date(client.nextConsultation).toLocaleDateString()}
          </Text>
        </View>
      )}

      <View style={styles.clientActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Apple size={16} color={colors.primary} />
          <Text style={styles.actionText}>View Meals</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MessageSquare size={16} color={colors.success} />
          <Text style={styles.actionText}>Message</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Target size={16} color={colors.warning} />
          <Text style={styles.actionText}>Plan</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Clients</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { id: 'all', label: 'All Clients' },
          { id: 'excellent', label: 'Excellent' },
          { id: 'on-track', label: 'On Track' },
          { id: 'needs-attention', label: 'Needs Attention' },
        ].map((filter) => (
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

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mockClients.length}</Text>
          <Text style={styles.statLabel}>Total Clients</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {Math.round(mockClients.reduce((sum, client) => sum + client.compliance, 0) / mockClients.length)}%
          </Text>
          <Text style={styles.statLabel}>Avg Compliance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {mockClients.filter(c => c.status === 'excellent' || c.status === 'on-track').length}
          </Text>
          <Text style={styles.statLabel}>On Track</Text>
        </View>
      </View>

      {/* Client List */}
      <ScrollView style={styles.clientList} showsVerticalScrollIndicator={false}>
        {filteredClients.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No clients found</Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? "Try adjusting your search terms"
                : "Your client list will appear here"}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clientList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  clientCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clientInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontSize: 20,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  clientEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clientMealPlan: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  clientStatus: {
    alignItems: 'flex-end',
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
  clientMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  metricValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
  },
  progressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  consultationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  consultationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  clientActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
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