import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  color: string;
  backgroundColor?: string;
  height?: number;
  borderRadius?: number;
  delay?: number;
}



export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  color,
  backgroundColor = '#E5E7EB',
  height = 4,
  borderRadius = 2,
  delay = 0,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withDelay(delay, withSpring(Math.min(progress, 100)));
  }, [progress, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    // Ensure containerWidth exists before calculating numeric width
    const width = containerWidth > 0 ? (containerWidth * progressValue.value) / 100 : 0;
    return {
      width,
    };
  });

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={{
        backgroundColor,
        height,
        borderRadius,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          height,
          borderRadius,
          backgroundColor: color,
          ...animatedStyle,
        }}
      />
    </View>
  );
};
