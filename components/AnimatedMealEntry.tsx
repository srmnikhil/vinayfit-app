import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { MoreHorizontal } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { FoodEntry, MealType } from '@/lib/foodJournal';

interface AnimatedMealEntryProps {
  entry: FoodEntry;
  mealType?: MealType;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (entry: FoodEntry) => void;
  delay?: number;
}

export const AnimatedMealEntry: React.FC<AnimatedMealEntryProps> = ({
  entry,
  mealType,
  onEdit,
  onDelete,
  delay = 0,
}) => {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    opacity.value = withDelay(delay, withSpring(1));
    translateY.value = withDelay(delay, withSpring(0));
    scale.value = withDelay(delay, withSpring(1));
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleMenuPress = () => {
    Alert.alert(
      'Meal Options',
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => onEdit(entry) },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry) },
      ]
    );
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.header}>
        <View style={styles.mealTypeContainer}>
          <View 
            style={[
              styles.mealTypeBadge, 
              { backgroundColor: mealType?.color + '20' }
            ]}
          >
            <Text style={styles.mealTypeEmoji}>{mealType?.emoji}</Text>
            <Text style={[styles.mealTypeName, { color: mealType?.color }]}>
              {mealType?.name}
            </Text>
          </View>
          <Text style={styles.mealTime}>{entry.time}</Text>
        </View>
        
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <MoreHorizontal size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{entry.title}</Text>
        {entry.description && (
          <Text style={styles.description}>{entry.description}</Text>
        )}
        
        {entry.photos && entry.photos.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.photos}
          >
            {entry.photos.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: photo.photo_url }}
                style={styles.photo}
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.nutritionInfo}>
          <View style={styles.nutritionBadge}>
            <Text style={styles.nutritionBadgeText}>{entry.calories} cal</Text>
          </View>
          {entry.protein_g > 0 && (
            <View style={styles.nutritionBadge}>
              <Text style={styles.nutritionBadgeText}>{entry.protein_g}g protein</Text>
            </View>
          )}
          {entry.carbs_g > 0 && (
            <View style={styles.nutritionBadge}>
              <Text style={styles.nutritionBadgeText}>{entry.carbs_g}g carbs</Text>
            </View>
          )}
          {entry.fat_g > 0 && (
            <View style={styles.nutritionBadge}>
              <Text style={styles.nutritionBadgeText}>{entry.fat_g}g fat</Text>
            </View>
          )}
        </View>

        {entry.notes && (
          <Text style={styles.notes}>{entry.notes}</Text>
        )}
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  mealTypeEmoji: {
    fontSize: 16,
  },
  mealTypeName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  mealTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  menuButton: {
    padding: 4,
  },
  content: {
    gap: 8,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  photos: {
    marginVertical: 8,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  nutritionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  nutritionBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nutritionBadgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#475569',
  },
  notes: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});