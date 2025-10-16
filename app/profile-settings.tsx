import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Save, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import Loader from '@/components/Loader';
import RadioGroup from '@/components/RadioGroup';
import MultiSelect from '@/components/MultiSelect';

export default function ProfileSettingsScreen() {
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('Loading your profile...');

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'Male',
    height: '',
    weight: '',
    dietary_preferences: [] as string[],
    fitness_goals: [] as string[],
    training_types: [] as string[],
  });

  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const weightRef = useRef<TextInput>(null);

  // Calculate BMI
  const calculateBMI = () => {
    const h = Number(profileData.height) / 100;
    const w = Number(profileData.weight);
    if (h > 0 && w > 0) return (w / (h * h)).toFixed(1);
    return '';
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return;

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', user.user.id)
      .maybeSingle();

    if (error) console.error(error);
    if (data) {
      setProfileData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        age: data.age?.toString() || '',
        gender: data.gender || 'Male',
        height: data.height?.toString() || '',
        weight: data.weight?.toString() || '',
        dietary_preferences: data.dietary_preferences || [],
        fitness_goals: data.fitness_goals || [],
        training_types: data.training_types || [],
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Save profile
  const handleSave = async () => {
    const errors: string[] = [];
    if (!profileData.first_name) errors.push('First Name');
    if (!profileData.last_name) errors.push('Last Name');
    if (!profileData.phone) errors.push('Phone Number');
    if (!/^\d{10}$/.test(profileData.phone))
      errors.push('Phone Number must be 10 digits');
    if (!profileData.age) errors.push('Age');

    if (errors.length) {
      Alert.alert('Please fix:', errors.join(', '));
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return;

    setLoading(true);
    const bmi = calculateBMI();

    const { error } = await supabase.from('leads').upsert({
      id: user.user.id,
      ...profileData,
      bmi: Number(bmi),
      age: Number(profileData.age),
      height: Number(profileData.height),
      weight: Number(profileData.weight),
      is_profile_complete: true,
    });

    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.push("/(tabs)") },
      ]);
    }
  };

  if (loading) return <Loader label={loadingLabel} />;

  const Label = ({ text }: { text: string }) => (
    <Text className="text-textSecondary font-inter-semibold mb-1">
      {text} <Text className="text-red-500">*</Text>
    </Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-appBackground">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-cardBorder">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={22} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text className="text-textPrimary text-lg font-inter-semibold">
          Edit Profile
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Save color="#2F6BFF" size={22} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 px-5 py-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo */}
          <View className="items-center mb-6">
            <View className="relative">
              <View className="w-24 h-24 rounded-full bg-accent justify-center items-center">
                <Text className="text-white text-4xl font-inter-bold">
                  {profileData.first_name?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert('Change photo')}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cardBackground border border-cardBorder justify-center items-center"
              >
                <Camera color="#A2ACBA" size={16} strokeWidth={1.6} />
              </TouchableOpacity>
            </View>
            <Text className="text-textTertiary mt-2 text-sm">
              Tap to change photo
            </Text>
          </View>

          {/* Fields */}
          <View className="bg-cardBackground border border-cardBorder rounded-2xl p-4 mb-6 space-y-4">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Label text="First Name" />
                <TextInput
                  className="bg-appBackground border border-cardBorder rounded-xl px-3 py-2 text-textPrimary"
                  placeholder="First name"
                  placeholderTextColor="#7B8493"
                  value={profileData.first_name}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, first_name: text })
                  }
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                />
              </View>
              <View className="flex-1">
                <Label text="Last Name" />
                <TextInput
                  ref={lastNameRef}
                  className="bg-appBackground border border-cardBorder rounded-xl px-3 py-2 text-textPrimary"
                  placeholder="Last name"
                  placeholderTextColor="#7B8493"
                  value={profileData.last_name}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, last_name: text })
                  }
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                />
              </View>
            </View>

            <View>
              <Label text="Email" />
              <TextInput
                className="bg-appBackground border border-cardBorder rounded-xl px-3 py-2 text-textSecondary"
                editable={false}
                value={profileData.email}
              />
            </View>

            <View>
              <Label text="Phone" />
              <TextInput
                ref={phoneRef}
                keyboardType="phone-pad"
                className="bg-appBackground border border-cardBorder rounded-xl px-3 py-2 text-textPrimary"
                placeholder="Phone number"
                placeholderTextColor="#7B8493"
                value={profileData.phone}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, phone: text })
                }
                onSubmitEditing={() => ageRef.current?.focus()}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Label text="Age" />
                <TextInput
                  ref={ageRef}
                  keyboardType="numeric"
                  className="bg-appBackground border border-cardBorder rounded-xl px-3 py-2 text-textPrimary"
                  placeholder="Age"
                  placeholderTextColor="#7B8493"
                  value={profileData.age}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, age: text })
                  }
                  onSubmitEditing={() => heightRef.current?.focus()}
                />
              </View>
              <View className="flex-1">
                <Label text="Gender" />
                <RadioGroup
                  options={['Male', 'Female', 'Other']}
                  selected={profileData.gender}
                  onSelect={(v) =>
                    setProfileData({ ...profileData, gender: v })
                  }
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Label text="Height (cm)" />
                <TextInput
                  ref={heightRef}
                  keyboardType="numeric"
                  className="bg-appBackground border border-cardBorder rounded-xl px-3 py-2 text-textPrimary"
                  placeholder="Height"
                  placeholderTextColor="#7B8493"
                  value={profileData.height}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, height: text })
                  }
                  onSubmitEditing={() => weightRef.current?.focus()}
                />
              </View>
              <View className="flex-1">
                <Label text="Weight (kg)" />
                <TextInput
                  ref={weightRef}
                  keyboardType="numeric"
                  className="bg-appBackground border border-cardBorder rounded-xl px-3 py-2 text-textPrimary"
                  placeholder="Weight"
                  placeholderTextColor="#7B8493"
                  value={profileData.weight}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, weight: text })
                  }
                />
              </View>
            </View>
          </View>

          {/* Preferences */}
          <View className="bg-cardBackground border border-cardBorder rounded-2xl p-4 mb-6 space-y-4">
            <Text className="text-textPrimary text-sm font-inter-semibold">
              Fitness Goals
            </Text>
            <MultiSelect
              options={[
                'Fat Loss',
                'Muscle Gain',
                'Endurance',
                'Flexibility',
                'No Preference',
              ]}
              selected={profileData.fitness_goals}
              onChange={(v) =>
                setProfileData({ ...profileData, fitness_goals: v })
              }
            />

            <Text className="text-textPrimary text-sm font-inter-semibold">
              Dietary Preferences
            </Text>
            <MultiSelect
              options={['Vegan', 'Vegetarian', 'Keto', 'Balanced']}
              selected={profileData.dietary_preferences}
              onChange={(v) =>
                setProfileData({ ...profileData, dietary_preferences: v })
              }
            />

            <Text className="text-textPrimary text-sm font-inter-semibold">
              Training Types
            </Text>
            <MultiSelect
              options={['Strength', 'Cardio', 'Yoga', 'Pilates']}
              selected={profileData.training_types}
              onChange={(v) =>
                setProfileData({ ...profileData, training_types: v })
              }
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            className="bg-accent py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-inter-semibold text-lg">
              Save Changes
            </Text>
          </TouchableOpacity>

          <View className="h-24" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
