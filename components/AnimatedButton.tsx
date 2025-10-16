import React, { useRef } from 'react';
import { Animated, Pressable, Text, ViewStyle, TextStyle, View } from 'react-native';

interface AnimatedButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string; // For tailwind styling if needed
  textClassName?: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  pressableStyle?: ViewStyle;
  iconSpacing?: number;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  icon,
  onPress,
  style,
  textStyle,
  className,
  textClassName,
  pressableStyle,
  iconSpacing = 8,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
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
      style={pressableStyle}
    >
      <Animated.View
        style={[{ transform: [{ scale }], flex: 1 }, style]}
        className={className}
      >
        <View className="flex-row items-center justify-center">
          {icon && <View>{icon}</View>}
          {icon && children ? <View style={{ width: iconSpacing }} /> : null}
          {children && (
            <Text className={textClassName} style={textStyle}>
              {children}
            </Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};
