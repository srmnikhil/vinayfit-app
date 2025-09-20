# Bolt App - Fitness & Health Tracking

A comprehensive fitness and health tracking application built with React Native and Expo.

## Features

### Step Tracking Integration

The app now includes a comprehensive step tracking system with the following features:

#### Core Functionality
- **Real-time step tracking** with manual input capability
- **Daily, weekly, and monthly views** with detailed analytics
- **Goal setting and progress tracking** with customizable targets
- **Calorie and distance calculations** based on step count
- **Hourly breakdown** of daily activity
- **Achievement system** to motivate users

#### Data Sources
- **Manual input** - Users can manually add steps through an intuitive modal
- **Device sensors** - Integration with device pedometer (when available)
- **Health apps** - Sync with Apple Health, Google Fit, Fitbit, etc.
- **Supabase backend** - Persistent storage and data synchronization

#### Key Components

1. **StepTrackingService** (`services/stepTrackingService.ts`)
   - Singleton service for managing step data
   - Handles data persistence to Supabase and local storage
   - Provides methods for CRUD operations on step data
   - Supports multiple data sources

2. **useStepTracking Hook** (`hooks/useStepTracking.ts`)
   - React hook for easy integration with components
   - Provides real-time data updates
   - Handles loading states and error management
   - Offers convenient methods for adding/updating steps

3. **StepTrackerScreen** (`app/step-tracker.tsx`)
   - Main step tracking interface
   - Beautiful circular progress indicator
   - Interactive charts for different time periods
   - Achievement system and statistics

4. **StepInputModal** (`components/StepInputModal.tsx`)
   - Modal for manually adding steps
   - Quick-add buttons for common amounts
   - Real-time preview of new totals
   - Input validation and error handling

#### Usage Example

```typescript
import { useStepTracking } from '@/hooks/useStepTracking';

function MyComponent() {
  const {
    todayData,
    weeklyData,
    monthlyData,
    goals,
    isLoading,
    addSteps,
    setGoals,
  } = useStepTracking();

  const handleAddSteps = async () => {
    const success = await addSteps(1000, 'manual');
    if (success) {
      console.log('Steps added successfully!');
    }
  };

  return (
    <View>
      <Text>Today's Steps: {todayData?.steps || 0}</Text>
      <Button title="Add 1000 Steps" onPress={handleAddSteps} />
    </View>
  );
}
```

#### Data Structure

```typescript
interface StepData {
  date: string;
  steps: number;
  goal: number;
  calories: number;
  distance: number; // in km
  activeMinutes: number;
  hourlyData: number[]; // 24 hours
  source: 'manual' | 'device' | 'health_app' | 'estimated';
  lastUpdated: string;
}
```

#### Integration Points

The step tracking system integrates with:

1. **Today Screen** - Shows current day's step progress
2. **Profile Screen** - Access to detailed step tracking
3. **Analytics** - Step data contributes to overall fitness metrics
4. **Goals System** - Step goals integrate with fitness goals
5. **Health Apps** - Data can be synced with external health platforms

#### Future Enhancements

- **GPS tracking** for walk/run routes
- **Social features** - Step challenges with friends
- **Advanced analytics** - Step patterns and trends
- **Integration with wearables** - Apple Watch, Fitbit, etc.
- **Machine learning** - Smart goal recommendations

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your Supabase project and add environment variables

3. Run the development server:
   ```bash
   npm run dev
   ```

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Supabase** for backend and database
- **React Navigation** for routing
- **Lucide React Native** for icons
- **Expo Linear Gradient** for beautiful gradients

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
