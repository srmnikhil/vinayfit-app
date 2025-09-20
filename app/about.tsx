import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Shield, Users, Globe } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const features = [
    {
      icon: Heart,
      title: 'Health First',
      description: 'Your health and wellness are our top priority',
    },
    {
      icon: Shield,
      title: 'Privacy Protected',
      description: 'Your data is secure and never shared without permission',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Built with feedback from fitness enthusiasts like you',
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Helping people achieve fitness goals worldwide',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>VF</Text>
          </View>
          <Text style={styles.appName}>VinayFit</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        {/* Mission Statement */}
        <View style={styles.missionContainer}>
          <Text style={styles.missionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            VinayFit is dedicated to making fitness accessible, enjoyable, and effective for everyone. 
            We believe that with the right tools, guidance, and community support, anyone can achieve 
            their health and fitness goals.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What We Stand For</Text>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <IconComponent size={24} color={colors.primary} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Contact Information */}
        <View style={styles.contactContainer}>
          <Text style={styles.contactTitle}>Get in Touch</Text>
          <TouchableOpacity style={styles.contactItem}>
            <Text style={styles.contactLabel}>Email:</Text>
            <Text style={styles.contactValue}>support@vinayfit.com</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem}>
            <Text style={styles.contactLabel}>Website:</Text>
            <Text style={styles.contactValue}>www.vinayfit.com</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Links */}
        <View style={styles.legalContainer}>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalText}>Open Source Licenses</Text>
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>
            © 2025 VinayFit. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Made with ❤️ for fitness enthusiasts
          </Text>
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
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#FFFFFF',
  },
  appName: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 8,
  },
  version: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  missionContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  missionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 16,
  },
  missionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  featuresTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  contactContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  contactTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
    width: 80,
  },
  contactValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.primary,
    flex: 1,
  },
  legalContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  legalLink: {
    paddingVertical: 12,
  },
  legalText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.primary,
  },
  copyrightContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  copyrightText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 8,
  },
  copyrightSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});