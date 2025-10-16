import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Alert,
  findNodeHandle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { BlurView } from 'expo-blur';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import LottieView from 'lottie-react-native';
import SandyLoading from '../../assets/SandLoading.json';
import { useUserRole } from '@/contexts/UserContext';

export default function SignUpScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = getColors(colorScheme);
  const { signUp } = useAuth();
  const { setUserRole } = useUserRole();
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

  // const fullNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

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
        role: 'leads',
      };

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
        const [firstName, ...lastNameParts] = formData.fullName
          .trim()
          .split(' ');
        const lastName =
          lastNameParts.length > 0 ? lastNameParts.join(' ') : '';
        const { error: leadsError } = await supabase.from('leads').upsert(
          {
            id,
            email,
            role: 'leads',
            first_name: firstName,
            last_name: lastName,
          },
          { onConflict: 'email' }
        );
        if (leadsError) {
          console.error('Leads insert error:', leadsError);
        }
        try {
          const { data: profile, error: profileFetchError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', id)
            .single();
          if (!profileFetchError && profile?.role) {
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
              onPress: async () => {
                const userId = data.user?.id;
                if (!userId) return;

                const { data: leadData, error } = await supabase
                  .from('leads')
                  .select('is_profile_complete')
                  .eq('id', userId)
                  .maybeSingle();

                if (!leadData?.is_profile_complete) {
                  router.replace('/profile-settings');
                } else {
                  router.replace('/(tabs)');
                }
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
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: `${colorScheme === 'dark' ? 'black' : 'white'}`,
      }}
    >
      <ImageBackground
        source={require('@/assets/images/login-bg.webp')}
        resizeMode="cover"
        className="absolute inset-0 w-full h-screen"
      />
      <BlurView
        intensity={1000}
        tint="dark"
        className="absolute inset-0 bg-white/20"
      />
      {loading && (
        <View className="absolute inset-0 flex justify-center items-center z-50">
          <View className="w-80 bg-gray-900/95 rounded-2xl flex justify-center items-center">
            <LottieView
              source={require('../../assets/SandLoading.json')}
              autoPlay
              loop
              style={{ width: 150, height: 150 }}
            />
            <Text className="-mt-4 text-lg font-semibold text-white pb-4">
              Getting you ready to move…
            </Text>
          </View>
        </View>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="px-5 pt-10 pb-10 mt-10">
          {/* <TouchableOpacity
              onPress={() => router.back()}
              className={`w-10 h-10 rounded-full justify-center items-center ${
                colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
              } mb-5`}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity> */}
          <Text className="font-inter-bold text-3xl text-white mb-2">
            Create Account
          </Text>
          <Text className="font-inter-regular text-base text-white/80">
            Join BODIQO and start your fitness journey
          </Text>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Form */}
          <View className="px-5 flex-1">
            {/* General Error */}
            {errors.general && (
              <View
                className={`bg-red-500/10 border border-red-500 rounded-full p-4 mb-6`}
              >
                <Text className="font-inter-medium text-red-500 text-center">
                  {errors.general}
                </Text>
              </View>
            )}

            {/* Name Input */}
            <View className="mb-8">
              <Text className="font-inter-semibold text-white mb-2">
                Full Name
              </Text>
              <View
                className={`flex-row items-center px-4 py-1 rounded-full border ${
                  errors.fullName ? 'border-red-500' : 'border-white/50'
                } ${colorScheme === 'dark' ? 'bg-gray-700/70' : 'bg-white/20'}`}
              >
                <User size={20} color={colors.textSecondary} />
                <TextInput
                  value={formData.fullName}
                  onChangeText={(text) => updateFormData('fullName', text)}
                  placeholder="Full name"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                  className="flex-1 font-inter-regular text-white text-base ml-1"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>
              {errors.fullName && (
                <Text className="font-inter-regular text-red-500 text-xs mt-1">
                  {errors.fullName}
                </Text>
              )}
            </View>

            {/* Email Input */}
            <View className="mb-8">
              <Text className="font-inter-semibold text-white mb-2">
                Email Address
              </Text>
              <View
                className={`flex-row items-center px-4 py-1 rounded-full border ${
                  errors.email ? 'border-red-500' : 'border-white/50'
                } ${colorScheme === 'dark' ? 'bg-gray-700/70' : 'bg-white/20'}`}
              >
                <Mail size={20} color={colors.textSecondary} />
                <TextInput
                  ref={emailRef}
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className=" flex-1 font-inter-regular text-white text-base ml-1"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              {errors.email && (
                <Text className="font-inter-regular text-red-500 text-xs mt-1">
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View className="mb-8">
              <Text className="font-inter-semibold text-white mb-2">
                Password
              </Text>
              <View
                className={`flex-row items-center px-4 py-1 rounded-full border ${
                  errors.password ? 'border-red-500' : 'border-white/50'
                } ${colorScheme === 'dark' ? 'bg-gray-700/70' : 'bg-white/20'}`}
              >
                <Lock size={20} color={colors.textSecondary} />
                <TextInput
                  ref={passwordRef}
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
                  placeholder="Create a password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 font-inter-regular text-white text-base ml-1"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              {formData.password.length > 0 && (
                <View className="flex-row items-center mt-2 gap-2">
                  <View className="flex-1 h-1 bg-gray-300/30 rounded">
                    <View
                      style={{
                        width: `${(passwordStrength.strength / 3) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      }}
                      className="h-full rounded"
                    />
                  </View>
                  <Text
                    style={{ color: passwordStrength.color }}
                    className="font-inter-semibold text-xs"
                  >
                    {passwordStrength.text}
                  </Text>
                </View>
              )}
              {errors.password && (
                <Text className="font-inter-regular text-red-500 text-xs mt-1">
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View className="mb-8">
              <Text className="font-inter-semibold text-white mb-2">
                Confirm Password
              </Text>
              <View
                className={`flex-row items-center px-4 py-1 rounded-full border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-white/50'
                } ${colorScheme === 'dark' ? 'bg-gray-700/70' : 'bg-white/20'}`}
              >
                <Lock size={20} color={colors.textSecondary} />
                <TextInput
                  ref={confirmPasswordRef}
                  value={formData.confirmPassword}
                  onChangeText={(text) =>
                    updateFormData('confirmPassword', text)
                  }
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  className="flex-1 font-inter-regular text-white text-base ml-1"
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              {formData.confirmPassword.length > 0 && (
                <View className="mt-2">
                  {formData.password === formData.confirmPassword ? (
                    <View className="flex-row items-center gap-1">
                      <Check size={16} color={colors.success} />
                      <Text className="font-inter-semibold text-xs text-green-500">
                        Passwords match
                      </Text>
                    </View>
                  ) : (
                    <Text className="font-inter-semibold text-xs text-red-500">
                      Passwords do not match
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              className="py-4 rounded-full items-center mb-4 bg-blue-600 shadow-lg"
            >
              <Text className="font-inter-bold text-white text-xl">
                CREATE ACCOUNT
              </Text>
            </TouchableOpacity>

            {/* Sign In Link */}
            <View className="flex-row justify-center mt-4">
              <Text className="font-inter-regular text-white/80">
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                <Text className="font-inter-semibold text-yellow-400">
                  Sign in
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
