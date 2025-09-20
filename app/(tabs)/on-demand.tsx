import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Play, 
  Clock, 
  Flame,
  Users,
  Star,
  Filter,
  Search
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');

const categories = [
  { id: 'all', name: 'All', count: 24 },
  { id: 'strength', name: 'Strength', count: 8 },
  { id: 'cardio', name: 'Cardio', count: 6 },
  { id: 'yoga', name: 'Yoga', count: 5 },
  { id: 'hiit', name: 'HIIT', count: 5 },
];

const workouts = [
  {
    id: 1,
    title: 'Morning Energy Boost',
    instructor: 'Sarah Johnson',
    duration: '15 min',
    calories: '150 cal',
    rating: 4.8,
    participants: 1247,
    category: 'cardio',
    difficulty: 'Beginner',
    thumbnail: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
    gradient: ['#FF9A9E', '#FECFEF'],
    gradientDark: ['#BE185D', '#BE123C'],
  },
  {
    id: 2,
    title: 'Upper Body Strength',
    instructor: 'Mike Chen',
    duration: '45 min',
    calories: '320 cal',
    rating: 4.9,
    participants: 892,
    category: 'strength',
    difficulty: 'Intermediate',
    thumbnail: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
    gradient: ['#667EEA', '#764BA2'],
    gradientDark: ['#1E40AF', '#3730A3'],
  },
  {
    id: 3,
    title: 'Relaxing Flow',
    instructor: 'Emma Wilson',
    duration: '60 min',
    calories: '180 cal',
    rating: 4.7,
    participants: 2156,
    category: 'yoga',
    difficulty: 'Beginner',
    thumbnail: 'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg',
    gradient: ['#4FACFE', '#00F2FE'],
    gradientDark: ['#0284C7', '#0891B2'],
  },
  {
    id: 4,
    title: 'Fat Burning HIIT',
    instructor: 'David Kim',
    duration: '30 min',
    calories: '400 cal',
    rating: 4.6,
    participants: 1654,
    category: 'hiit',
    difficulty: 'Advanced',
    thumbnail: 'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg',
    gradient: ['#F093FB', '#F5576C'],
    gradientDark: ['#BE185D', '#BE123C'],
  },
];

export default function OnDemandView() {
  const colorScheme = useColorScheme();
  // const colors = getColors(colorScheme);
    const colors = getColors(colorScheme ?? 'light');
  
  const styles = createStyles(colors);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredWorkouts = workouts.filter(workout => 
    selectedCategory === 'all' || workout.category === selectedCategory
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>On-demand</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Search size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Featured Workout */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Today</Text>
          <TouchableOpacity style={styles.featuredCard}>
            <LinearGradient
              colors={colorScheme === 'dark' ? ['#1E40AF', '#3730A3'] : ['#667EEA', '#764BA2']}
              style={styles.featuredGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featuredContent}>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredBadge}>TRENDING</Text>
                  <Text style={styles.featuredTitle}>
                    Full Body Power Hour
                  </Text>
                  <Text style={styles.featuredInstructor}>
                    with Alex Rodriguez
                  </Text>
                  <View style={styles.featuredMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={14} color="rgba(255, 255, 255, 0.8)" />
                      <Text style={styles.metaText}>60 min</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Flame size={14} color="rgba(255, 255, 255, 0.8)" />
                      <Text style={styles.metaText}>500 cal</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Users size={14} color="rgba(255, 255, 255, 0.8)" />
                      <Text style={styles.metaText}>3.2k</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.featuredPlayButton}>
                  <Play size={32} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
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
              <Text style={[
                styles.categoryCount,
                selectedCategory === category.id && styles.activeCategoryCount
              ]}>
                {category.count}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Workout List */}
        <View style={styles.workoutsList}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Workouts' : 
             categories.find(c => c.id === selectedCategory)?.name + ' Workouts'
            }
          </Text>
          
          {filteredWorkouts.map((workout) => (
            <TouchableOpacity key={workout.id} style={styles.workoutCard}>
              <LinearGradient
                colors={colorScheme === 'dark' ? workout.gradientDark : workout.gradient}
                style={styles.workoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.workoutOverlay}>
                  <View style={styles.workoutContent}>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutTitle}>{workout.title}</Text>
                      <Text style={styles.workoutInstructor}>
                        with {workout.instructor}
                      </Text>
                      
                      <View style={styles.workoutMeta}>
                        <View style={styles.metaItem}>
                          <Clock size={12} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.workoutMetaText}>{workout.duration}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Flame size={12} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.workoutMetaText}>{workout.calories}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Star size={12} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.workoutMetaText}>{workout.rating}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.workoutDifficulty}>
                        {workout.difficulty}
                      </Text>
                    </View>
                    
                    <TouchableOpacity style={styles.workoutPlayButton}>
                      <Play size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.workoutStats}>
                    <View style={styles.statItem}>
                      <Users size={14} color="rgba(255, 255, 255, 0.8)" />
                      <Text style={styles.statText}>
                        {workout.participants.toLocaleString()} joined
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

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
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  featuredSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
     maxHeight: 220,
   paddingBottom: 12,

  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  featuredCard: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 80, // reduced from 120
  },
  featuredGradient: {
    padding: 16, // reduced from 24
    minHeight: 80, // reduced from 120
  },
  featuredContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    height: '100%',
  },
  featuredInfo: {
    flex: 1,
  },
  featuredBadge: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  featuredTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredInstructor: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  featuredMeta: {
    flexDirection: 'row',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  featuredPlayButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  categoriesContainer: {
    marginTop: 16,
    marginBottom: 24,
    maxHeight: 60, // limit height to fit in header
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  categoryCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: colors.textTertiary,
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    textAlign: 'center',
  },
  activeCategoryCount: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  workoutsList: {
    paddingHorizontal: 20,
  },
  workoutCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  workoutGradient: {
    minHeight: 120,
  },
  workoutOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  workoutContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutInstructor: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  workoutMetaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 3,
  },
  workoutDifficulty: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutPlayButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutStats: {
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
});