import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleChangePassword = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwords.new.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    // Simulate password change
    Alert.alert(
      'Success',
      'Password changed successfully!',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const renderPasswordField = (
    label: string,
    field: keyof typeof passwords,
    placeholder: string
  ) => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={passwords[field]}
          onChangeText={(text) => setPasswords(prev => ({ ...prev, [field]: text }))}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!showPasswords[field]}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => togglePasswordVisibility(field)}
        >
          {showPasswords[field] ? (
            <EyeOff size={20} color={colors.textTertiary} />
          ) : (
            <Eye size={20} color={colors.textTertiary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {renderPasswordField('Current Password', 'current', 'Enter current password')}
          {renderPasswordField('New Password', 'new', 'Enter new password')}
          {renderPasswordField('Confirm New Password', 'confirm', 'Confirm new password')}

          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <Text style={styles.requirementItem}>• At least 8 characters long</Text>
            <Text style={styles.requirementItem}>• Contains uppercase and lowercase letters</Text>
            <Text style={styles.requirementItem}>• Contains at least one number</Text>
            <Text style={styles.requirementItem}>• Contains at least one special character</Text>
          </View>

          <TouchableOpacity style={styles.changeButton} onPress={handleChangePassword}>
            <Text style={styles.changeButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  formField: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  requirements: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  requirementsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  requirementItem: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  changeButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  changeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});