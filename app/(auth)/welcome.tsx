import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? 'light');
  // Always recalculate styles on every render for color scheme changes
  const styles = React.useMemo(() => createStyles(colors, width, height), [colors, width, height]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.logo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Dumbbell size={48} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </View>

          <Text style={styles.appName}>VinayFit</Text>
          <Text style={styles.tagline}>Transform Your Fitness Journey</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Start your fitness transformation today
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, screenWidth: number, screenHeight: number) => {
  const isLandscape = screenWidth > screenHeight;
  const isTablet = screenWidth >= 768;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background, // Ensure background updates with color scheme
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: isTablet ? 60 : 40,
      paddingVertical: isLandscape ? 40 : 60,
    },
    logoSection: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    logoContainer: {
      marginBottom: 32,
    },
    logo: {
      width: isTablet ? 120 : 100,
      height: isTablet ? 120 : 100,
      borderRadius: isTablet ? 60 : 50,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#667EEA',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 16,
    },
    appName: {
      fontFamily: 'Inter-Bold',
      fontSize: isTablet ? 48 : 40,
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
      letterSpacing: -1,
    },
    tagline: {
      fontFamily: 'Inter-Regular',
      fontSize: isTablet ? 20 : 18,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 26,
    },
    actionSection: {
      width: '100%',
      maxWidth: 320,
      gap: 16,
    },
    primaryButton: {
      borderRadius: 16,
      shadowColor: '#667EEA',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    primaryButtonGradient: {
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
    },
    primaryButtonText: {
      fontFamily: 'Inter-Bold',
      fontSize: 18,
      color: '#FFFFFF',
    },
    secondaryButton: {
      paddingVertical: 18,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
    secondaryButtonText: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 18,
      color: colors.text,
    },
    footer: {
      alignItems: 'center',
      paddingBottom: 20,
    },
    footerText: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  });
};