import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import RadioGroup from '@/components/RadioGroup';
import MultiSelect from '@/components/MultiSelect';
import Loader from '@/components/Loader';

export default function ProfileSettingsScreen() {
  const colorScheme = useColorScheme();

  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState(
    'Loading your profile details...'
  );

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'Male',
    height: '',
    weight: '',
    bmi: '',
    fitness_goals: [] as string[],
    dietary_preferences: [] as string[],
    pre_existing_conditions: [] as string[],
    medical_conditions: '',
    physique_type: '',
    health_info: '',
    recommendations: '',
    training_types: [] as string[],
    time_slots: [] as string[],
  });

  // --- Refs for next field navigation ---
  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const weightRef = useRef<TextInput>(null);
  const preExistingRef = useRef<TextInput>(null);
  const physiqueRef = useRef<TextInput>(null);
  const medicalRef = useRef<TextInput>(null);
  const healthInfoRef = useRef<TextInput>(null);
  const recommendationsRef = useRef<TextInput>(null);

  // --- Calculate BMI ---
  const calculateBMI = () => {
    const heightM = Number(profileData.height) / 100;
    const weightKg = Number(profileData.weight);
    if (heightM > 0 && weightKg > 0) {
      return (weightKg / (heightM * heightM)).toFixed(1);
    }
    return '';
  };

  // --- Get user id ---
  const getUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user?.id ?? null;
  };

  // --- Fetch profile ---
  const fetchUserProfile = async () => {
    const userId = await getUserId();
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      setProfileData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        age: data.age?.toString() || '',
        gender: data.gender || 'Male',
        height: data.height?.toString() || '',
        weight: data.weight?.toString() || '',
        bmi: data.bmi?.toString() || '',
        fitness_goals: data.fitness_goals || [],
        dietary_preferences: data.dietary_preferences || [],
        pre_existing_conditions: data.pre_existing_conditions || [],
        medical_conditions: data.medical_conditions || '',
        physique_type: data.physique_type || '',
        health_info: data.health_info || '',
        recommendations: data.recommendations || '',
        training_types: data.training_types || [],
        time_slots: data.time_slots || [],
      });
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching profile:', err.message);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    setLoadingLabel('Loading your profile details...');
    setLoading(true);
  }, []);

  // --- Save profile ---
  const handleSave = async () => {
    // Validation
    const errors: string[] = [];

    if (!profileData.first_name.trim()) errors.push('First Name');
    if (!profileData.last_name.trim()) errors.push('Last Name');
    if (!profileData.phone.trim()) errors.push('Phone Number');
    if (!/^\d{10}$/.test(profileData.phone))
      errors.push('Phone Number must be 10 digits');
    if (!profileData.age.trim()) errors.push('Age');
    if (!/^\d{1,2}$/.test(profileData.age))
      errors.push('Age must be 1-2 digits');
    if (!profileData.gender.trim()) errors.push('Gender');
    if (!profileData.dietary_preferences.length)
      errors.push('Dietary Preferences');
    if (!profileData.training_types.length) errors.push('Training Types');

    if (errors.length) {
      Alert.alert(
        'Validation Error',
        `Please check the following fields:\n- ${errors.join('\n- ')}`
      );
      return;
    }
    setLoadingLabel('Updating your details...');
    setLoading(true);
    const bmi = calculateBMI();
    setProfileData((prev) => ({ ...prev, bmi }));

    const userId = await getUserId();
    if (!userId) return;

    try {
      const { error } = await supabase.from('leads').upsert({
        id: userId,
        ...profileData,
        bmi: Number(bmi),
        age: Number(profileData.age),
        height: Number(profileData.height),
        weight: Number(profileData.weight),
        is_profile_complete: true,
      });

      if (error) throw error;
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setLoading(false);
              router.push('/(tabs)');
            },
          },
        ],
        { cancelable: false } // user cannot dismiss by tapping outside
      );
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update profile: ' + err.message);
    }
  };

  // --- Change photo ---
  const handleChangePhoto = () => {
    Alert.alert('Change Profile Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: () => console.log('Take photo') },
      {
        text: 'Choose from Gallery',
        onPress: () => console.log('Choose from gallery'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // --- Required field label ---
  const Label = ({ children }: { children: string }) => (
    <Text className="text-gray-700 dark:text-gray-200 font-semibold">
      {children}
      <Text className="text-red-500"> *</Text>
    </Text>
  );

  if (loading) {
    return <Loader label={loadingLabel} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft
            size={24}
            color={colorScheme === 'dark' ? '#fff' : '#000'}
          />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          Complete Profile
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text className="text-blue-600 font-semibold">Save</Text>
        </TouchableOpacity>
      </View>

      {/* Keyboard aware content */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 px-5 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo */}
          <View className="items-center mb-6">
            <View className="relative">
              <View className="w-24 h-24 rounded-full bg-blue-500 justify-center items-center">
                <Text className="text-white text-4xl font-bold">
                  {profileData.first_name?.[0]?.toUpperCase()}
                  {profileData.last_name?.[0]?.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gray-600 justify-center items-center border-2 border-white"
                onPress={handleChangePhoto}
              >
                <Camera size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-500 mt-2 text-sm">
              Tap to change photo
            </Text>
          </View>

          {/* Form Fields */}
          <View className="space-y-4">
            {/* First & Last Name in one row */}
            <View className="flex-row">
              <View className="flex-1 mr-4 mb-4">
                <Label>First Name</Label>
                <TextInput
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                  placeholder="First Name"
                  value={profileData.first_name}
                  onChangeText={(text) =>
                    setProfileData((prev) => ({ ...prev, first_name: text }))
                  }
                />
              </View>
              <View className="flex-1 mb-4">
                <Label>Last Name</Label>
                <TextInput
                  ref={lastNameRef}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Last Name"
                  value={profileData.last_name}
                  onChangeText={(text) =>
                    setProfileData((prev) => ({ ...prev, last_name: text }))
                  }
                />
              </View>
            </View>

            {/* Email */}
            <View className="mb-4">
              <Label>Email</Label>
              <TextInput
                className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-500"
                value={profileData.email}
                editable={false}
              />
            </View>

            {/* Phone Number */}
            <View className="mb-4">
              <Label>Phone Number</Label>
              <TextInput
                ref={phoneRef}
                returnKeyType="next"
                onSubmitEditing={() => ageRef.current?.focus()}
                keyboardType="phone-pad"
                className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                placeholder="Phone"
                value={profileData.phone}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, phone: text }))
                }
              />
            </View>

            {/* Age */}
            <View className="mb-4">
              <Label>Age</Label>
              <TextInput
                ref={ageRef}
                returnKeyType="next"
                onSubmitEditing={() => heightRef.current?.focus()}
                keyboardType="number-pad"
                className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                placeholder="Age"
                value={profileData.age}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, age: text }))
                }
              />
            </View>

            {/* Height & Weight (optional) */}
            <View className="flex-row space-x-4">
              <View className="flex-1 mr-4">
                <Text className="text-gray-700 dark:text-gray-200 font-semibold">
                  Height (cm)
                </Text>
                <TextInput
                  ref={heightRef}
                  returnKeyType="next"
                  onSubmitEditing={() => weightRef.current?.focus()}
                  keyboardType="number-pad"
                  className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Height"
                  value={profileData.height}
                  onChangeText={(text) =>
                    setProfileData((prev) => ({ ...prev, height: text }))
                  }
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 dark:text-gray-200 font-semibold">
                  Weight (kg)
                </Text>
                <TextInput
                  ref={weightRef}
                  returnKeyType="done"
                  keyboardType="number-pad"
                  className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Weight"
                  value={profileData.weight}
                  onChangeText={(text) =>
                    setProfileData((prev) => ({ ...prev, weight: text }))
                  }
                />
              </View>
            </View>
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              BMI will be calculated automatically
            </Text>

            {/* Gender */}
            <Label>Gender</Label>
            <RadioGroup
              options={['Male', 'Female', 'Other']}
              selected={profileData.gender}
              onSelect={(value) =>
                setProfileData((prev) => ({ ...prev, gender: value }))
              }
            />

            {/* Fitness Goals */}
            <Label>Fitness Goals</Label>
            <MultiSelect
              options={[
                'Fat Loss',
                'Gain Muscle',
                'Fat Loss with Musle Gaining',
                'None',
                'No Preference',
              ]}
              selected={profileData.fitness_goals}
              onChange={(values) =>
                setProfileData((prev) => ({
                  ...prev,
                  fitness_goals: values,
                }))
              }
            />

            {/* Dietary Preferences */}
            <Label>Dietary Preferences</Label>
            <MultiSelect
              options={[
                'Vegetarian',
                'Vegan',
                'Keto',
                'Paleo',
                'No Preference',
              ]}
              selected={profileData.dietary_preferences}
              onChange={(values) =>
                setProfileData((prev) => ({
                  ...prev,
                  dietary_preferences: values,
                }))
              }
            />

            {/* Training Types */}
            <Label>Training Types</Label>
            <MultiSelect
              options={['Strength', 'Cardio', 'Yoga', 'Pilates']}
              selected={profileData.training_types}
              onChange={(values) =>
                setProfileData((prev) => ({ ...prev, training_types: values }))
              }
            />

            {/* Optional Fields */}
            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-200 font-semibold">
                Pre-existing Conditions
              </Text>
              <TextInput
                ref={preExistingRef}
                returnKeyType="next"
                onSubmitEditing={() => physiqueRef.current?.focus()}
                className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                placeholder="Pre-existing Conditions"
                value={profileData.pre_existing_conditions.join(', ')}
                onChangeText={(text) =>
                  setProfileData((prev) => ({
                    ...prev,
                    pre_existing_conditions: text
                      .split(',')
                      .map((s) => s.trim()),
                  }))
                }
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-200 font-semibold">
                Physique Type
              </Text>
              <TextInput
                ref={physiqueRef}
                returnKeyType="next"
                onSubmitEditing={() => medicalRef.current?.focus()}
                className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                placeholder="Physique Type"
                value={profileData.physique_type}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, physique_type: text }))
                }
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-200 font-semibold">
                Medical Conditions
              </Text>
              <TextInput
                ref={medicalRef}
                returnKeyType="next"
                onSubmitEditing={() => healthInfoRef.current?.focus()}
                className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                placeholder="Medical Conditions"
                value={profileData.medical_conditions}
                onChangeText={(text) =>
                  setProfileData((prev) => ({
                    ...prev,
                    medical_conditions: text,
                  }))
                }
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-200 font-semibold">
                Health Info
              </Text>
              <TextInput
                ref={healthInfoRef}
                returnKeyType="next"
                onSubmitEditing={() => recommendationsRef.current?.focus()}
                className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                placeholder="Health Info"
                value={profileData.health_info}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, health_info: text }))
                }
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-200 font-semibold">
                Recommendations
              </Text>
              <TextInput
                ref={recommendationsRef}
                returnKeyType="done"
                onSubmitEditing={handleSave}
                className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                placeholder="Recommendations"
                value={profileData.recommendations}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, recommendations: text }))
                }
              />
            </View>
          </View>

          <View className="h-24" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
