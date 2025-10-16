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
import { 
  ArrowLeft, 
  Plus, 
  Search,
  ChevronRight,
  Activity,
  Heart,
  Dumbbell,
  Zap,
  Target,
  Footprints,
  Bike,
  Waves,
  Mountain,
  Timer,
  Flame
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const categories = [
  { id: 'all', name: 'All' },
  { id: 'cardio', name: 'Cardio' },
  { id: 'studio', name: 'Studio' },
  { id: 'sports', name: 'Sports' },
  { id: 'field', name: 'Field Sp' },
];

const recentActivities = [
  {
    id: 1,
    name: 'Free Diving',
    icon: Waves,
    color: '#06B6D4',
    category: 'sports'
  },
  {
    id: 2,
    name: 'Run',
    icon: Footprints,
    color: '#10B981',
    category: 'cardio'
  },
  {
    id: 3,
    name: 'Walk',
    icon: Footprints,
    color: '#8B5CF6',
    category: 'cardio'
  },
];

const popularActivities = [
  {
    id: 4,
    name: 'Walk',
    icon: Footprints,
    color: '#8B5CF6',
    category: 'cardio'
  },
  {
    id: 5,
    name: 'Run',
    icon: Footprints,
    color: '#10B981',
    category: 'cardio'
  },
  {
    id: 6,
    name: 'Treadmill',
    icon: Timer,
    color: '#F59E0B',
    category: 'cardio'
  },
  {
    id: 7,
    name: 'HIIT Circuit',
    icon: Flame,
    color: '#EF4444',
    category: 'studio'
  },
  {
    id: 8,
    name: 'Cycling',
    icon: Bike,
    color: '#3B82F6',
    category: 'cardio'
  },
  {
    id: 9,
    name: 'Swimming',
    icon: Waves,
    color: '#06B6D4',
    category: 'sports'
  },
  {
    id: 10,
    name: 'Weight Training',
    icon: Dumbbell,
    color: '#DC2626',
    category: 'studio'
  },
  {
    id: 11,
    name: 'Yoga',
    icon: Heart,
    color: '#EC4899',
    category: 'studio'
  },
  {
    id: 12,
    name: 'Boxing',
    icon: Target,
    color: '#F97316',
    category: 'studio'
  },
  {
    id: 13,
    name: 'Hiking',
    icon: Mountain,
    color: '#059669',
    category: 'field'
  },
];

export default function ActivitiesScreen() {
  const colorScheme = useColorScheme();
  // const colors = getColors(colorScheme);
    const colors = getColors(colorScheme ?? 'light');
  
  const styles = createStyles(colors);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivities = popularActivities.filter(activity => {
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleActivitySelect = (activity: any) => {
    // Navigate to activity logging screen
    router.push(`/log-activity/${encodeURIComponent(activity.name)}`);
  };

  const handleCreateNew = () => {
    // Navigate to create new activity screen
    router.push('/create-activity');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> {/* Explicit background */}
      {/* Fallback View to ensure background covers all */}
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}> {/* Explicit background */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Activities</Text>
          <TouchableOpacity onPress={handleCreateNew} style={styles.createButton}>
            <Plus size={20} color={colors.primary} />
            <Text style={styles.createButtonText}>Create new</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}> {/* Remove backgroundColor here */}
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surfaceSecondary }]}> {/* Explicit background */}
            <Search size={20} color={colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search activities.."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Category Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={[styles.categoriesContainer, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.activeCategoryChip
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.activeCategoryText
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Most Recent Section */}
          {searchQuery === '' && (
            <View style={[styles.section, { backgroundColor: colors.background }]}> {/* Explicit background */}
              <Text style={styles.sectionTitle}>MOST RECENT</Text>
              {recentActivities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <TouchableOpacity
                    key={activity.id}
                    style={styles.activityItem}
                    onPress={() => handleActivitySelect(activity)}
                  >
                    <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}> 
                      {/* Render icon as component, not as value */}
                      {IconComponent ? <IconComponent size={20} color={activity.color} /> : null}
                    </View>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    <ChevronRight size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Most Popular / Filtered Activities Section */}
          <View style={[styles.section, { backgroundColor: colors.background }]}> {/* Explicit background */}
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'SEARCH RESULTS' : 'MOST POPULAR'}
            </Text>
            {filteredActivities.length === 0 ? (
              <View style={styles.emptyState}>
                <Activity size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No activities found</Text>
                <Text style={styles.emptyText}>
                  Try adjusting your search or category filter
                </Text>
              </View>
            ) : (
              filteredActivities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <TouchableOpacity
                    key={activity.id}
                    style={styles.activityItem}
                    onPress={() => handleActivitySelect(activity)}
                  >
                    <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}> 
                      {/* Render icon as component, not as value */}
                      {IconComponent ? <IconComponent size={20} color={activity.color} /> : null}
                    </View>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    <ChevronRight size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={{ height: 100, backgroundColor: colors.background }} />
        </ScrollView>
      </View>
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
    fontSize: 24,
    color: colors.text,
    flex: 1,
    textAlign: 'left',
    marginLeft: 16,
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
  content: {
    flex: 1,
    backgroundColor: colors.background, // Ensure background is always set
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
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
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCategoryChip: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeCategoryText: {
    color: colors.background,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityName: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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