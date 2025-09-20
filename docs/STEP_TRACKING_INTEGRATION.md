# Step Tracking Integration Guide

This guide explains how to integrate the step tracking functionality into your Bolt app.

## Overview

The step tracking system provides a comprehensive solution for tracking user activity with support for multiple data sources, real-time updates, and beautiful visualizations.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │    │  useStepTracking │    │ StepTracking    │
│                 │◄──►│     Hook         │◄──►│   Service       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────┐
                                              │   Data Sources  │
                                              │                 │
                                              │ • Supabase      │
                                              │ • Local Storage │
                                              │ • Device Sensors│
                                              │ • Health Apps   │
                                              └─────────────────┘
```

## Quick Start

### 1. Basic Integration

```typescript
import { useStepTracking } from '@/hooks/useStepTracking';

function MyComponent() {
  const { todayData, addSteps, isLoading } = useStepTracking();

  const handleAddSteps = async () => {
    await addSteps(1000, 'manual');
  };

  return (
    <View>
      <Text>Steps: {todayData?.steps || 0}</Text>
      <Button title="Add Steps" onPress={handleAddSteps} />
    </View>
  );
}
```

### 2. Navigation Integration

Add the step tracker to your navigation:

```typescript
// In your navigation file
import StepTrackerScreen from '@/app/step-tracker';

// Add to your stack navigator
<Stack.Screen 
  name="step-tracker" 
  component={StepTrackerScreen}
  options={{ title: 'Step Tracker' }}
/>
```

### 3. Today Screen Integration

Update your today screen to show step progress:

```typescript
import { useStepTracking } from '@/hooks/useStepTracking';

