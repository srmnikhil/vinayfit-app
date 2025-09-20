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
import { ArrowLeft, Send, CircleHelp as HelpCircle, MessageSquare, Mail } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

export default function SupportScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [message, setMessage] = useState('');

  const categories = [
    { id: 'technical', label: 'Technical Issue', icon: '🔧' },
    { id: 'account', label: 'Account Problem', icon: '👤' },
    { id: 'billing', label: 'Billing Question', icon: '💳' },
    { id: 'feature', label: 'Feature Request', icon: '💡' },
    { id: 'other', label: 'Other', icon: '❓' },
  ];

  const handleSubmit = () => {
    if (!selectedCategory || !message.trim()) {
      Alert.alert('Error', 'Please select a category and enter your message');
      return;
    }

    Alert.alert(
      'Message Sent',
      'Thank you for contacting us! We\'ll get back to you within 24 hours.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Ask us a question</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Help */}
        <View style={styles.quickHelp}>
          <View style={styles.quickHelpHeader}>
            <HelpCircle size={24} color={colors.primary} />
            <Text style={styles.quickHelpTitle}>Quick Help</Text>
          </View>
          <Text style={styles.quickHelpText}>
            Check our FAQ section or browse common topics before sending a message.
          </Text>
          <TouchableOpacity style={styles.faqButton}>
            <Text style={styles.faqButtonText}>View FAQ</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Send us a message</Text>

          {/* Category Selection */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.selectedCategory,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      selectedCategory === category.id && styles.selectedCategoryLabel,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Message */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Your Message</Text>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your question or issue in detail..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Send size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Other ways to reach us</Text>
          
          <TouchableOpacity style={styles.contactMethod}>
            <Mail size={20} color={colors.primary} />
            <Text style={styles.contactText}>support@vinayfit.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactMethod}>
            <MessageSquare size={20} color={colors.primary} />
            <Text style={styles.contactText}>Live Chat (9 AM - 6 PM)</Text>
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
  quickHelp: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickHelpTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginLeft: 12,
  },
  quickHelpText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  faqButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  faqButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 24,
  },
  formField: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  selectedCategory: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  selectedCategoryLabel: {
    color: '#FFFFFF',
  },
  messageInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    minHeight: 120,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  contactInfo: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  contactTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  contactText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
});