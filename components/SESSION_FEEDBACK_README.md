# Session Feedback Components

This implementation provides UI components for collecting client feedback and ratings on completed training sessions. The system uses a 1-5 star rating system with optional text feedback.

## Components Created

### 1. SessionFeedbackModal
A modal component that presents a feedback form with:
- 5-star rating system
- Optional text feedback field
- Session information display
- Submit and cancel actions

### 2. SessionFeedbackCard
A wrapper component that integrates with session data and shows:
- Feedback prompt for sessions without feedback
- Existing feedback display for sessions that have been rated
- Rating-only display for sessions with ratings but no text

### 3. updateSessionClientFeedback Function
A database query function that updates the `training_sessions` table with:
- `session_rating` (1-5 numeric rating)
- `client_feedback` (optional text feedback)

## Integration Example

```typescript
import React from 'react';
import { View } from 'react-native';
import SessionFeedbackCard from '@/components/SessionFeedbackCard';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';

function MySessionList({ sessions, onRefresh }) {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);

  return (
    <View>
      {sessions.map(session => (
        <View key={session.id}>
          {/* Your existing session card content */}
          
          {/* Add feedback component for completed sessions */}
          <SessionFeedbackCard 
            session={session} 
            colors={colors} 
            onFeedbackSubmitted={onRefresh}
          />
        </View>
      ))}
    </View>
  );
}
```

## Features

### Star Rating System
- Interactive 1-5 star rating
- Visual feedback with filled/unfilled stars
- Text labels (Poor, Fair, Good, Very Good, Excellent)

### Feedback States
1. **No Feedback**: Shows a dashed border prompt encouraging feedback
2. **Rating Only**: Shows stars in a compact display
3. **Full Feedback**: Shows stars and feedback text with success styling

### Form Validation
- Rating is required (submit button disabled without rating)
- Text feedback is optional
- Loading states during submission
- Error handling with user-friendly messages

### Database Integration
- Updates `session_rating` field (1-5 integer)
- Updates `client_feedback` field (optional text)
- Uses existing `updateSessionClientFeedback` function
- Maintains data integrity with proper error handling

## UI Design Patterns

The components follow the existing project patterns:
- Uses Inter font family with appropriate weights
- Follows the color scheme system
- Consistent spacing and border radius (8px, 12px)
- Material design-inspired shadows and elevations
- Responsive to dark/light themes

## Usage Notes

- Only shows for sessions with `status === 'completed'`
- Automatically refreshes session data after feedback submission
- Supports both trainer and client views
- Modal uses slide animation and bottom sheet pattern
- Form resets after successful submission

## Database Schema Requirements

The `training_sessions` table should have these fields:
- `session_rating`: integer (1-5)
- `client_feedback`: text (nullable)
- `updated_at`: timestamp (automatically updated)

## Customization

The components accept color theming and can be styled by modifying:
- `createStyles()` functions in each component
- Color scheme definitions
- Font families and sizes
- Spacing and layout values
