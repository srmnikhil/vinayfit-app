import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Footprints, Target, TrendingUp, Calendar, Award, Flame, Clock,  MoreHorizontal, ChevronLeft, ChevronRight, Sun, Moon, Plus, Minus } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useRealStepTracking } from '@/hooks/useRealStepTracking';
import StepInputModal from '@/components/StepInputModal';
import { useExpoStepCounter } from '@/hooks/useExpoStepCounter';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface StepData {
  date: string;
  steps: number;
  goal: number;
  calories: number;
  distance: number; // in km
  activeMinutes: number;
  hourlyData: number[]; // 24 hours
}

interface WeekData {
  weekStart: string;
  totalSteps: number;
  averageSteps: number;
  daysActive: number;
  totalCalories: number;
  totalDistance: number;
  dailyData: StepData[];
}

interface MonthData {
  month: string;
  year: number;
  totalSteps: number;
  averageSteps: number;
  daysActive: number;
  totalCalories: number;
  totalDistance: number;
  weeklyData: WeekData[];
}

// Sample data generation
const generateHourlyData = (totalSteps: number): number[] => {
  const hourlyData = new Array(24).fill(0);
  const peakHours = [7, 8, 12, 13, 17, 18, 19]; // Morning, lunch, evening
  
  let remainingSteps = totalSteps;
  
  // Distribute steps with higher concentration during peak hours
  peakHours.forEach(hour => {
    const steps = Math.floor(remainingSteps * (0.1 + Math.random() * 0.15));
    hourlyData[hour] = steps;
    remainingSteps -= steps;
  });
  
  // Distribute remaining steps randomly
  for (let i = 0; i < 24; i++) {
    if (!peakHours.includes(i) && remainingSteps > 0) {
      const steps = Math.floor(Math.random() * (remainingSteps * 0.1));
      hourlyData[i] = steps;
      remainingSteps -= steps;
    }
  }
  
  return hourlyData;
};

const generateSampleData = (): { daily: StepData[], weekly: WeekData[], monthly: MonthData[] } => {
  const today = new Date();
  const daily: StepData[] = [];
  const weekly: WeekData[] = [];
  const monthly: MonthData[] = [];
  
  // Generate daily data for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const steps = i === 0 ? 0 : Math.floor(2000 + Math.random() * 8000); // Today has 0 steps
    const goal = 10000;
    const calories = Math.floor(steps * 0.04);
    const distance = parseFloat((steps * 0.0008).toFixed(2));
    const activeMinutes = Math.floor(steps / 100);
    const hourlyData = generateHourlyData(steps);
    
    daily.push({
      date: date.toISOString().split('T')[0],
      steps,
      goal,
      calories,
      distance,
      activeMinutes,
      hourlyData
    });
  }
  
  // Generate weekly data
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
    
    const weekDays = daily.slice(i * 7, (i + 1) * 7);
    const totalSteps = weekDays.reduce((sum, day) => sum + day.steps, 0);
    const averageSteps = Math.floor(totalSteps / 7);
    const daysActive = weekDays.filter(day => day.steps > 1000).length;
    const totalCalories = weekDays.reduce((sum, day) => sum + day.calories, 0);
    const totalDistance = weekDays.reduce((sum, day) => sum + day.distance, 0);
    
    weekly.push({
      weekStart: weekStart.toISOString().split('T')[0],
      totalSteps,
      averageSteps,
      daysActive,
      totalCalories,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      dailyData: weekDays
    });
  }
  
  // Generate monthly data
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const totalSteps = daily.reduce((sum, day) => sum + day.steps, 0);
  const averageSteps = Math.floor(totalSteps / 30);
  const daysActive = daily.filter(day => day.steps > 1000).length;
  const totalCalories = daily.reduce((sum, day) => sum + day.calories, 0);
  const totalDistance = daily.reduce((sum, day) => sum + day.distance, 0);
  
  monthly.push({
    month: monthStart.toLocaleDateString('en-US', { month: 'long' }),
    year: monthStart.getFullYear(),
    totalSteps,
    averageSteps,
    daysActive,
    totalCalories,
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    weeklyData: weekly
  });
  
  return { daily, weekly, monthly };
};

