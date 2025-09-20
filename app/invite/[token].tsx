import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { useLocalSearchParams, router } from 'expo-router';
import { UserRole, useUserRole } from '../../contexts/UserContext';
import { User, Dumbbell, Apple, Shield, Users, CircleCheck as CheckCircle, Clock } from 'lucide-react-native';

const roleIcons = {
  client: User,
  trainer: Dumbbell,
  nutritionist: Apple,
  admin: Shield,
  hr: Users,
};

const roleColors = {
  client: ['#667EEA', '#764BA2'],
  trainer: ['#F093FB', '#F5576C'],
  nutritionist: ['#4FACFE', '#00F2FE'],
  admin: ['#FA709A', '#FEE140'],
  hr: ['#A8EDEA', '#FED6E3'],
};

const roleColorsDark = {
  client: ['#1E40AF', '#3730A3'],
  trainer: ['#BE185D', '#BE123C'],
  nutritionist: ['#0284C7', '#0891B2'],
  admin: ['#DC2626', '#F59E0B'],
  hr: ['#059669', '#EC4899'],
};

export default function InviteAcceptScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { token } = useLocalSearchParams();
  const { setUserRole, setUserName } = useUserRole();

  const [inviteData, setInviteData] = useState<{
    role: UserRole;
    trial: number;
    email?: string;
    isValid: boolean;
    isExpired: boolean;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    // Simulate API call to validate invite token
    const validateInvite = async () => {
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock validation - in real app, decode token and check database
        const mockInviteData = {
          role: 'trainer' as UserRole,
          trial: 14,
          email: 'john.doe@example.com',
          isValid: true,
          isExpired: false,
        };
        
        setInviteData(mockInviteData);
      } catch (error) {
        setInviteData({
          role: 'client' as UserRole,
          trial: 0,
          isValid: false,
          isExpired: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      validateInvite();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const handleAcceptInvite = async () => {
    if (!inviteData?.isValid) return;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'Please enter your first and last name');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsAccepting(true);

    try {
      // In a real app, this would create the user account
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fullName = `${formData.firstName} ${formData.lastName}`;
      setUserRole(inviteData.role);
      setUserName(fullName);
      
      Alert.alert(
        'Welcome to VinayFit!',
        `Your account has been created successfully. You have ${inviteData.trial} days of trial access.`,
        [
          {
            text: 'Get Started',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Validating invitation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!inviteData?.isValid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Invalid Invitation</Text>
          <Text style={styles.errorText}>
            This invitation link is invalid or has already been used.
          </Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.errorButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (inviteData.isExpired) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Invitation Expired</Text>
          <Text style={styles.errorText}>
            This invitation has expired. Please contact your administrator for a new invitation.
          </Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.errorButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const IconComponent = roleIcons[inviteData.role];
  const gradientColors = colorScheme === 'dark' 
    ? roleColorsDark[inviteData.role] 
    : roleColors[inviteData.role];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <LinearGradient
          colors={gradientColors}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.roleIcon}>
              <IconComponent size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.welcomeText}>You're Invited!</Text>
            <Text style={styles.roleText}>
              Join VinayFit as a {inviteData.role.charAt(0).toUpperCase() + inviteData.role.slice(1)}
            </Text>
            
            {inviteData.trial > 0 && (
              <View style={styles.trialBadge}>
                <Clock size={16} color="#FFFFFF" />
                <Text style={styles.trialText}>
                  {inviteData.trial} days trial included
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Complete Your Registration</Text>
          
          {inviteData.email && (
            <View style={styles.emailContainer}>
              <Text style={styles.emailLabel}>Email</Text>
              <Text style={styles.emailText}>{inviteData.email}</Text>
            </View>
          )}

          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <Text style={styles.fieldLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                placeholder="John"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            
            <View style={styles.nameField}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                placeholder="Doe"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              placeholder="Enter password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
              placeholder="Confirm password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.acceptButton, isAccepting && styles.acceptButtonDisabled]}
            onPress={handleAcceptInvite}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <Text style={styles.acceptButtonText}>Creating Account...</Text>
            ) : (
              <>
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.acceptButtonText}>Accept Invitation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  errorButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  roleIcon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  roleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  trialText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 24,
  },
  emailContainer: {
    marginBottom: 24,
  },
  emailLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  emailText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  nameField: {
    flex: 1,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 20,
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});