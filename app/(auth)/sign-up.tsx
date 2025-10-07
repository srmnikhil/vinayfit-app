import React, { useState, useMemo } from 'react';
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
  User,
  Loader,
  Check,
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
export default function SignUpScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const userData = {
        full_name: formData.fullName.trim(),
        role: 'lead',
      };

      console.log(userData)
      const { data, error } = await signUp(
        formData.email.trim(),
        formData.password,
        userData
      );
      if (error) {
        console.error('Sign up error:', error);
        if (error.message.includes('User already registered')) {
          setErrors({
            general:
              'An account with this email already exists. Please sign in instead.',
          });
        } else {
          setErrors({
            general: error.message || 'An error occurred during sign up',
          });
        }
        return;
      }

      // Insert profile with role and full_name after successful sign up
      if (data.user) {
        const { id, email } = data.user;
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id,
            email,
            full_name: formData.fullName.trim(),
            role: 'leads',
          },
          { onConflict: 'id' }
        );
        if (profileError) {
          console.error('Profile upsert error:', profileError);
        }
        // Directly insert into leads table as well
        // Split fullName into first_name and last_name (fallback to empty string if not present)
        const [firstName, ...lastNameParts] = formData.fullName
          .trim()
          .split(' ');
        const lastName =
          lastNameParts.length > 0 ? lastNameParts.join(' ') : '';
        const { error: leadsError } = await supabase.from('leads').insert({
          id,
          email,
          role: 'leads',
          first_name: firstName,
          last_name: lastName,
        });
        if (leadsError) {
          console.error('Leads insert error:', leadsError);
        }
        // Fetch latest profile and update userRole in context
        try {
          const { data: profile, error: profileFetchError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', id)
            .single();
          if (!profileFetchError && profile?.role) {
            // Dynamically import useUserRole to avoid hook call order issues
            const { useUserRole } = await import('@/contexts/UserContext');
            const { setUserRole } = useUserRole();
            setUserRole(profile.role);
          }
        } catch (e) {
          console.error('Failed to update userRole after sign up:', e);
        }
        Alert.alert(
          'Account Created! 🎉',
          'Welcome to BODIQO! Your account has been created successfully.',
          [
            {
              text: 'Get Started',
              onPress: () => {
                // Navigation will be handled by the auth state change in AuthContext
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0)
      return { strength: 0, text: '', color: colors.textTertiary };
    if (password.length < 6)
      return { strength: 1, text: 'Weak', color: colors.error };
    if (password.length < 8)
      return { strength: 2, text: 'Fair', color: colors.warning };
    if (
      password.length >= 8 &&
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    ) {
      return { strength: 3, text: 'Strong', color: colors.success };
    }
    return { strength: 2, text: 'Good', color: colors.info };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join BODIQU and start your fitness journey
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

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.fullName && styles.inputError,
                ]}
              >
                <User
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={formData.fullName}
                  onChangeText={(text) => updateFormData('fullName', text)}
                  placeholder="Full name"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                />
              </View>
              {errors.fullName && (
                <Text style={styles.fieldError}>{errors.fullName}</Text>
              )}
            </View>

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
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
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
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
                  placeholder="Create a password"
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

              {/* Password Strength Indicator */}
              {formData.password.length > 0 && (
                <View style={styles.passwordStrength}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${(passwordStrength.strength / 3) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.strengthText,
                      { color: passwordStrength.color },
                    ]}
                  >
                    {passwordStrength.text}
                  </Text>
                </View>
              )}

              {errors.password && (
                <Text style={styles.fieldError}>{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.confirmPassword && styles.inputError,
                ]}
              >
                <Lock
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={formData.confirmPassword}
                  onChangeText={(text) =>
                    updateFormData('confirmPassword', text)
                  }
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Password Match Indicator */}
              {formData.confirmPassword.length > 0 && (
                <View style={styles.passwordMatch}>
                  {formData.password === formData.confirmPassword ? (
                    <View style={styles.matchIndicator}>
                      <Check size={16} color={colors.success} />
                      <Text
                        style={[styles.matchText, { color: colors.success }]}
                      >
                        Passwords match
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.matchText, { color: colors.error }]}>
                      Passwords do not match
                    </Text>
                  )}
                </View>
              )}

              {errors.confirmPassword && (
                <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
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
                    <Text style={styles.buttonText}>Creating Account...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.signInLink}>Sign In</Text>
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
      paddingBottom: 40,
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
    passwordStrength: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },
    strengthBar: {
      flex: 1,
      height: 4,
      backgroundColor: colors.borderLight,
      borderRadius: 2,
    },
    strengthFill: {
      height: '100%',
      borderRadius: 2,
    },
    strengthText: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 12,
    },
    passwordMatch: {
      marginTop: 8,
    },
    matchIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    matchText: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 12,
    },
    signUpButton: {
      borderRadius: 12,
      marginTop: 12,
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
    signInContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signInText: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      color: colors.textSecondary,
    },
    signInLink: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 14,
      color: colors.primary,
    },
  });