function TodayScreen() {
  const { todayData, goals } = useStepTracking();
  
  const stepProgress = todayData ? (todayData.steps / todayData.goal) * 100 : 0;

  return (
    <View style={styles.stepCard}>
      <Text style={styles.cardTitle}>Steps Today</Text>
      <Text style={styles.stepCount}>
        {todayData?.steps.toLocaleString() || 0} / {goals?.daily.toLocaleString() || 10000}
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${stepProgress}%` }]} />
      </View>
    </View>
  );
}
```

## API Reference

### useStepTracking Hook

#### Returns

```typescript
{
  // Data
  todayData: StepData | null;
  weeklyData: WeekData | null;
  monthlyData: MonthData | null;
  goals: StepGoal | null;
  
  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
  
  // Actions
  addSteps: (steps: number, source?: StepData['source']) => Promise<boolean>;
  updateStepData: (date: string, data: Partial<StepData>) => Promise<boolean>;
  setGoals: (goals: StepGoal) => Promise<boolean>;
  refreshData: () => Promise<void>;
  
  // Utilities
  getStepData: (date: string) => Promise<StepData | null>;
  getStepDataRange: (startDate: string, endDate: string) => Promise<StepData[]>;
  getWeeklyData: (weekStart: string) => Promise<WeekData | null>;
  getMonthlyData: (year: number, month: number) => Promise<MonthData | null>;
}
```

#### Methods

##### addSteps(steps: number, source?: StepData['source'])

Add steps to today's count.

```typescript
const success = await addSteps(1000, 'manual');
if (success) {
  console.log('Steps added successfully!');
}
```

##### updateStepData(date: string, data: Partial<StepData>)

Update step data for a specific date.

```typescript
const success = await updateStepData('2024-01-15', {
  steps: 8500,
  calories: 340,
  distance: 6.8
});
```

##### setGoals(goals: StepGoal)

Set step goals for daily, weekly, and monthly targets.

```typescript
const success = await setGoals({
  daily: 10000,
  weekly: 70000,
  monthly: 300000
});
```

### StepTrackingService

Direct service access for advanced use cases:

```typescript
import StepTrackingService from '@/services/stepTrackingService';

const service = StepTrackingService.getInstance();

// Initialize the service
await service.initialize();

// Get step data for a specific date
const stepData = await service.getStepData('2024-01-15');

// Get data for a date range
const stepDataRange = await service.getStepDataRange('2024-01-01', '2024-01-31');
```

## Data Models

### StepData

```typescript
interface StepData {
  date: string;                    // ISO date string (YYYY-MM-DD)
  steps: number;                   // Total steps for the day
  goal: number;                    // Daily step goal
  calories: number;                // Estimated calories burned
  distance: number;                // Distance in kilometers
  activeMinutes: number;           // Active minutes
  hourlyData: number[];            // 24-hour breakdown
  source: 'manual' | 'device' | 'health_app' | 'estimated';
  lastUpdated: string;             // ISO timestamp
}
```

### WeekData

```typescript
interface WeekData {
  weekStart: string;               // Start date of the week
  totalSteps: number;              // Total steps for the week
  averageSteps: number;            // Average daily steps
  daysActive: number;              // Number of active days
  totalCalories: number;           // Total calories burned
  totalDistance: number;           // Total distance
  dailyData: StepData[];           // Array of daily data
}
```

### MonthData

```typescript
interface MonthData {
  month: string;                   // Month name
  year: number;                    // Year
  totalSteps: number;              // Total steps for the month
  averageSteps: number;            // Average daily steps
  daysActive: number;              // Number of active days
  totalCalories: number;           // Total calories burned
  totalDistance: number;           // Total distance
  weeklyData: WeekData[];          // Array of weekly data
}
```

### StepGoal

```typescript
interface StepGoal {
  daily: number;                   // Daily step goal
  weekly: number;                  // Weekly step goal
  monthly: number;                 // Monthly step goal
  custom?: number;                 // Custom goal (optional)
}
```

## UI Components

### StepInputModal

A modal component for manually adding steps:

```typescript
import StepInputModal from '@/components/StepInputModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  const { addSteps, todayData } = useStepTracking();

  return (
    <>
      <Button title="Add Steps" onPress={() => setShowModal(true)} />
      
      <StepInputModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAddSteps={addSteps}
        currentSteps={todayData?.steps || 0}
      />
    </>
  );
}
```

### Custom Step Card

Create a custom step display component:

```typescript
function StepCard({ steps, goal, onPress }: StepCardProps) {
  const progress = (steps / goal) * 100;
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Footprints size={24} color={colors.primary} />
        <Text style={styles.title}>Steps Today</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.steps}>{steps.toLocaleString()}</Text>
        <Text style={styles.goal}>/ {goal.toLocaleString()}</Text>
      </View>
      
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </TouchableOpacity>
  );
}
```

## Data Persistence

### Supabase Integration

The step tracking system automatically syncs with Supabase using the `daily_stats` table:

```sql
-- Example table structure
CREATE TABLE daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  steps integer DEFAULT 0,
  calories_burned integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Local Storage

Data is also cached locally using AsyncStorage for offline functionality:

```typescript
// Data is automatically cached
const stepData = await service.getStepData('2024-01-15');
// This will first check Supabase, then fall back to local storage
```

## Error Handling

The step tracking system includes comprehensive error handling:

```typescript
const { addSteps, isLoading, isUpdating } = useStepTracking();

const handleAddSteps = async () => {
  try {
    const success = await addSteps(1000);
    if (success) {
      // Show success message
      Alert.alert('Success', 'Steps added successfully!');
    } else {
      // Show error message
      Alert.alert('Error', 'Failed to add steps. Please try again.');
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Step tracking error:', error);
    Alert.alert('Error', 'An unexpected error occurred.');
  }
};
```

## Performance Considerations

1. **Lazy Loading**: Data is loaded on-demand to minimize initial load time
2. **Caching**: Local storage provides offline functionality
3. **Optimistic Updates**: UI updates immediately while data syncs in background
4. **Batch Operations**: Multiple updates are batched when possible

## Testing

### Unit Tests

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useStepTracking } from '@/hooks/useStepTracking';

test('should add steps successfully', async () => {
  const { result } = renderHook(() => useStepTracking());
  
  await act(async () => {
    const success = await result.current.addSteps(1000);
    expect(success).toBe(true);
  });
  
  expect(result.current.todayData?.steps).toBe(1000);
});
```

### Integration Tests

```typescript
test('should sync with Supabase', async () => {
  const service = StepTrackingService.getInstance();
  
  // Add steps
  await service.addSteps(1000);
  
  // Verify data is in Supabase
  const stepData = await service.getStepData(new Date().toISOString().split('T')[0]);
  expect(stepData?.steps).toBe(1000);
});
```

## Troubleshooting

### Common Issues

1. **Data not syncing**: Check Supabase connection and permissions
2. **Performance issues**: Ensure proper error boundaries and loading states
3. **Offline functionality**: Verify AsyncStorage is working correctly

### Debug Mode

Enable debug logging:

```typescript
// In your app initialization
if (__DEV__) {
  console.log('Step tracking debug mode enabled');
}
```

## Future Enhancements

- [ ] GPS route tracking
- [ ] Social features and challenges
- [ ] Advanced analytics and insights
- [ ] Wearable device integration
- [ ] Machine learning recommendations
- [ ] Export functionality
- [ ] Custom goal types
- [ ] Achievement badges

## Support

For questions or issues with the step tracking integration:

1. Check the troubleshooting section above
2. Review the API documentation
3. Look at example implementations in the codebase
4. Create an issue in the repository

## Contributing

To contribute to the step tracking system:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request 