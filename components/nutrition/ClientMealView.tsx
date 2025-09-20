import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Apple, Plus, Calendar, Clock, Flame, Target, TrendingUp, ChevronLeft, ChevronRight, CreditCard as Edit3, MessageSquare, Camera, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { router } from 'expo-router';

interface MealEntry {
  id: string;
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  foods: string[];
  photo?: string;
  notes?: string;
}

interface DailyNutrition {
  date: string;
  totalCalories: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
  meals: MealEntry[];
}

const mockNutritionData: DailyNutrition[] = [
  {
    date: '2024-06-10',
    totalCalories: 1850,
    targetCalories: 2000,
    protein: 120,
    carbs: 180,
    fat: 65,
    fiber: 28,
    water: 2.1,
    meals: [
      {
        id: '1',
        name: 'Breakfast',
        time: '8:00 AM',
        calories: 450,
        protein: 25,
        carbs: 45,
        fat: 18,
        fiber: 8,
        foods: ['Oatmeal with berries', 'Greek yogurt', 'Almonds'],
        photo: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        notes: 'Added extra berries for antioxidants'
      },
      {
        id: '2',
        name: 'Lunch',
        time: '12:30 PM',
        calories: 620,
        protein: 35,
        carbs: 55,
        fat: 22,
        fiber: 12,
        foods: ['Grilled chicken salad', 'Quinoa', 'Avocado', 'Olive oil dressing'],
        photo: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg'
      },
      {
        id: '3',
        name: 'Snack',
        time: '3:30 PM',
        calories: 180,
        protein: 12,
        carbs: 15,
        fat: 8,
        fiber: 3,
        foods: ['Apple with peanut butter'],
      },
      {
        id: '4',
        name: 'Dinner',
        time: '7:00 PM',
        calories: 600,
        protein: 48,
        carbs: 65,
        fat: 17,
        fiber: 5,
        foods: ['Baked salmon', 'Sweet potato', 'Steamed broccoli'],
        photo: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg'
      }
    ]
  }
];

