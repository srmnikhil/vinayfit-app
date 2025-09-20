import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader,
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { signIn, user} = useAuth();
  const { userRole } = useUserRole();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  useEffect(() => {
    // If userRole is set after sign-in, navigate to the correct tab
    if (userRole) {
      // You can customize this logic for different roles
      const checkProfileStatus = async () => {
        const userId = user?.id;
        console.log(userId)
        if (!userId) return;

        const { data, error } = await supabase
          .from('leads')
          .select('is_profile_complete')
          .eq('id', userId)
          .maybeSingle();

        if (error || !data) return;

        if (!data.is_profile_complete) {
          router.replace('/profile-settings'); // redirect to profile update
        } else {
          router.replace('/(tabs)'); // normal app flow
        }
      };
checkProfileStatus();
    }
  }, [userRole]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const { data, error } = await signIn(email.trim(), password);

      if (error) {
        console.error('Sign in error:', error);

        if (error.message.includes('Invalid login credentials')) {
          setErrors({
            general: 'Invalid email or password. Please try again.',
          });
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({
            general:
              'Please check your email and confirm your account before signing in.',
          });
        } else {
          setErrors({
            general: error.message || 'An error occurred during sign in',
          });
        }
        return;
      }

      if (data.user) {
        // Navigation will be handled by the auth state change in AuthContext
        console.log('Sign in successful');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your fitness journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* General Error */}
            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View
                style={[styles.inputWrapper, errors.email && styles.inputError]}
              >
                <Mail
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <Text style={styles.fieldError}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password && styles.inputError,
                ]}
              >
                <Lock
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.fieldError}>{errors.password}</Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>
                Forgot your password?
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <LinearGradient
                colors={
                  loading
                    ? [colors.borderLight, colors.borderLight]
                    : ['#667EEA', '#764BA2']
                }
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Loader size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Signing In...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontFamily: 'Inter-Bold',
      fontSize: 32,
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: 'Inter-Regular',
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    form: {
      paddingHorizontal: 20,
    },
    errorContainer: {
      backgroundColor: `${colors.error}15`,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    errorText: {
      fontFamily: 'Inter-Medium',
      fontSize: 14,
      color: colors.error,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    inputError: {
      borderColor: colors.error,
    },
    inputIcon: {
      marginRight: 12,
    },
    textInput: {
      flex: 1,
      fontFamily: 'Inter-Regular',
      fontSize: 16,
      color: colors.text,
    },
    eyeButton: {
      padding: 4,
    },
    fieldError: {
      fontFamily: 'Inter-Regular',
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    },
    forgotPassword: {
      alignItems: 'flex-end',
      marginBottom: 32,
    },
    forgotPasswordText: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 14,
      color: colors.primary,
    },
    signInButton: {
      borderRadius: 12,
      marginBottom: 24,
      shadowColor: '#667EEA',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    buttonDisabled: {
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonGradient: {
      paddingVertical: 18,
      borderRadius: 12,
      alignItems: 'center',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    buttonText: {
      fontFamily: 'Inter-Bold',
      fontSize: 16,
      color: '#FFFFFF',
    },
    signUpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signUpText: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      color: colors.textSecondary,
    },
    signUpLink: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 14,
      color: colors.primary,
    },
  });
