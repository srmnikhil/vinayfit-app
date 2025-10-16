import React, { useState, useRef } from 'react';
import {
  View,
  Text,
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
import { ArrowLeft, Mail, Loader, CheckCircle } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import SandyLoading from '../../assets/SandLoading.json';

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const emailRef = useRef<TextInput>(null);

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await resetPassword(email.trim());
      if (error) {
        setError(
          error.message || 'An error occurred while sending reset email'
        );
        return;
      }
      setSent(true);
    } catch (e) {
      setError('Unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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

        <View className="flex-1 justify-center items-center px-5">
          <CheckCircle size={64} color={colors.success} className="mb-6" />
          <Text className="text-3xl font-inter-bold text-white mb-2 text-center">
            Check Your Email
          </Text>
          <Text className="text-white/80 text-base mb-4 text-center">
            We've sent a password reset link to{' '}
            <Text className="text-yellow-400 font-inter-semibold">{email}</Text>
          </Text>
          <Text className="text-white/60 text-sm mb-6 text-center">
            Click the link in the email to reset your password. If you don't see
            it, check your spam folder.
          </Text>

          <TouchableOpacity
            onPress={() => setSent(false)}
            className="py-3 px-6 mb-4 rounded-full border-2 border-white/50 bg-white/10 shadow-lg backdrop-blur-md"
          >
            <Text className="text-white font-inter-semibold text-base text-center">
              Send Another Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-in')}
            className="w-full rounded-full shadow-lg overflow-hidden"
          >
            <View className="bg-gradient-to-r from-blue-500 to-purple-600 py-4 rounded-full items-center">
              <Text className="text-white font-inter-bold text-xl">
                Back to Sign In
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
              source={SandyLoading}
              autoPlay
              loop
              style={{ width: 150, height: 150 }}
            />
            <Text className="-mt-4 text-lg font-semibold text-white pb-4">
              Preparing your reset link…
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
          className="mt-40 px-5"
        >
          {/* Header */}
          <View className="mb-10">
            <Text className="font-inter-bold text-3xl text-white mb-2">
              Forgot Password?
            </Text>
            <Text className="font-inter-regular text-base text-white/80">
              No worries! Enter your email and we'll send you a reset link.
            </Text>
          </View>

          {/* Form */}
          <View className="flex-1">
            {error && (
              <View className="bg-red-500/10 border border-red-500 rounded-full p-4 mb-6">
                <Text className="text-red-500 text-center font-inter-medium">
                  {error}
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
                  error ? 'border-red-500' : 'border-white/50'
                } ${colorScheme === 'dark' ? 'bg-gray-700/70' : 'bg-white/20'}`}
              >
                <Mail size={20} color={colors.textSecondary} />
                <TextInput
                  ref={emailRef}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 font-inter-regular text-white text-base ml-1"
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
              </View>
            </View>

            {/* Send Reset Link Button */}
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
              className="py-4 rounded-full items-center mb-4 bg-blue-600"
            >
              {loading ? (
                <View className="flex-row items-center gap-2">
                  <Loader size={20} color="#fff" />
                  <Text className="text-white font-inter-bold text-xl">
                    Sending...
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-inter-bold text-xl">
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Sign In */}

            <View className="flex-row justify-center mt-2">
              <Text className="font-inter-regular text-white/80">
                Remember your password?{' '}
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