export default function ClientMealView({ clientId, clientName }: { clientId: string; clientName: string }) {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [newMealData, setNewMealData] = useState({
    name: '',
    time: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    foods: '',
    notes: ''
  });

  const currentData = mockNutritionData[0]; // In real app, filter by selectedDate
  const calorieProgress = (currentData.totalCalories / currentData.targetCalories) * 100;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const handleMealPress = (meal: MealEntry) => {
    setSelectedMeal(meal);
    setShowMealModal(true);
  };

  const handleAddMeal = () => {
    // In real app, save meal data
    console.log('Adding meal:', newMealData);
    setNewMealData({
      name: '',
      time: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      foods: '',
      notes: ''
    });
    setShowAddMealModal(false);
  };

  const renderMacroCircle = (label: string, current: number, target: number, color: string) => {
    const percentage = Math.min((current / target) * 100, 100);
    
    return (
      <View style={styles.macroCircle}>
        <View style={styles.macroCircleContainer}>
          <View style={[styles.macroProgress, { 
            borderColor: color,
            borderTopColor: percentage > 0 ? color : colors.borderLight,
            transform: [{ rotate: `${(percentage / 100) * 360}deg` }]
          }]} />
          <View style={styles.macroCircleInner}>
            <Text style={styles.macroValue}>{current}g</Text>
          </View>
        </View>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroTarget}>Goal: {target}g</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.headerSubtitle}>Nutrition Tracking</Text>
        </View>
        <TouchableOpacity style={styles.messageButton}>
          <MessageSquare size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.dateNavButton}>
          <ChevronLeft size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </View>
        
        <TouchableOpacity onPress={() => navigateDate('next')} style={styles.dateNavButton}>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calorie Overview */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieHeader}>
            <Text style={styles.calorieTitle}>Daily Calories</Text>
            <Text style={styles.caloriePercentage}>{Math.round(calorieProgress)}%</Text>
          </View>
          
          <View style={styles.calorieProgress}>
            <View style={styles.calorieProgressBackground}>
              <View 
                style={[
                  styles.calorieProgressFill, 
                  { width: `${Math.min(calorieProgress, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.calorieText}>
              {currentData.totalCalories} / {currentData.targetCalories} kcal
            </Text>
          </View>
          
          <Text style={styles.calorieRemaining}>
            {currentData.targetCalories - currentData.totalCalories > 0 
              ? `${currentData.targetCalories - currentData.totalCalories} kcal remaining`
              : `${currentData.totalCalories - currentData.targetCalories} kcal over target`
            }
          </Text>
        </View>

        {/* Macronutrients */}
        <View style={styles.macroCard}>
          <Text style={styles.macroCardTitle}>Macronutrients</Text>
          <View style={styles.macroGrid}>
            {renderMacroCircle('Protein', currentData.protein, 150, colors.error)}
            {renderMacroCircle('Carbs', currentData.carbs, 200, colors.warning)}
            {renderMacroCircle('Fat', currentData.fat, 70, colors.success)}
          </View>
          
          <View style={styles.additionalNutrients}>
            <View style={styles.nutrientItem}>
              <Text style={styles.nutrientLabel}>Fiber</Text>
              <Text style={styles.nutrientValue}>{currentData.fiber}g / 30g</Text>
            </View>
            <View style={styles.nutrientItem}>
              <Text style={styles.nutrientLabel}>Water</Text>
              <Text style={styles.nutrientValue}>{currentData.water}L / 2.5L</Text>
            </View>
          </View>
        </View>

        {/* Meals */}
        <View style={styles.mealsSection}>
          <View style={styles.mealsSectionHeader}>
            <Text style={styles.mealsSectionTitle}>Meals</Text>
            <TouchableOpacity 
              style={styles.addMealButton}
              onPress={() => setShowAddMealModal(true)}
            >
              <Plus size={20} color={colors.primary} />
              <Text style={styles.addMealText}>Add Meal</Text>
            </TouchableOpacity>
          </View>

          {currentData.meals.map((meal) => (
            <TouchableOpacity 
              key={meal.id} 
              style={styles.mealCard}
              onPress={() => handleMealPress(meal)}
            >
              <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
                <View style={styles.mealCalories}>
                  <Text style={styles.mealCalorieNumber}>{meal.calories}</Text>
                  <Text style={styles.mealCalorieLabel}>kcal</Text>
                </View>
              </View>
              
              <View style={styles.mealMacros}>
                <View style={styles.mealMacro}>
                  <Text style={styles.mealMacroValue}>{meal.protein}g</Text>
                  <Text style={styles.mealMacroLabel}>Protein</Text>
                </View>
                <View style={styles.mealMacro}>
                  <Text style={styles.mealMacroValue}>{meal.carbs}g</Text>
                  <Text style={styles.mealMacroLabel}>Carbs</Text>
                </View>
                <View style={styles.mealMacro}>
                  <Text style={styles.mealMacroValue}>{meal.fat}g</Text>
                  <Text style={styles.mealMacroLabel}>Fat</Text>
                </View>
              </View>
              
              <View style={styles.mealFoods}>
                <Text style={styles.mealFoodsText}>
                  {meal.foods.join(', ')}
                </Text>
              </View>
              
              {meal.photo && (
                <View style={styles.mealPhotoContainer}>
                  <Camera size={16} color={colors.textSecondary} />
                  <Text style={styles.mealPhotoText}>Photo attached</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Meal Detail Modal */}
      <Modal
        visible={showMealModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMealModal(false)}
      >
        {selectedMeal && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowMealModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedMeal.name}</Text>
              <TouchableOpacity>
                <Edit3 size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.mealDetailCard}>
                <Text style={styles.mealDetailTime}>{selectedMeal.time}</Text>
                <Text style={styles.mealDetailCalories}>{selectedMeal.calories} kcal</Text>
                
                <View style={styles.mealDetailMacros}>
                  <View style={styles.mealDetailMacro}>
                    <Text style={styles.mealDetailMacroValue}>{selectedMeal.protein}g</Text>
                    <Text style={styles.mealDetailMacroLabel}>Protein</Text>
                  </View>
                  <View style={styles.mealDetailMacro}>
                    <Text style={styles.mealDetailMacroValue}>{selectedMeal.carbs}g</Text>
                    <Text style={styles.mealDetailMacroLabel}>Carbs</Text>
                  </View>
                  <View style={styles.mealDetailMacro}>
                    <Text style={styles.mealDetailMacroValue}>{selectedMeal.fat}g</Text>
                    <Text style={styles.mealDetailMacroLabel}>Fat</Text>
                  </View>
                  <View style={styles.mealDetailMacro}>
                    <Text style={styles.mealDetailMacroValue}>{selectedMeal.fiber}g</Text>
                    <Text style={styles.mealDetailMacroLabel}>Fiber</Text>
                  </View>
                </View>
              </View>

              <View style={styles.foodsSection}>
                <Text style={styles.foodsSectionTitle}>Foods</Text>
                {selectedMeal.foods.map((food, index) => (
                  <View key={index} style={styles.foodItem}>
                    <Text style={styles.foodName}>{food}</Text>
                  </View>
                ))}
              </View>

              {selectedMeal.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesSectionTitle}>Notes</Text>
                  <Text style={styles.notesText}>{selectedMeal.notes}</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMealModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddMealModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddMealModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Meal</Text>
            <TouchableOpacity onPress={handleAddMeal}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Meal Name</Text>
              <TextInput
                style={styles.input}
                value={newMealData.name}
                onChangeText={(text) => setNewMealData(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Breakfast, Lunch, Snack"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Time</Text>
              <TextInput
                style={styles.input}
                value={newMealData.time}
                onChangeText={(text) => setNewMealData(prev => ({ ...prev, time: text }))}
                placeholder="e.g., 8:00 AM"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formFieldHalf}>
                <Text style={styles.fieldLabel}>Calories</Text>
                <TextInput
                  style={styles.input}
                  value={newMealData.calories}
                  onChangeText={(text) => setNewMealData(prev => ({ ...prev, calories: text }))}
                  placeholder="450"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formFieldHalf}>
                <Text style={styles.fieldLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  value={newMealData.protein}
                  onChangeText={(text) => setNewMealData(prev => ({ ...prev, protein: text }))}
                  placeholder="25"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formFieldHalf}>
                <Text style={styles.fieldLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  value={newMealData.carbs}
                  onChangeText={(text) => setNewMealData(prev => ({ ...prev, carbs: text }))}
                  placeholder="45"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formFieldHalf}>
                <Text style={styles.fieldLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.input}
                  value={newMealData.fat}
                  onChangeText={(text) => setNewMealData(prev => ({ ...prev, fat: text }))}
                  placeholder="18"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Foods</Text>
              <TextInput
                style={styles.textArea}
                value={newMealData.foods}
                onChangeText={(text) => setNewMealData(prev => ({ ...prev, foods: text }))}
                placeholder="List foods separated by commas"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.textArea}
                value={newMealData.notes}
                onChangeText={(text) => setNewMealData(prev => ({ ...prev, notes: text }))}
                placeholder="Any additional notes..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
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
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  clientName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  messageButton: {
    padding: 4,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
  },
  dateNavButton: {
    padding: 8,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  calorieCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  caloriePercentage: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.primary,
  },
  calorieProgress: {
    marginBottom: 8,
  },
  calorieProgressBackground: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    marginBottom: 8,
  },
  calorieProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  calorieText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  calorieRemaining: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  macroCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  macroCardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  macroCircle: {
    alignItems: 'center',
  },
  macroCircleContainer: {
    width: 80,
    height: 80,
    position: 'relative',
    marginBottom: 8,
  },
  macroProgress: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: colors.borderLight,
  },
  macroCircleInner: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 34,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  macroLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  macroTarget: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.textSecondary,
  },
  additionalNutrients: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  nutrientValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  mealsSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  mealsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealsSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addMealText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  mealCard: {
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
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  mealTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  mealCalories: {
    alignItems: 'center',
  },
  mealCalorieNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.primary,
  },
  mealCalorieLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  mealMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  mealMacro: {
    alignItems: 'center',
  },
  mealMacroValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  mealMacroLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  mealFoods: {
    marginBottom: 8,
  },
  mealFoodsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  mealPhotoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealPhotoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  mealDetailCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  mealDetailTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  mealDetailCalories: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: colors.primary,
    marginBottom: 20,
  },
  mealDetailMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  mealDetailMacro: {
    alignItems: 'center',
  },
  mealDetailMacroValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  mealDetailMacroLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  foodsSection: {
    marginBottom: 20,
  },
  foodsSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  foodItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  foodName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  notesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  formField: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formFieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  textArea: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 80,
  },
});