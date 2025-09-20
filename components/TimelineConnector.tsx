import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';

interface TimelineConnectorProps {
  isFirst?: boolean;
  isLast?: boolean;
  delay?: number;
}

export const TimelineConnector: React.FC<TimelineConnectorProps> = ({
  isFirst = false,
  isLast = false,
  delay = 0,
}) => {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  
  const scaleY = useSharedValue(0);

  React.useEffect(() => {
    scaleY.value = withDelay(
      delay,
      withSpring(1, {
        damping: 15,
        stiffness: 100,
      })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  if (isFirst && isLast) return null;

  return (
    <View style={styles.container}>
      {!isFirst && (
        <Animated.View
          style={[
            styles.line,
            styles.topLine,
            { backgroundColor: colors.border },
            animatedStyle,
          ]}
        />
      )}
      <View
        style={[
          styles.dot,
          { backgroundColor: colors.primary },
        ]}
      />
      {!isLast && (
        <Animated.View
          style={[
            styles.line,
            styles.bottomLine,
            { backgroundColor: colors.border },
            animatedStyle,
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 20,
    alignItems: 'center',
    marginRight: 16,
  },
  line: {
    width: 2,
    flex: 1,
  },
  topLine: {
    marginBottom: 4,
  },
  bottomLine: {
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});