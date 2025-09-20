import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Target, 
  Calendar,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Bell,
  Share2,
  Pin
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { scheduleGoalNotifications } from '@/utils/notificationService';
import { createGoal } from '@/lib/todayQueries';

interface FitnessGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  emoji: string;
  reminders: {
    onFinish: boolean;
    oneDayBefore: boolean;
    oneWeekBefore: boolean;
  };
  pinToToday: boolean;
  shareWithCoach: boolean;
  createdAt: string;
}

const goalCategories = [
  { id: 'weight', name: 'Weight Loss', emoji: '⚖️', unit: 'kg' },
  { id: 'muscle', name: 'Muscle Gain', emoji: '💪', unit: 'kg' },
  { id: 'endurance', name: 'Endurance', emoji: '🏃‍♂️', unit: 'km' },
  { id: 'strength', name: 'Strength', emoji: '🏋️‍♂️', unit: 'kg' },
  { id: 'flexibility', name: 'Flexibility', emoji: '🧘‍♀️', unit: 'days' },
  { id: 'habit', name: 'Habit Building', emoji: '📅', unit: 'days' },
  { id: 'event', name: 'Event Preparation', emoji: '🏆', unit: '' },
  { id: 'custom', name: 'Custom Goal', emoji: '🎯', unit: '' },
];

const emojiOptions = [
  '🎯', '🏆', '💪', '🔥', '⚡', '🌟', '🚀', '💎', '👑', '🎉',
  '🏃‍♂️', '🏋️‍♂️', '🧘‍♀️', '🏊‍♂️', '🚴‍♂️', '⚖️', '📈', '📊', '⏰', '🎪'
];

