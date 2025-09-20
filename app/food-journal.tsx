import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  Camera, 
  Calendar,
  X,
  ChevronDown,
  Save,
  Settings,
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getMealTypes,
  getNutritionGoals,
  upsertNutritionGoals,
  getFoodEntriesForDateRange,
  createFoodEntry,
  updateFoodEntry,
  deleteFoodEntry,
  addFoodPhoto,
  MealType,
  FoodEntry,
  NutritionGoals,
  DayNutritionSummary,
} from '@/lib/foodJournal';
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';
import { TimelineConnector } from '@/components/TimelineConnector';
import { AnimatedMealEntry } from '@/components/AnimatedMealEntry';

export default function FoodJournalScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  // State management
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showNutritionGoals, setShowNutritionGoals] = useState(false);
  const [showMealTypeSelector, setShowMealTypeSelector] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals | null>(null);
  const [daysSummary, setDaysSummary] = useState<DayNutritionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meal_type_id: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    notes: '',
  });
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when date changes
  useEffect(() => {
    loadFoodEntries();
  }, [selectedDate]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [mealTypesData, goalsData] = await Promise.all([
        getMealTypes(),
        getNutritionGoals(),
      ]);

      setMealTypes(mealTypesData);
      setNutritionGoals(goalsData);
      
      if (!goalsData) {
        // Create default nutrition goals
        const defaultGoals = {
          daily_calories: 2000,
          daily_protein_g: 150,
          daily_carbs_g: 250,
          daily_fat_g: 65,
        };
        const newGoals = await upsertNutritionGoals(defaultGoals);
        setNutritionGoals(newGoals);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFoodEntries = async () => {
    try {
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 1);

      const data = await getFoodEntriesForDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      setDaysSummary(data);
    } catch (error) {
      console.error('Error loading food entries:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadInitialData(), loadFoodEntries()]);
    setRefreshing(false);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const openAddMealModal = () => {
    console.log('Opening add meal modal');
    
    // Reset all states first
    setShowAddMeal(false);
    setEditingEntry(null);
    setFormData({
      title: '',
      description: '',
      meal_type_id: '',
      date: selectedDate.toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      calories: '',
      protein_g: '',
      carbs_g: '',
      fat_g: '',
      notes: '',
    });
    setSelectedPhotos([]);
    
    // Use a timeout to ensure state updates complete
    setTimeout(() => {
      console.log('Showing modal');
      setShowAddMeal(true);
    }, 50);
  };

  const openEditMealModal = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      description: entry.description || '',
      meal_type_id: entry.meal_type_id,
      date: entry.date,
      time: entry.time,
      calories: entry.calories.toString(),
      protein_g: entry.protein_g.toString(),
      carbs_g: entry.carbs_g.toString(),
      fat_g: entry.fat_g.toString(),
      notes: entry.notes || '',
    });
    setSelectedPhotos(entry.photos?.map(p => p.photo_url) || []);
    setShowAddMeal(true);
  };

  const handleSaveMeal = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a meal title');
      return;
    }

    if (!formData.meal_type_id) {
      Alert.alert('Error', 'Please select a meal type');
      return;
    }

    try {
      const entryData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        meal_type_id: formData.meal_type_id,
        date: formData.date,
        time: formData.time,
        calories: parseInt(formData.calories) || 0,
        protein_g: parseFloat(formData.protein_g) || 0,
        carbs_g: parseFloat(formData.carbs_g) || 0,
        fat_g: parseFloat(formData.fat_g) || 0,
        notes: formData.notes.trim() || undefined,
      };

      let savedEntry;
      if (editingEntry) {
        savedEntry = await updateFoodEntry(editingEntry.id, entryData);
      } else {
        savedEntry = await createFoodEntry(entryData);
      }

      if (savedEntry) {
        // Add photos if any
        for (const photoUrl of selectedPhotos) {
          await addFoodPhoto(savedEntry.id, {
            photo_url: photoUrl,
            is_primary: selectedPhotos.indexOf(photoUrl) === 0,
          });
        }

        setShowAddMeal(false);
        await loadFoodEntries();
      } else {
        Alert.alert('Error', 'Failed to save meal entry');
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal entry');
    }
  };

  const handleDeleteMeal = async (entry: FoodEntry) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteFoodEntry(entry.id);
            if (success) {
              await loadFoodEntries();
            } else {
              Alert.alert('Error', 'Failed to delete meal entry');
            }
          },
        },
      ]
    );
  };

  const handleAddPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handlePhotoAction = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Gallery', onPress: handleAddPhoto },
      ]
    );
  };

  const removePhoto = (photoUrl: string) => {
    setSelectedPhotos(prev => prev.filter(url => url !== photoUrl));
  };

  const getMealTypeById = (id: string) => {
    return mealTypes.find(type => type.id === id);
  };

  const getTodaysSummary = () => {
    const today = selectedDate.toISOString().split('T')[0];
    return daysSummary.find(day => day.date === today);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const renderNutritionOverview = () => {
    const todaysSummary = getTodaysSummary();
    if (!nutritionGoals || !todaysSummary) return null;

    const calorieProgress = (todaysSummary.total_calories / nutritionGoals.daily_calories) * 100;
    const proteinProgress = (todaysSummary.total_protein / nutritionGoals.daily_protein_g) * 100;
    const carbsProgress = (todaysSummary.total_carbs / nutritionGoals.daily_carbs_g) * 100;
    const fatProgress = (todaysSummary.total_fat / nutritionGoals.daily_fat_g) * 100;

    return (
      <View style={styles.nutritionOverview}>
        <View style={styles.nutritionHeader}>
          <Text style={styles.nutritionTitle}>Today's Nutrition</Text>
          <TouchableOpacity onPress={() => setShowNutritionGoals(true)}>
            <Settings size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Calories</Text>
            <Text style={styles.nutritionValue}>
              {Math.round(todaysSummary.total_calories)}/{nutritionGoals.daily_calories}
            </Text>
            <AnimatedProgressBar
              progress={calorieProgress}
              color={colors.primary}
              delay={100}
            />
          </View>

          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Protein</Text>
            <Text style={styles.nutritionValue}>
              {Math.round(todaysSummary.total_protein)}g/{nutritionGoals.daily_protein_g}g
            </Text>
            <AnimatedProgressBar
              progress={proteinProgress}
              color={colors.success}
              delay={200}
            />
          </View>

          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Carbs</Text>
            <Text style={styles.nutritionValue}>
              {Math.round(todaysSummary.total_carbs)}g/{nutritionGoals.daily_carbs_g}g
            </Text>
            <AnimatedProgressBar
              progress={carbsProgress}
              color={colors.warning}
              delay={300}
            />
          </View>

          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Fat</Text>
            <Text style={styles.nutritionValue}>
              {Math.round(todaysSummary.total_fat)}g/{nutritionGoals.daily_fat_g}g
            </Text>
            <AnimatedProgressBar
              progress={fatProgress}
              color={colors.error}
              delay={400}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderDayEntry = (daySummary: DayNutritionSummary, index: number) => (
    <View key={daySummary.date} style={styles.daySection}>
      <View style={styles.dayHeader}>
        <TimelineConnector
          isFirst={index === 0}
          isLast={index === daysSummary.length - 1}
          delay={index * 100}
        />
        <View style={styles.dayInfo}>
          <Text style={styles.dayLabel}>
            {formatDate(new Date(daySummary.date))}
          </Text>
          <Text style={styles.dayStats}>
            {daySummary.entries.length} meals • {Math.round(daySummary.total_calories)} cal
          </Text>
        </View>
      </View>
      
      {daySummary.entries.length === 0 ? (
        <View style={styles.emptyDay}>
          <Text style={styles.emptyDayText}>No meals logged</Text>
        </View>
      ) : (
        daySummary.entries.map((entry, entryIndex) => (
          <AnimatedMealEntry
            key={entry.id}
            entry={entry}
            mealType={getMealTypeById(entry.meal_type_id)}
            onEdit={openEditMealModal}
            onDelete={handleDeleteMeal}
            delay={(index * 100) + (entryIndex * 50) + 200}
          />
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your food journal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Food Journal</Text>
        <TouchableOpacity onPress={openAddMealModal} style={styles.addButton}>
          <Plus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={20} color={colors.primary} />
          <Text style={styles.dateButtonText}>
            {formatDate(selectedDate)}
          </Text>
          <ChevronDown size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Nutrition Overview */}
      {renderNutritionOverview()}

      {/* Timeline */}
      <ScrollView 
        style={styles.timeline} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {daysSummary.map(renderDayEntry)}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Add/Edit Meal Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showAddMeal}
        onRequestClose={() => {
          console.log('Modal close requested');
          setShowAddMeal(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              console.log('Close button pressed');
              setShowAddMeal(false);
              // Reset form after a small delay
              setTimeout(() => {
                setEditingEntry(null);
                setFormData({
                  title: '',
                  description: '',
                  meal_type_id: '',
                  date: selectedDate.toISOString().split('T')[0],
                  time: new Date().toTimeString().slice(0, 5),
                  calories: '',
                  protein_g: '',
                  carbs_g: '',
                  fat_g: '',
                  notes: '',
                });
                setSelectedPhotos([]);
              }, 300);
            }}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingEntry ? 'Edit Meal' : 'Add Meal'}
            </Text>
            <TouchableOpacity onPress={handleSaveMeal}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Basic Info */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Basic Information</Text>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Meal Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.title}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                  placeholder="What did you eat?"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Add details about your meal..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Meal Type *</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => setShowMealTypeSelector(true)}
                >
                  <Text style={[
                    styles.pickerText,
                    !formData.meal_type_id && styles.placeholderText
                  ]}>
                    {formData.meal_type_id 
                      ? `${getMealTypeById(formData.meal_type_id)?.emoji} ${getMealTypeById(formData.meal_type_id)?.name}`
                      : 'Select meal type'
                    }
                  </Text>
                  <ChevronDown size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.date}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                <View style={styles.formFieldHalf}>
                  <Text style={styles.fieldLabel}>Time</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.time}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, time: text }))}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
            </View>

            {/* Photos */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Photos</Text>
              
              <View style={styles.photoSection}>
                <TouchableOpacity style={styles.addPhotoButton} onPress={handlePhotoAction}>
                  <Camera size={24} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>

                {selectedPhotos.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedPhotos}>
                    {selectedPhotos.map((photoUrl, index) => (
                      <View key={index} style={styles.selectedPhotoContainer}>
                        <Image source={{ uri: photoUrl }} style={styles.selectedPhoto} />
                        <TouchableOpacity
                          style={styles.removePhotoButton}
                          onPress={() => removePhoto(photoUrl)}
                        >
                          <X size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* Nutrition */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Nutrition Information</Text>
              
              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.fieldLabel}>Calories</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.calories}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, calories: text }))}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formFieldHalf}>
                  <Text style={styles.fieldLabel}>Protein (g)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.protein_g}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, protein_g: text }))}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.fieldLabel}>Carbs (g)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.carbs_g}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, carbs_g: text }))}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formFieldHalf}>
                  <Text style={styles.fieldLabel}>Fat (g)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.fat_g}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, fat_g: text }))}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Any additional notes..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={{ height: 50 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Meal Type Selector Modal */}
      <Modal
        visible={showMealTypeSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMealTypeSelector(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMealTypeSelector(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Meal Type</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.mealTypeList}>
            {mealTypes.map((mealType) => (
              <TouchableOpacity
                key={mealType.id}
                style={[
                  styles.mealTypeOption,
                  formData.meal_type_id === mealType.id && styles.selectedMealTypeOption
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, meal_type_id: mealType.id }));
                  setShowMealTypeSelector(false);
                }}
              >
                <Text style={styles.mealTypeOptionEmoji}>{mealType.emoji}</Text>
                <Text style={styles.mealTypeOptionName}>{mealType.name}</Text>
                {formData.meal_type_id === mealType.id && (
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
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
  },
  addButton: {
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  dateSelector: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  dateButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  nutritionOverview: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  nutritionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
  },
  nutritionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  nutritionValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 20,
  },
  daySection: {
    marginBottom: 32,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayInfo: {
    flex: 1,
  },
  dayLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  dayStats: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyDay: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginLeft: 36,
  },
  emptyDayText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    margin: 0,
  },
  modalContent: {
    flex: 1,
    padding: 20,
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
    fontSize: 18,
    color: colors.text,
  },
  
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formFieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textTertiary,
  },
  photoSection: {
    gap: 16,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
  },
  addPhotoText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
  },
  selectedPhotos: {
    flexDirection: 'row',
  },
  selectedPhotoContainer: {
    position: 'relative',
    marginRight: 8,
  },
  selectedPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealTypeList: {
    padding: 20,
  },
  mealTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  selectedMealTypeOption: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  mealTypeOptionEmoji: {
    fontSize: 24,
  },
  mealTypeOptionName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  selectedIndicator: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.primary,
  },
});