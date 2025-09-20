import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { Droplet, Plus, Minus } from 'lucide-react-native';

interface WaterCardProps {
  current: number;
  goal: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function WaterCard({ 
  current, 
  goal, 
  onIncrement, 
  onDecrement 
}: WaterCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  
  // Calculate percentage of goal
  const percentage = Math.min(Math.round((current / goal) * 100), 100);
  
  // Generate water glass elements
  const renderWaterGlasses = () => {
    const glasses = [];
    const filled = Math.min(current, goal);
    
    for (let i = 0; i < goal; i++) {
      glasses.push(
        <View 
          key={i} 
          style={[
            styles.glass, 
            i < filled 
              ? { backgroundColor: colors.primary } 
              : { backgroundColor: colors.border }
          ]}
        >
          <Droplet 
            size={16} 
            color={i < filled ? '#fff' : colors.textSecondary} 
          />
        </View>
      );
    }
    
    return glasses;
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { 
          color: colors.text,
          fontFamily: 'Inter-SemiBold'
        }]}>
          Water Intake
        </Text>
        <View style={styles.goalContainer}>
          <Text style={[styles.goalText, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Regular'
          }]}>
            Goal: {goal} glasses
          </Text>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.waterInfoContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary[900] }]}>
            <Droplet size={24} color={colors.primary} />
          </View>
          <View style={styles.waterTextContainer}>
            <Text style={[styles.waterValue, { 
              color: colors.primary,
              fontFamily: 'Inter-SemiBold'
            }]}>
              {current} / {goal}
            </Text>
            <Text style={[styles.waterLabel, { 
              color: colors.textSecondary,
              fontFamily: 'Inter-Regular'
            }]}>
              glasses today
            </Text>
          </View>
        </View>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: colors.border }]}
            onPress={onDecrement}
            disabled={current <= 0}
          >
            <Minus size={16} color={current <= 0 ? colors.textSecondary : '#fff'} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: colors.primary }]}
            onPress={onIncrement}
          >
            <Plus size={16} color='#fff' />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.primary,
                width: `${percentage}%` 
              }
            ]}
          />
        </View>
        <Text style={[styles.progressText, { 
          color: colors.textSecondary,
          fontFamily: 'Inter-Medium'
        }]}>
          {percentage}% of daily goal
        </Text>
      </View>
      
      <View style={styles.glassesContainer}>
        {renderWaterGlasses()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
  },
  goalContainer: {
    backgroundColor: 'rgba(0, 191, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalText: {
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  waterInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  waterTextContainer: {
    justifyContent: 'center',
  },
  waterValue: {
    fontSize: 18,
  },
  waterLabel: {
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  glassesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  glass: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
});