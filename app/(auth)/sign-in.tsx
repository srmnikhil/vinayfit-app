import React, { useState, useEffect, useRef } from 'react';
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
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const { signIn, user } = useAuth();
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
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (userRole) {
      const checkProfileStatus = async () => {
        const userId = user?.id;
        if (!userId) return;

        const { data, error } = await supabase
          .from('leads')
          .select('is_profile_complete')
          .eq('id', userId)
          .maybeSingle();

        if (error || !data) return;

        if (!data.is_profile_complete) {
          router.replace('/profile-settings');
        } else {
          router.replace('/(tabs)');
        }
      };
      checkProfileStatus();
    }
  }, [userRole]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = 'Please enter a valid email address';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

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

      if (data.user) console.log('Sign in successful');
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithGoogle = () => {
    Alert.alert('Available soon', 'Google Sign In is not available yet');
  };

  return (
    <SafeAreaView
      className={`flex-1 bg-${colorScheme === 'dark' ? 'black' : 'white'}`}
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
              Preparing your fitness journey…
            </Text>
          </View>
        </View>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          style={{ marginTop: 40 }}
        >
          {/* Header */}
          <View className="px-5 pt-10 pb-10">
            {/* <TouchableOpacity
              onPress={() => router.back()}
              className={`w-10 h-10 rounded-full justify-center items-center ${
                colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
              } mb-5`}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity> */}

            <Text className="font-inter-bold text-3xl text-white mb-2">
              Welcome Back
            </Text>
            <Text className="font-inter-regular text-base text-white/80">
              Sign in to continue your fitness journey
            </Text>
          </View>

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
                  className="flex-1 font-inter-regular text-white text-base ml-1"
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
                className={`flex-row items-center px-4 py-1 rounded-full border mb-2 ${
                  errors.password ? 'border-red-500' : 'border-white/50'
                } ${colorScheme === 'dark' ? 'bg-gray-700/70' : 'bg-white/20'}`}
              >
                <Lock size={20} color={colors.textSecondary} />
                <TextInput
                  ref={passwordRef}
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
                  className="flex-1 font-inter-regular text-white text-base ml-1"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
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
              {errors.password && (
                <Text className="font-inter-regular text-red-500 text-xs mt-1">
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleSignIn}
              disabled={loading}
              className={`py-4 rounded-full items-center mb-4 bg-blue-600`}
            >
              <Text className="font-inter-bold text-white text-xl">
                SIGN IN
              </Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            <View className='items-center'>
              <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              className="self-auto px-1"
            >
              <Text className="font-inter-semibold text-white/80 text-sm mb-2">
                Forgot your password?
              </Text>
            </TouchableOpacity>
            </View>

            <View className="flex-row items-center my-6">
              <View className="flex-1 border-t border-white/30" />
              <Text className="text-white/50 mx-4 font-inter-medium">OR</Text>
              <View className="flex-1 border-t border-white/30" />
            </View>

            {/* Sign In With Google Button */}
            <TouchableOpacity
              onPress={handleSignInWithGoogle}
              disabled={loading}
              activeOpacity={0.8}
              className="py-4 rounded-full items-center mt-4 border-2 border-white/50 bg-white/10 shadow-lg backdrop-blur-xs backdrop-blur-md"
            >
              <View className="flex-row items-center">
                <Image
                  source={require('@/assets/icons/googleIcon.png')}
                  className="w-8 h-8"
                  resizeMode="contain"
                />
                <Text className="font-inter-bold text-white text-xl ml-4">
                  SIGN IN WITH GOOGLE
                </Text>
              </View>
            </TouchableOpacity>

            {/* Sign Up */}
            <View className="flex-row justify-center mt-4">
              <Text className="font-inter-regular text-white/80">
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                <Text className="font-inter-semibold text-yellow-400">
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject, // cover entire screen
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});