// Enhanced Toggle Component - moved to top and made self-contained
const AnimatedToggle = ({ value, onValueChange, disabled = false }: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) => {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? null);
  const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.borderLight, colors.primary],
  });

  const toggleStyles = StyleSheet.create({
    toggle: {
      width: 50,
      height: 30,
      justifyContent: 'center',
    },
    toggleDisabled: {
      opacity: 0.5,
    },
    toggleTrack: {
      width: 50,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center',
      position: 'relative',
    },
    toggleThumb: {
      width: 26,
      height: 26,
      backgroundColor: '#FFFFFF',
      borderRadius: 13,
      position: 'absolute',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
  });

  return (
    <TouchableOpacity
      style={[
        toggleStyles.toggle,
        disabled && toggleStyles.toggleDisabled
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Animated.View style={[toggleStyles.toggleTrack, { backgroundColor }]}>
        <Animated.View 
          style={[
            toggleStyles.toggleThumb, 
            { transform: [{ translateX }] }
          ]} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function SetFitnessGoalScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? null);
  const styles = createStyles(colors);

  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(goalCategories[0]);
  const [targetDate, setTargetDate] = useState(new Date());
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [reminders, setReminders] = useState({
    onFinish: true,
    oneDayBefore: false,
    oneWeekBefore: false,
  });
  const [pinToToday, setPinToToday] = useState(false);
  const [shareWithCoach, setShareWithCoach] = useState(true);
  const [isSchedulingNotifications, setIsSchedulingNotifications] = useState(false);

  // Modal states
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Date picker state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSaveGoal = async () => {
    if (!goalTitle.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    if (targetDate <= new Date()) {
      Alert.alert('Error', 'Target date must be in the future');
      return;
    }

    setIsSchedulingNotifications(true);

    try {
      // Save goal to Supabase
      const newGoal = await createGoal({
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        emoji: selectedEmoji,
        target_date: targetDate.toISOString(),
        category: selectedCategory.id,
        pin_to_today: pinToToday,
        target_value: targetValue ? parseFloat(targetValue) : undefined,
        current_value: currentValue ? parseFloat(currentValue) : undefined,
        unit: selectedCategory.unit,
        // Optionally add progress_percentage, targetValue, currentValue, etc.
      });

      if (!newGoal) {
        throw new Error('Failed to save goal');
      }

      // Schedule notifications if any reminders are enabled
      const hasReminders = reminders.onFinish || reminders.oneDayBefore || reminders.oneWeekBefore;
      if (hasReminders && Platform.OS !== 'web') {
        try {
          await scheduleGoalNotifications(
            newGoal.id,
            newGoal.title,
            newGoal.emoji,
            new Date(newGoal.target_date),
            reminders
          );
        } catch (error) {
          console.error('Error scheduling notifications:', error);
          Alert.alert(
            'Goal Created',
            'Your goal was created but notifications could not be scheduled. You can enable them later in settings.',
            [{ text: 'OK' }]
          );
        }
      }

      Alert.alert(
        'Goal Created! 🎉',
        hasReminders && Platform.OS !== 'web'
          ? 'Your fitness goal has been created and reminders have been scheduled.'
          : 'Your fitness goal has been created successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    } finally {
      setIsSchedulingNotifications(false);
    }
  };

  const renderDatePicker = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = date.toDateString() === targetDate.toDateString();
      const isPast = date < new Date();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDay,
            isPast && styles.pastDay
          ]}
          onPress={() => {
            if (!isPast) {
              setTargetDate(date);
            }
          }}
          disabled={isPast}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.selectedDayText,
            isPast && styles.pastDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <Modal
        visible={showDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pick a Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                style={styles.calendarNavButton}
              >
                <ChevronLeft size={24} color={colors.primary} />
              </TouchableOpacity>
              
              <Text style={styles.calendarMonthText}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              
              <TouchableOpacity
                onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                style={styles.calendarNavButton}
              >
                <ChevronRight size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekDays}>
              {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(day => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {days}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Set Fitness Goal</Text>
        <TouchableOpacity
          style={[
            styles.saveButton, 
            (!goalTitle.trim() || isSchedulingNotifications) && styles.saveButtonDisabled
          ]}
          onPress={handleSaveGoal}
          disabled={!goalTitle.trim() || isSchedulingNotifications}
        >
          <Text style={[
            styles.saveButtonText, 
            (!goalTitle.trim() || isSchedulingNotifications) && styles.saveButtonTextDisabled
          ]}>
            {isSchedulingNotifications ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Goal Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal Title *</Text>
          <TextInput
            style={styles.textInput}
            value={goalTitle}
            onChangeText={setGoalTitle}
            placeholder="e.g., Lose 10kg, Run a marathon, etc."
            placeholderTextColor={colors.textTertiary}
            maxLength={100}
          />
        </View>

        {/* Goal Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={goalDescription}
            onChangeText={setGoalDescription}
            placeholder="Add more details about your goal..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowCategoryPicker(true)}
          >
            <View style={styles.pickerContent}>
              <Text style={styles.pickerEmoji}>{selectedCategory.emoji}</Text>
              <Text style={styles.pickerText}>{selectedCategory.name}</Text>
            </View>
            <ChevronDown size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Target Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Date</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.pickerContent}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.pickerText}>{formatDate(targetDate)}</Text>
            </View>
            <ChevronDown size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Target Value (if applicable) */}
        {selectedCategory.unit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Value</Text>
            <View style={styles.valueInputContainer}>
              <TextInput
                style={[styles.textInput, styles.valueInput]}
                value={targetValue}
                onChangeText={setTargetValue}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>{selectedCategory.unit}</Text>
            </View>
          </View>
        )}

        {/* Current Value (if applicable) */}
        {selectedCategory.unit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Value</Text>
            <View style={styles.valueInputContainer}>
              <TextInput
                style={[styles.textInput, styles.valueInput]}
                value={currentValue}
                onChangeText={setCurrentValue}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>{selectedCategory.unit}</Text>
            </View>
          </View>
        )}

        {/* Emoji Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose an Emoji</Text>
          <TouchableOpacity
            style={styles.emojiSelector}
            onPress={() => setShowEmojiPicker(true)}
          >
            <Text style={styles.selectedEmoji}>{selectedEmoji}</Text>
            <Text style={styles.emojiSelectorText}>Tap to change</Text>
          </TouchableOpacity>
        </View>

        {/* Reminders */}
        <View style={styles.section}>
          <View style={styles.reminderHeader}>
            <Text style={styles.sectionTitle}>Remind Me</Text>
            <Bell size={20} color={colors.primary} />
          </View>
          
          {Platform.OS === 'web' && (
            <Text style={styles.webNoticeText}>
              Push notifications are not available on web. Reminders will work on mobile devices.
            </Text>
          )}
          
          <View style={styles.reminderOption}>
            <Text style={styles.reminderText}>When the countdown finishes</Text>
            <AnimatedToggle
              value={reminders.onFinish}
              onValueChange={(value) => setReminders(prev => ({ ...prev, onFinish: value }))}
            />
          </View>

          <View style={styles.reminderOption}>
            <View>
              <Text style={styles.reminderText}>1 day before</Text>
              <Text style={styles.reminderSubtext}>at 9AM</Text>
            </View>
            <AnimatedToggle
              value={reminders.oneDayBefore}
              onValueChange={(value) => setReminders(prev => ({ ...prev, oneDayBefore: value }))}
            />
          </View>

          <View style={styles.reminderOption}>
            <View>
              <Text style={styles.reminderText}>1 week before</Text>
              <Text style={styles.reminderSubtext}>at 9AM</Text>
            </View>
            <AnimatedToggle
              value={reminders.oneWeekBefore}
              onValueChange={(value) => setReminders(prev => ({ ...prev, oneWeekBefore: value }))}
            />
          </View>
        </View>

        {/* Other Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Options</Text>
          
          <View style={styles.reminderOption}>
            <View style={styles.optionWithIcon}>
              <Pin size={16} color={colors.primary} />
              <View>
                <Text style={styles.reminderText}>Pin on Today Screen</Text>
                <Text style={styles.reminderSubtext}>Show this goal on your main dashboard</Text>
              </View>
            </View>
            <AnimatedToggle
              value={pinToToday}
              onValueChange={setPinToToday}
            />
          </View>

          <View style={styles.reminderOption}>
            <View style={styles.optionWithIcon}>
              <Share2 size={16} color={colors.primary} />
              <View>
                <Text style={styles.reminderText}>Share with your coach</Text>
                <Text style={styles.reminderSubtext}>Allow your trainer to see this goal</Text>
              </View>
            </View>
            <AnimatedToggle
              value={shareWithCoach}
              onValueChange={setShareWithCoach}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Category</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.categoryList}>
            {goalCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  selectedCategory.id === category.id && styles.selectedCategoryOption
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                {category.unit && (
                  <Text style={styles.categoryUnit}>({category.unit})</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Choose an Emoji</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.emojiGrid}>
            {emojiOptions.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.emojiOption,
                  selectedEmoji === emoji && styles.selectedEmojiOption
                ]}
                onPress={() => {
                  setSelectedEmoji(emoji);
                  setShowEmojiPicker(false);
                }}
              >
                <Text style={styles.emojiOptionText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Date Picker */}
      {renderDatePicker()}
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
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: colors.textTertiary,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  textInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  pickerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  valueInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  valueInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 12,
  },
  unitText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  emojiSelector: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  selectedEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emojiSelectorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  webNoticeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.warning,
    backgroundColor: `${colors.warning}15`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 16,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  reminderText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  reminderSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionWithIcon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
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
  modalCancelText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalDoneText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  categoryList: {
    flex: 1,
    padding: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryOption: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  categoryName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  categoryUnit: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  emojiOption: {
    width: 60,
    height: 60,
    backgroundColor: colors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedEmojiOption: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  emojiOptionText: {
    fontSize: 24,
  },
  calendarContainer: {
    flex: 1,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  calendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedDay: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  pastDay: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  pastDayText: {
    color: colors.textTertiary,
  },
});