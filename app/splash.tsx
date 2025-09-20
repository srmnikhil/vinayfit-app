import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Heart, Target, TrendingUp } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { user, loading } = useAuth();
  const hasNavigated = useRef(false); // <-- Add this line

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const iconsOpacity = useRef(new Animated.Value(0)).current;
  const iconsScale = useRef(new Animated.Value(0.8)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  useEffect(() => {
    if (!loading && !hasNavigated.current) {
      setTimeout(() => {
        setTimeout(() => {
          if (!hasNavigated.current) {
            hasNavigated.current = true;
            if (user) {
              router.replace('/(tabs)');
            } else {
              router.replace('/(auth)/welcome');
            }
          }
        }, 100);
      }, 1500);
    }
  }, [user, loading]);

  const startAnimations = () => {
    // Logo animation sequence
    Animated.sequence([
      // Logo scale and fade in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      
      // Text animations
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Tagline animation
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(taglineTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Icons animation
      Animated.parallel([
        Animated.timing(iconsOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(iconsScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Progress bar animation
      Animated.parallel([
        Animated.timing(progressOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(progressWidth, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  };

  const logoRotationInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidthInterpolate = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const features = [
    { icon: Dumbbell, color: '#667EEA' },
    { icon: Target, color: '#10B981' },
    { icon: Heart, color: '#EF4444' },
    { icon: TrendingUp, color: '#F59E0B' },
  ];

  return (
    <View style={styles.container}>
      {/* <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} /> */}
      
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ['#0F172A', '#1E293B', '#334155'] 
          : ['#F8FAFC', '#E2E8F0', '#CBD5E1']
        }
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          {Array.from({ length: 20 }).map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.patternDot,
                {
                  opacity: iconsOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.1],
                  }),
                  transform: [{
                    scale: iconsScale.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    })
                  }],
                  left: `${(index % 5) * 20 + 10}%`,
                  top: `${Math.floor(index / 5) * 20 + 10}%`,
                }
              ]}
            />
          ))}
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: logoOpacity,
                  transform: [
                    { scale: logoScale },
                    { rotate: logoRotationInterpolate },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#667EEA', '#764BA2', '#F093FB']}
                style={styles.logo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Dumbbell size={48} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
              
              {/* Glow effect */}
              <View style={styles.logoGlow} />
            </Animated.View>

            {/* App Name */}
            <Animated.View
              style={{
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              }}
            >
              <Text style={styles.appName}>VinayFit</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View
              style={{
                opacity: taglineOpacity,
                transform: [{ translateY: taglineTranslateY }],
              }}
            >
              <Text style={styles.tagline}>Transform Your Fitness Journey</Text>
            </Animated.View>
          </View>

          {/* Feature Icons */}
          <Animated.View
            style={[
              styles.featuresContainer,
              {
                opacity: iconsOpacity,
                transform: [{ scale: iconsScale }],
              },
            ]}
          >
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.featureIcon,
                    {
                      transform: [{
                        scale: iconsScale.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        })
                      }],
                    }
                  ]}
                >
                  <LinearGradient
                    colors={[feature.color, `${feature.color}80`]}
                    style={styles.featureIconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <IconComponent size={24} color="#FFFFFF" />
                  </LinearGradient>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Loading Section */}
          <Animated.View
            style={[
              styles.loadingSection,
              { opacity: progressOpacity }
            ]}
          >
            <Text style={styles.loadingText}>
              {loading ? 'Preparing your experience...' : 'Ready to start!'}
            </Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    { width: progressWidthInterpolate }
                  ]}
                >
                  <LinearGradient
                    colors={['#667EEA', '#764BA2']}
                    style={styles.progressGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.View
          style={[
            styles.footer,
            { opacity: taglineOpacity }
          ]}
        >
          <Text style={styles.footerText}>Powered by VinayFit</Text>
          <View style={styles.footerDots}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.footerDot,
                  {
                    opacity: progressOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                    transform: [{
                      scale: progressOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      })
                    }]
                  }
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  patternDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#667EEA',
    opacity: 0.2,
    top: -10,
    left: -10,
    zIndex: -1,
  },
  appName: {
    fontFamily: 'Inter-Bold',
    fontSize: 42,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 80,
    gap: 20,
  },
  featureIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  featureIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSection: {
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    width: '80%',
    maxWidth: 280,
  },
  progressBackground: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressGradient: {
    flex: 1,
    borderRadius: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 16,
  },
  footerDots: {
    flexDirection: 'row',
    gap: 8,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});