import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const REFRESH_HEIGHT = 100;
const TRIGGER_HEIGHT = 80;

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
}

// Modern color scheme
const colors = {
  background: '#ffffff',
  surface: '#f8f9fa',
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  text: '#1f2937',
  textLight: '#6b7280',
  shadow: '#000000',
  success: '#10b981',
};

export default function PullToRefresh({ 
  children, 
  onRefresh, 
  refreshing = false 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(refreshing);
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 0;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 5 && !isRefreshing;
    },
    onPanResponderGrant: () => {
      setScrollEnabled(false);
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        const newValue = Math.min(gestureState.dy * 0.6, REFRESH_HEIGHT);
        translateY.setValue(newValue);
        
        // Animate progress and scale based on pull distance
        const progress = Math.min(newValue / TRIGGER_HEIGHT, 1);
        scaleValue.setValue(progress);
        progressValue.setValue(progress);
        
        // Add elastic effect when reaching trigger point
        if (progress >= 1) {
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 100,
            useNativeDriver: false,
          }).start(() => {
            Animated.timing(pulseValue, {
              toValue: 1,
              duration: 100,
              useNativeDriver: false,
            }).start();
          });
        }
      }
    },
    onPanResponderRelease: async (evt, gestureState) => {
      setScrollEnabled(true);
      
      if (gestureState.dy > TRIGGER_HEIGHT && !isRefreshing) {
        // Trigger refresh
        setIsRefreshing(true);
        
        // Animate to refresh position
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: REFRESH_HEIGHT,
            tension: 100,
            friction: 8,
            useNativeDriver: false,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(progressValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();

        // Start loading animations
        const rotationAnimation = Animated.loop(
          Animated.timing(rotateValue, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          })
        );
        
        const pulseAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseValue, {
              toValue: 1.05,
              duration: 800,
              useNativeDriver: false,
            }),
            Animated.timing(pulseValue, {
              toValue: 1,
              duration: 800,
              useNativeDriver: false,
            }),
          ])
        );

        rotationAnimation.start();
        pulseAnimation.start();

        try {
          await onRefresh();
        } finally {
          // Stop animations and reset
          rotationAnimation.stop();
          pulseAnimation.stop();
          setIsRefreshing(false);
          
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              tension: 100,
              friction: 8,
              useNativeDriver: false,
            }),
            Animated.timing(scaleValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: false,
            }),
            Animated.timing(progressValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: false,
            }),
            Animated.timing(rotateValue, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(pulseValue, {
              toValue: 1,
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start();
        }
      } else {
        // Reset to original position
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: false,
          }),
          Animated.timing(scaleValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(progressValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }
    },
  });

  const iconRotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const refreshOpacity = translateY.interpolate({
    inputRange: [0, TRIGGER_HEIGHT / 3, TRIGGER_HEIGHT],
    outputRange: [0, 0.6, 1],
    extrapolate: 'clamp',
  });

  const progressScale = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
    extrapolate: 'clamp',
  });

  const circleProgress = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 360],
    extrapolate: 'clamp',
  });

  const backgroundOpacity = translateY.interpolate({
    inputRange: [0, TRIGGER_HEIGHT],
    outputRange: [0, 0.1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Background overlay */}
      <Animated.View 
        style={[
          styles.backgroundOverlay,
          { opacity: backgroundOpacity }
        ]}
      />

      {/* Refresh Indicator */}
      <Animated.View 
        style={[
          styles.refreshContainer,
          {
            opacity: refreshOpacity,
            transform: [
              { translateY: Animated.subtract(translateY, REFRESH_HEIGHT) }
            ],
          }
        ]}
      >
        {/* Progress ring background */}
        <Animated.View
          style={[
            styles.progressRingBackground,
            {
              transform: [
                { scale: progressScale },
                { scale: pulseValue },
              ],
            }
          ]}
        />

        {/* Progress ring */}
        <Animated.View
          style={[
            styles.progressRing,
            {
              transform: [
                { scale: progressScale },
                { scale: pulseValue },
                { rotate: isRefreshing ? iconRotation : '0deg' },
              ],
            }
          ]}
        >
          {/* Inner circle with icon */}
          <View style={styles.innerCircle}>
            {isRefreshing ? (
              <View style={styles.loadingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            ) : (
              <Text style={styles.refreshIcon}>↓</Text>
            )}
          </View>
        </Animated.View>

        {/* Status text */}
        <Animated.View
          style={[
            styles.textContainer,
            { opacity: refreshOpacity }
          ]}
        >
          <Text style={styles.refreshText}>
            {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </Text>
          {!isRefreshing && (
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                }
              ]}
            />
          )}
        </Animated.View>
      </Animated.View>

      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          { transform: [{ translateY }] }
        ]}
        {...panResponder.panHandlers}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          bounces={false}
          scrollEnabled={scrollEnabled}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: REFRESH_HEIGHT * 2,
    backgroundColor: colors.primary,
    zIndex: 0,
  },
  refreshContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: REFRESH_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  progressRingBackground: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  progressRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: colors.primary,
    borderTopColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  innerCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  dot1: {
    backgroundColor: colors.primary,
  },
  dot2: {
    backgroundColor: colors.secondary,
  },
  dot3: {
    backgroundColor: colors.accent,
  },
  textContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  progressBar: {
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    width: 60,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});