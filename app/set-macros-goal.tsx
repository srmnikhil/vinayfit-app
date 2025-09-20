import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
// Make sure saveMacroGoal is exported from '@/lib/database'
import { saveMacroGoal } from '@/lib/database';
// If 'saveMacroGoal' does not exist, replace with the correct export or create it in '@/lib/database'

interface MacroGoal {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export default function SetMacrosGoalScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [selectedUnit, setSelectedUnit] = useState<'percentage' | 'grams'>('grams');
  const [macroGoals, setMacroGoals] = useState<MacroGoal>({
    protein: 0,
    carbs: 0,
    fat: 0,
    calories: 0,
  });

  const [inputValues, setInputValues] = useState({
    protein: '',
    carbs: '',
    fat: '',
    calories: '',
  });

  const handleInputChange = (field: keyof MacroGoal, value: string) => {
    // Only allow numbers and decimal points
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    setInputValues(prev => ({
      ...prev,
      [field]: numericValue
    }));

    // Update the actual macro goals
    const parsedValue = parseFloat(numericValue) || 0;
    setMacroGoals(prev => ({
      ...prev,
      [field]: parsedValue
    }));
  };

  const calculateCaloriesFromMacros = () => {
    // 1g protein = 4 calories, 1g carbs = 4 calories, 1g fat = 9 calories
    const calculatedCalories = (macroGoals.protein * 4) + (macroGoals.carbs * 4) + (macroGoals.fat * 9);
    return Math.round(calculatedCalories);
  };

  const handleSetGoal = async () => {
    if (macroGoals.protein === 0 && macroGoals.carbs === 0 && macroGoals.fat === 0 && macroGoals.calories === 0) {
      Alert.alert('Error', 'Please set at least one macro goal');
      return;
    }

    // If calories is 0 but macros are set, calculate calories
    let finalCalories = macroGoals.calories;
    if (finalCalories === 0 && (macroGoals.protein > 0 || macroGoals.carbs > 0 || macroGoals.fat > 0)) {
      finalCalories = calculateCaloriesFromMacros();
    }

    const goalData = {
      protein: macroGoals.protein,
      carbs: macroGoals.carbs,
      fat: macroGoals.fat,
      calories: finalCalories,
      unit: selectedUnit,
    };

    try {
      await saveMacroGoal(goalData);
      Alert.alert(
        'Success',
        'Your macro goals have been set successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to save macro goals.');
    }
  };

  const renderMacroInput = (
    label: string,
    field: keyof MacroGoal,
    color: string,
    unit: string
  ) => (
    <View style={styles.macroInputContainer}>
      <View style={styles.macroHeader}>
        <View style={styles.macroLabelContainer}>
          <View style={[styles.macroIndicator, { backgroundColor: color }]} />
          <Text style={styles.macroLabel}>{label}</Text>
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.macroInput}
          value={inputValues[field]}
          onChangeText={(value) => handleInputChange(field, value)}
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          returnKeyType="next"
        />
        <Text style={styles.unitText}>{unit}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Set Macros Goal</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Unit Selection */}
        <View style={styles.unitSelection}>
          <Text style={styles.sectionTitle}>Select Type</Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitButton,
                selectedUnit === 'percentage' && styles.activeUnitButton
              ]}
              onPress={() => setSelectedUnit('percentage')}
            >
              <Text style={[
                styles.unitButtonText,
                selectedUnit === 'percentage' && styles.activeUnitButtonText
              ]}>
                %
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                selectedUnit === 'grams' && styles.activeUnitButton
              ]}
              onPress={() => setSelectedUnit('grams')}
            >
              <Text style={[
                styles.unitButtonText,
                selectedUnit === 'grams' && styles.activeUnitButtonText
              ]}>
                g
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Macro Inputs */}
        <View style={styles.macroInputs}>
          {renderMacroInput(
            'Protein',
            'protein',
            '#3B82F6',
            selectedUnit === 'grams' ? 'g' : '%'
          )}
          
          {renderMacroInput(
            'Carbs',
            'carbs',
            '#10B981',
            selectedUnit === 'grams' ? 'g' : '%'
          )}
          
          {renderMacroInput(
            'Fat',
            'fat',
            '#F59E0B',
            selectedUnit === 'grams' ? 'g' : '%'
          )}
          
          {renderMacroInput(
            'Total Calories',
            'calories',
            '#EF4444',
            'cal'
          )}
        </View>

        {/* Calculated Info */}
        {selectedUnit === 'grams' && (macroGoals.protein > 0 || macroGoals.carbs > 0 || macroGoals.fat > 0) && (
          <View style={styles.calculatedInfo}>
            <Text style={styles.calculatedTitle}>Calculated from macros:</Text>
            <Text style={styles.calculatedCalories}>
              {calculateCaloriesFromMacros()} calories
            </Text>
            <Text style={styles.calculatedNote}>
              Protein: {macroGoals.protein}g × 4 = {macroGoals.protein * 4} cal
            </Text>
            <Text style={styles.calculatedNote}>
              Carbs: {macroGoals.carbs}g × 4 = {macroGoals.carbs * 4} cal
            </Text>
            <Text style={styles.calculatedNote}>
              Fat: {macroGoals.fat}g × 9 = {macroGoals.fat * 9} cal
            </Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <Text style={styles.tipText}>
            • Protein: 0.8-1.2g per kg of body weight for general health
          </Text>
          <Text style={styles.tipText}>
            • Carbs: 45-65% of total daily calories for active individuals
          </Text>
          <Text style={styles.tipText}>
            • Fat: 20-35% of total daily calories for optimal health
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Set Goal Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.setGoalButton} onPress={handleSetGoal}>
          <Text style={styles.setGoalButtonText}>Set Goal</Text>
        </TouchableOpacity>
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
    fontSize: 20,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  unitSelection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 25,
    padding: 4,
    alignSelf: 'flex-end',
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  activeUnitButton: {
    backgroundColor: colors.textSecondary,
  },
  unitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textSecondary,
  },
  activeUnitButtonText: {
    color: '#FFFFFF',
  },
  macroInputs: {
    paddingHorizontal: 20,
  },
  macroInputContainer: {
    marginBottom: 32,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  macroLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  macroInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 24,
    color: colors.textTertiary,
    textAlign: 'left',
    paddingVertical: 8,
  },
  unitText: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: colors.textTertiary,
    marginLeft: 8,
  },
  calculatedInfo: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
  },
  calculatedTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  calculatedCalories: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.primary,
    marginBottom: 8,
  },
  calculatedNote: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  tipsContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  setGoalButton: {
    backgroundColor: colors.textSecondary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  setGoalButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});