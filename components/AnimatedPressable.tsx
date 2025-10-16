import React, { useRef } from 'react';
import { Animated, Pressable, ViewStyle } from 'react-native';

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  animatedStyle?: ViewStyle;
  scaleTo?: number;
  className?: string;
  innerClassName?: string; // ✨ NEW: lets you style inner animated view separately
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPress,
  style,
  animatedStyle,
  className,
  innerClassName,
  scaleTo = 0.95,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      friction: 10,
      tension: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 10,
      tension: 50,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={className} // outer container (stays static)
      style={style}
    >
      {/* ✨ Animate only the inner content */}
      <Animated.View
        className={innerClassName}
        style={[{ transform: [{ scale }] }, animatedStyle]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};
