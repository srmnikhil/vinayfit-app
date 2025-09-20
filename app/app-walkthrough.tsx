import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Clock, Users, Star } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface WalkthroughVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  category: string;
}

export default function AppWalkthroughScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'workouts', label: 'Workouts' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'progress', label: 'Progress' },
  ];

  const videos: WalkthroughVideo[] = [
    {
      id: '1',
      title: 'Welcome to VinayFit',
      description: 'Get started with your fitness journey',
      duration: '3:45',
      thumbnail: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
      category: 'getting-started',
    },
    {
      id: '2',
      title: 'Creating Your First Workout',
      description: 'Learn how to set up and customize workouts',
      duration: '5:20',
      thumbnail: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
      category: 'workouts',
    },
    {
      id: '3',
      title: 'Tracking Your Progress',
      description: 'Monitor your fitness journey effectively',
      duration: '4:15',
      thumbnail: 'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg',
      category: 'progress',
    },
    {
      id: '4',
      title: 'Nutrition Planning',
      description: 'Set up meal plans and track nutrition',
      duration: '6:30',
      thumbnail: 'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg',
      category: 'nutrition',
    },
  ];

  const filteredVideos = selectedCategory === 'all' 
    ? videos 
    : videos.filter(video => video.category === selectedCategory);

  const handleVideoPress = (video: WalkthroughVideo) => {
    // In a real app, this would open a video player
    console.log('Playing video:', video.title);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>App Walkthrough</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introduction}>
          <Text style={styles.introTitle}>Learn VinayFit</Text>
          <Text style={styles.introDescription}>
            Watch these helpful videos to get the most out of your fitness app experience.
          </Text>
        </View>

        {/* Category Filter */}
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
                selectedCategory === category.id && styles.activeCategoryChip,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.activeCategoryText,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Videos List */}
        <View style={styles.videosList}>
          {filteredVideos.map((video) => (
            <TouchableOpacity
              key={video.id}
              style={styles.videoCard}
              onPress={() => handleVideoPress(video)}
            >
              <View style={styles.thumbnailContainer}>
                <View style={styles.thumbnail}>
                  <View style={styles.playButton}>
                    <Play size={24} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.durationBadge}>
                  <Clock size={12} color="#FFFFFF" />
                  <Text style={styles.durationText}>{video.duration}</Text>
                </View>
              </View>
              
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <Text style={styles.videoDescription}>{video.description}</Text>
                
                <View style={styles.videoMeta}>
                  <View style={styles.metaItem}>
                    <Users size={14} color={colors.textTertiary} />
                    <Text style={styles.metaText}>1.2k views</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Star size={14} color={colors.warning} />
                    <Text style={styles.metaText}>4.8</Text>
                  </View>
                </View>
              </View>
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
  content: {
    flex: 1,
  },
  introduction: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  introTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 12,
  },
  introDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
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
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  videosList: {
    paddingHorizontal: 20,
  },
  videoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnailContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: colors.surfaceSecondary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  videoInfo: {
    padding: 16,
  },
  videoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
  },
  videoDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  videoMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 4,
  },
});