const DAILY_STEP_KEY = 'DAILY_STEP_DATA_V1';

function getTodayDateStr() {
  return new Date().toISOString().split('T')[0];
}

async function saveTodayStepData(data: StepData) {
  const today = getTodayDateStr();
  let allData: { [key: string]: StepData } = {};
  try {
    const raw = await AsyncStorage.getItem(DAILY_STEP_KEY);
    if (raw) allData = JSON.parse(raw);
  } catch {}
  allData[today] = data;
  await AsyncStorage.setItem(DAILY_STEP_KEY, JSON.stringify(allData));
}

async function loadAllStepData() {
  try {
    const raw = await AsyncStorage.getItem(DAILY_STEP_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export default function StepTrackerScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [animatedValue] = useState(new Animated.Value(0));
  const [showManualInput, setShowManualInput] = useState(false);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalResetKey, setGoalResetKey] = useState(0);
  const [pendingGoalReset, setPendingGoalReset] = useState(false);
  const [justResetGoal, setJustResetGoal] = useState(false);
  const [allStepData, setAllStepData] = useState({});

  // Use the real step tracking hook
  const {
    todayData,
    isTracking,
    trackingStats,
    config,
    isLoading,
    isUpdating,
    startTracking,
    stopTracking,
    setConfig,
  } = useRealStepTracking();

  const { stepCount, isAvailable, stepOffset, setStepOffset, stepsSinceGoal } = useExpoStepCounter();

  // Request ACTIVITY_RECOGNITION permission on Android
  useEffect(() => {
    async function requestActivityPermission() {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
            {
              title: 'Activity Recognition Permission',
              message: 'This app needs access to your physical activity to count steps.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Step counting will not work without activity recognition permission.');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    }
    requestActivityPermission();
  }, []);

  // Use sample data as fallback if real data is not available
  const [fallbackData] = useState(generateSampleData());
  
  // Create current data with state management
  const [currentData, setCurrentData] = useState(() => {
    return todayData || {
      date: new Date().toISOString().split('T')[0],
      steps: stepsSinceGoal,
      goal: config?.stepGoal || 10000,
      calories: Math.floor(stepsSinceGoal * 0.04),
      distance: parseFloat((stepsSinceGoal * 0.0008).toFixed(2)),
      activeMinutes: Math.floor(stepsSinceGoal / 100),
      hourlyData: trackingStats.hourlyData,
      source: 'device',
      lastUpdated: new Date().toISOString(),
      isRealTime: isTracking,
    };
  });

  // Update current data when real data changes
  useEffect(() => {
    if (todayData) {
      setCurrentData(todayData);
    } else {
      setCurrentData({
        date: new Date().toISOString().split('T')[0],
        steps: stepsSinceGoal,
        goal: config?.stepGoal || 10000,
        calories: Math.floor(stepsSinceGoal * 0.04),
        distance: parseFloat((stepsSinceGoal * 0.0008).toFixed(2)),
        activeMinutes: Math.floor(stepsSinceGoal / 100),
        hourlyData: trackingStats.hourlyData,
        source: 'device',
        lastUpdated: new Date().toISOString(),
        isRealTime: isTracking,
      });
    }
  }, [todayData]);

  // Update current data when stepsSinceGoal changes
  useEffect(() => {
    setCurrentData(prev => ({
      ...prev,
      steps: stepsSinceGoal,
      calories: Math.floor(stepsSinceGoal * 0.04),
      distance: parseFloat((stepsSinceGoal * 0.0008).toFixed(2)),
      activeMinutes: Math.floor(stepsSinceGoal / 100),
    }));
  }, [stepsSinceGoal]);

  // Save today's step data on every step count update
  useEffect(() => {
    const today = getTodayDateStr();
    const data = {
      date: today,
      steps: stepsSinceGoal,
      goal: currentData.goal,
      calories: Math.floor(stepsSinceGoal * 0.04),
      distance: parseFloat((stepsSinceGoal * 0.0008).toFixed(2)),
      activeMinutes: Math.floor(stepsSinceGoal / 100),
      // Optionally add more fields
    };
    saveTodayStepData(data);
  }, [stepsSinceGoal, currentData.goal]);

  // Load all step data on mount
  useEffect(() => {
    loadAllStepData().then(setAllStepData);
  }, [goalResetKey]); // reload when goal resets

  // Helper to get last N days
  function getLastNDaysData(n: number) {
    const dates = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates.map(date => allStepData[date] || { date, steps: 0, goal: currentData.goal, calories: 0, distance: 0, activeMinutes: 0 });
  }

  // Week and month data
  const weekData = getLastNDaysData(7);
  const monthData = getLastNDaysData(30);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const getProgressPercentage = (steps: number, goal: number) => {
    return Math.min((steps / goal) * 100, 100);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const handleQuickAddSteps = async (steps: number) => {
    // This function is no longer used for manual input, but kept for consistency
    // The actual step counting is handled by useExpoStepCounter
  };

  const handleQuickAddGoal = async (amount: number) => {
    await setConfig({ stepGoal: amount });
    setStepOffset(stepCount);
    setGoalResetKey(prev => prev + 1);
    setJustResetGoal(true);
  };

  const handleManualGoalInput = async (amount: number) => {
    await setConfig({ stepGoal: amount });
    setStepOffset(stepCount);
    setGoalResetKey(prev => prev + 1);
    setJustResetGoal(true);
    setShowGoalInput(false);
    return true;
  };

  useEffect(() => {
    if (justResetGoal && stepsSinceGoal !== 0) {
      setJustResetGoal(false);
    }
  }, [stepCount]);

  // Update renderCircularProgress to accept key and log values
  const renderCircularProgress = (steps: number, goal: number, key?: number) => {
    console.log('renderCircularProgress', steps, goal, key);
    const percentage = getProgressPercentage(steps, goal);
    const circumference = 2 * Math.PI * 120;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (circumference * percentage) / 100;

    return (
      <View key={key} style={styles.circularProgressContainer}>
        <View style={styles.circularProgress}>
          <View style={styles.progressRing}>
            <View style={styles.progressBackground} />
            <Animated.View 
              style={[
                styles.progressForeground,
                {
                  transform: [{
                    rotate: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${(percentage * 3.6)}deg`]
                    })
                  }]
                }
              ]} 
            />
          </View>
          <View style={styles.progressContent}>
            <Text style={styles.todayLabel}>TODAY</Text>
            <Text style={styles.stepsNumber}>
              {formatNumber(steps)}
            </Text>
            <Text style={styles.goalText}>of {formatNumber(goal)} steps</Text>
            <Text style={{ fontSize: 10 }}>Rendered at: {Date.now()}</Text>
            {/* Goal input buttons */}
            <View style={styles.manualInputContainer}>
              <TouchableOpacity 
                style={styles.manualInputButton}
                onPress={() => setShowGoalInput(true)}
              >
                <Plus size={16} color={colors.primary} />
                <Text style={styles.manualInputText}>Add Goal</Text>
              </TouchableOpacity>
              {/* Quick add buttons for goal */}
              <View style={styles.quickAddContainer}>
                <Text style={styles.quickAddLabel}>Quick Add to Goal:</Text>
                <View style={styles.quickAddButtons}>
                  <TouchableOpacity 
                    style={styles.quickAddButton}
                    onPress={() => handleQuickAddGoal(500)}
                  >
                    <Text style={styles.quickAddText}>+500</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickAddButton}
                    onPress={() => handleQuickAddGoal(1000)}
                  >
                    <Text style={styles.quickAddText}>+1K</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickAddButton}
                    onPress={() => handleQuickAddGoal(2000)}
                  >
                    <Text style={styles.quickAddText}>+2K</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickAddButton}
                    onPress={() => handleQuickAddGoal(5000)}
                  >
                    <Text style={styles.quickAddText}>+5K</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {/* Real-time tracking controls */}
            <View style={styles.trackingControls}>
              <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 14 }}>
                Step tracking is always on when permission is granted.
              </Text>
              <TouchableOpacity 
                style={styles.syncButton}
                onPress={() => {
                  Alert.alert('Sync Health App', 'This feature is not yet implemented.');
                }}
                disabled={isUpdating}
              >
                <Text style={styles.syncButtonText}>Sync Health App</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderHourlyChart = (hourlyData: number[]) => {
    const maxSteps = Math.max(...hourlyData, 1);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Today's steps</Text>
        <View style={styles.chartContent}>
          <View style={styles.yAxisLabels}>
            <Text style={styles.yAxisLabel}>{formatNumber(maxSteps)}</Text>
            <Text style={styles.yAxisLabel}>{formatNumber(Math.floor(maxSteps / 2))}</Text>
            <Text style={styles.yAxisLabel}>0</Text>
          </View>
          <View style={styles.chartArea}>
            <View style={styles.chartBars}>
              {hourlyData.map((steps, index) => {
                const height = maxSteps > 0 ? (steps / maxSteps) * 100 : 0;
                return (
                  <View
                    key={index}
                    style={[
                      styles.chartBar,
                      {
                        height: height,
                        backgroundColor: steps > 0 ? colors.primary : colors.borderLight
                      }
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.xAxisLabels}>
              <View style={styles.xAxisLabel}>
                <Sun size={16} color={colors.warning} />
                <Text style={styles.xAxisText}>6 AM</Text>
              </View>
              <Text style={styles.xAxisText}>12 PM</Text>
              <View style={styles.xAxisLabel}>
                <Text style={styles.xAxisText}>6 PM</Text>
                <Moon size={16} color={colors.info} />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderWeeklyChart = (weekData: WeekData) => {
    const maxSteps = Math.max(...weekData.dailyData.map(d => d.steps), 1);
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>This week's steps</Text>
        <View style={styles.weeklyChart}>
          {weekData.dailyData.map((day, index) => {
            const height = (day.steps / maxSteps) * 120;
            const isToday = day.date === currentData.date;
            
            return (
              <View key={index} style={styles.weeklyBarContainer}>
                <View
                  style={[
                    styles.weeklyBar,
                    {
                      height: height,
                      backgroundColor: isToday ? colors.warning : 
                                     day.steps >= day.goal ? colors.success : colors.primary
                    }
                  ]}
                />
                <Text style={[
                  styles.weeklyBarLabel,
                  isToday && styles.todayBarLabel
                ]}>
                  {days[index]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMonthlyChart = (monthData: MonthData) => {
    const maxSteps = Math.max(...monthData.weeklyData.map(w => w.totalSteps), 1);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>This month's weekly totals</Text>
        <View style={styles.monthlyChart}>
          {monthData.weeklyData.map((week, index) => {
            const height = (week.totalSteps / maxSteps) * 120;
            
            return (
              <View key={index} style={styles.monthlyBarContainer}>
                <View
                  style={[
                    styles.monthlyBar,
                    {
                      height: height,
                      backgroundColor: colors.primary
                    }
                  ]}
                />
                <Text style={styles.monthlyBarLabel}>W{index + 1}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderStatsCards = () => {
    let stats;
    
    switch (activeTab) {
      case 'day':
        stats = [
          { label: 'Calories', value: currentData.calories, unit: 'kcal', icon: Flame, color: colors.error },
          { label: 'Distance', value: currentData.distance, unit: 'km', icon: Target, color: colors.success },
          { label: 'Active Time', value: currentData.activeMinutes, unit: 'min', icon: Clock, color: colors.warning },
        ];
        break;
      case 'week':
        // For now, use sample data for week/month views
        const weekData = fallbackData.weekly[fallbackData.weekly.length - 1];
        stats = [
          { label: 'Total Steps', value: weekData.totalSteps, unit: '', icon: Footprints, color: colors.primary },
          { label: 'Daily Average', value: weekData.averageSteps, unit: '', icon: TrendingUp, color: colors.success },
          { label: 'Active Days', value: weekData.daysActive, unit: '/7', icon: Calendar, color: colors.warning },
        ];
        break;
      case 'month':
        const monthData = fallbackData.monthly[0];
        stats = [
          { label: 'Total Steps', value: monthData.totalSteps, unit: '', icon: Footprints, color: colors.primary },
          { label: 'Daily Average', value: monthData.averageSteps, unit: '', icon: TrendingUp, color: colors.success },
          { label: 'Active Days', value: monthData.daysActive, unit: '/30', icon: Award, color: colors.warning },
        ];
        break;
    }

    return (
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                <IconComponent size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>
                {formatNumber(stat.value)}{stat.unit}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // In renderAchievements, use real weekData for dynamic achievements
  const renderAchievements = () => {
    function getDayOfWeek(dateStr) {
      return new Date(dateStr).getDay();
    }
    // Existing achievements...
    const goalCrusherUnlocked = weekData.filter(day => day.steps >= day.goal).length >= 5;
    const weekendDays = weekData.filter(day => {
      const dow = getDayOfWeek(day.date);
      return (dow === 0 || dow === 6) && day.steps > 1000;
    });
    const weekendWarriorUnlocked = weekendDays.length === 2;
    let streakUnlocked = false;
    let streak = 0;
    for (let i = 0; i < weekData.length; i++) {
      if (weekData[i].steps >= weekData[i].goal) {
        streak++;
        if (streak >= 3) streakUnlocked = true;
      } else {
        streak = 0;
      }
    }
    const totalWeekSteps = weekData.reduce((s, d) => s + d.steps, 0);
    const fiftyKWeekUnlocked = totalWeekSteps >= 50000;
    const consistencyUnlocked = weekData.filter(day => day.steps > 1000).length === 7;

    // New Achievements
    // Early Bird: 1,000+ steps before 9 AM any day this week (if hourlyData exists)
    const earlyBirdUnlocked = weekData.some(day => day.hourlyData && day.hourlyData.slice(0, 9).reduce((a, b) => a + b, 0) >= 1000);
    // Night Owl: 1,000+ steps after 8 PM any day this week (if hourlyData exists)
    const nightOwlUnlocked = weekData.some(day => day.hourlyData && day.hourlyData.slice(20, 24).reduce((a, b) => a + b, 0) >= 1000);
    // Marathon Day: 20,000+ steps in a single day
    const marathonDayUnlocked = weekData.some(day => day.steps >= 20000);
    // Double Goal: 2x goal in a day
    const doubleGoalUnlocked = weekData.some(day => day.steps >= 2 * day.goal);
    // First Steps: any steps ever
    const firstStepsUnlocked = Object.values(allStepData).some((d: any) => d.steps > 0);
    // Comeback Kid: 0-step day followed by 5,000+ step day
    let comebackKidUnlocked = false;
    const allDays = Object.values(allStepData).sort((a: any, b: any) => a.date.localeCompare(b.date));
    for (let i = 1; i < allDays.length; i++) {
      if (allDays[i-1].steps === 0 && allDays[i].steps >= 5000) comebackKidUnlocked = true;
    }
    // Monthly Master: hit goal every day this month
    const monthGoalUnlocked = monthData.length > 0 && monthData.every(day => day.steps >= day.goal);
    // Weekend Streak: active on 4 consecutive weekends
    let weekendStreakUnlocked = false;
    let streaks = 0;
    let lastWeekend = null;
    for (let i = 0; i < allDays.length; i++) {
      const d = new Date(allDays[i].date);
      if ((d.getDay() === 0 || d.getDay() === 6) && allDays[i].steps > 1000) {
        if (lastWeekend && (d.getTime() - lastWeekend.getTime()) <= 8 * 24 * 60 * 60 * 1000) {
          streaks++;
        } else {
          streaks = 1;
        }
        lastWeekend = d;
        if (streaks >= 4) weekendStreakUnlocked = true;
      }
    }
    // Step Explorer: increased goal 3+ times
    let goalChanges = 0;
    let lastGoal = null;
    for (let i = 0; i < allDays.length; i++) {
      if (lastGoal !== null && allDays[i].goal !== lastGoal) goalChanges++;
      lastGoal = allDays[i].goal;
    }
    const stepExplorerUnlocked = goalChanges >= 3;
    // Consistency Pro: 5,000+ steps every day for 2 weeks
    let consistencyProUnlocked = false;
    for (let i = 0; i <= allDays.length - 14; i++) {
      if (allDays.slice(i, i+14).every((d: any) => d.steps >= 5000)) consistencyProUnlocked = true;
    }

    const achievements = [
      { title: 'Goal Crusher', description: 'Reached daily goal 5 times this week', icon: '🏆', unlocked: goalCrusherUnlocked },
      { title: 'Weekend Warrior', description: 'Active on both weekend days', icon: '⚡', unlocked: weekendWarriorUnlocked },
      { title: 'Streak', description: '3+ days in a row hitting your goal', icon: '🔥', unlocked: streakUnlocked },
      { title: '50K Week', description: 'Walked 50,000+ steps in a week', icon: '👣', unlocked: fiftyKWeekUnlocked },
      { title: 'Consistency', description: '7 days in a row >1000 steps', icon: '📅', unlocked: consistencyUnlocked },
      { title: 'Early Bird', description: '1,000+ steps before 9 AM', icon: '🌅', unlocked: earlyBirdUnlocked },
      { title: 'Night Owl', description: '1,000+ steps after 8 PM', icon: '🌙', unlocked: nightOwlUnlocked },
      { title: 'Marathon Day', description: 'Walked 20,000+ steps in a single day', icon: '🏅', unlocked: marathonDayUnlocked },
      { title: 'Double Goal', description: 'Doubled your daily goal in a day', icon: '💪', unlocked: doubleGoalUnlocked },
      { title: 'First Steps', description: 'Logged your first steps', icon: '👟', unlocked: firstStepsUnlocked },
      { title: 'Comeback Kid', description: '0-step day followed by 5,000+ step day', icon: '🔄', unlocked: comebackKidUnlocked },
      { title: 'Monthly Master', description: 'Hit your goal every day this month', icon: '🏆', unlocked: monthGoalUnlocked },
      { title: 'Weekend Streak', description: 'Active on 4 consecutive weekends', icon: '📆', unlocked: weekendStreakUnlocked },
      { title: 'Step Explorer', description: 'Increased your goal 3+ times', icon: '🧭', unlocked: stepExplorerUnlocked },
      { title: 'Consistency Pro', description: '5,000+ steps every day for 2 weeks', icon: '🥇', unlocked: consistencyProUnlocked },
    ];
    return (
      <View style={styles.achievementsContainer}>
        <Text style={styles.achievementsTitle}>Achievements</Text>
        {achievements.map((achievement, index) => (
          <View key={index} style={[
            styles.achievementCard,
            !achievement.unlocked && styles.lockedAchievement
          ]}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <View style={styles.achievementContent}>
              <Text style={[
                styles.achievementTitle,
                !achievement.unlocked && styles.lockedText
              ]}>
                {achievement.title}
              </Text>
              <Text style={[
                styles.achievementDescription,
                !achievement.unlocked && styles.lockedText
              ]}>
                {achievement.description}
              </Text>
            </View>
            {achievement.unlocked && (
              <View style={styles.unlockedBadge}>
                <Text style={styles.unlockedText}>✓</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Debug Info */}
      {/* <View style={{ padding: 10, backgroundColor: '#f5f5f5', margin: 10, borderRadius: 8 }}>
        <Text style={{ fontSize: 12 }}>stepCount (raw): {stepCount}</Text>
        <Text style={{ fontSize: 12 }}>stepOffset: {stepOffset}</Text>
        <Text style={{ fontSize: 12 }}>stepsSinceGoal: {stepsSinceGoal}</Text>
        <Text style={{ fontSize: 12 }}>isAvailable: {String(isAvailable)}</Text>
      </View> */}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Steps</Text>
        <TouchableOpacity 
        style={styles.moreButton}
        onPress={() => setShowManualInput(true)}
        >
          <MoreHorizontal size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['day', 'week', 'month'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Progress Circle (Day view only) */}
        {activeTab === 'day' && renderCircularProgress(justResetGoal ? 0 : stepsSinceGoal, currentData.goal, goalResetKey)}

        {/* Charts */}
        {activeTab === 'day' && renderHourlyChart(currentData.hourlyData)}
        {activeTab === 'week' && renderWeeklyChart({ dailyData: weekData })}
        {activeTab === 'month' && renderMonthlyChart({ weeklyData: [
  { totalSteps: monthData.reduce((s, d) => s + d.steps, 0),
    dailyData: monthData,
    // Add more aggregation if needed
  }
] })}

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Achievements (Day view only) */}
        {activeTab === 'day' && renderAchievements()}

        {/* Weekly/Monthly Summary */}
        {activeTab !== 'day' && (
          <View style={styles.summaryContainer}>
            <LinearGradient
              colors={colorScheme === 'dark' ? ['#1E40AF', '#3730A3'] : ['#667EEA', '#764BA2']}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.summaryTitle}>
                {activeTab === 'week' ? 'This Week' : 'This Month'}
              </Text>
              <Text style={styles.summarySteps}>
                {formatNumber(activeTab === 'week' ? fallbackData.weekly[fallbackData.weekly.length - 1].totalSteps : fallbackData.monthly[0].totalSteps)}
              </Text>
              <Text style={styles.summarySubtitle}>Total Steps</Text>
              
              <View style={styles.summaryStats}>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>
                    {formatNumber(activeTab === 'week' ? fallbackData.weekly[fallbackData.weekly.length - 1].totalCalories : fallbackData.monthly[0].totalCalories)}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Calories</Text>
                </View>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>
                    {(activeTab === 'week' ? fallbackData.weekly[fallbackData.weekly.length - 1].totalDistance : fallbackData.monthly[0].totalDistance).toFixed(1)}
                  </Text>
                  <Text style={styles.summaryStatLabel}>km</Text>
                </View>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>
                    {activeTab === 'week' ? fallbackData.weekly[fallbackData.weekly.length - 1].daysActive : fallbackData.monthly[0].daysActive}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Active Days</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Step Input Modal */}
      <StepInputModal
        visible={showGoalInput}
        onClose={() => setShowGoalInput(false)}
        onAddSteps={handleManualGoalInput}
        totalSteps={currentData.goal}
        title="Add Goal"
        currentLabel="Current Goal"
        inputLabel="Goal to Add"
        addButtonLabel="Add Goal"
      />
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
  moreButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    margin: 20,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.text,
  },
  tabText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.background,
  },
  content: {
    flex: 1,
  },
  circularProgressContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  circularProgress: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  progressBackground: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 20,
    borderColor: colors.borderLight,
  },
  progressForeground: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 20,
    borderColor: colors.primary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  stepsNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: colors.text,
    marginBottom: 4,
  },
  goalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  chartContent: {
    flexDirection: 'row',
    height: 120,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingRight: 12,
    width: 50,
  },
  yAxisLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    justifyContent: 'space-between',
  },
  chartBar: {
    width: 8,
    borderRadius: 4,
    minHeight: 2,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  xAxisLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xAxisText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 10,
  },
  weeklyBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyBar: {
    width: 24,
    borderRadius: 12,
    minHeight: 4,
    marginBottom: 8,
  },
  weeklyBarLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
  },
  todayBarLabel: {
    color: colors.warning,
  },
  monthlyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 20,
  },
  monthlyBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  monthlyBar: {
    width: 32,
    borderRadius: 16,
    minHeight: 4,
    marginBottom: 8,
  },
  monthlyBarLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  achievementsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  achievementsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  lockedAchievement: {
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  achievementDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  lockedText: {
    color: colors.textTertiary,
  },
  unlockedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  summaryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  summarySteps: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  manualInputContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  manualInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  manualInputText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
  },
  trackingControls: {
    marginTop: 12,
    gap: 8,
  },
  trackingButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: colors.success,
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  trackingButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  syncButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  syncButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  quickAddContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  quickAddLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickAddButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  quickAddText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
});