import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Users, User, Mail, Phone } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { useTodayDataNew } from '@/hooks/useTodayDataNew';
import { router } from 'expo-router';

export default function TeamScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { data, loading, error, refreshData } = useTodayDataNew();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your team...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error loading team data</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const trainer = data?.clientAssignment?.trainer;
  const nutritionist = data?.clientAssignment?.nutritionist;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Team</Text>
        </View>

        {trainer ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <User size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Your Trainer</Text>
            </View>
            <Text style={styles.memberName}>{trainer.full_name}</Text>
            {trainer.email && (
              <View style={styles.contactRow}>
                <Mail size={16} color={colors.textSecondary} />
                <Text style={styles.contactText}>{trainer.email}</Text>
              </View>
            )}
            {/* Add phone number if available in profile data */}
            {/* {trainer.phone && (
              <View style={styles.contactRow}>
                <Phone size={16} color={colors.textSecondary} />
                <Text style={styles.contactText}>{trainer.phone}</Text>
              </View>
            )} */}
          </View>
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>No trainer assigned yet.</Text>
          </View>
        )}

        {nutritionist ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <User size={24} color={colors.secondary} />
              <Text style={styles.cardTitle}>Your Nutritionist</Text>
            </View>
            <Text style={styles.memberName}>{nutritionist.full_name}</Text>
            {nutritionist.email && (
              <View style={styles.contactRow}>
                <Mail size={16} color={colors.textSecondary} />
                <Text style={styles.contactText}>{nutritionist.email}</Text>
              </View>
            )}
            {/* Add phone number if available in profile data */}
            {/* {nutritionist.phone && (
              <View style={styles.contactRow}>
                <Phone size={16} color={colors.textSecondary} />
                <Text style={styles.contactText}>{nutritionist.phone}</Text>
              </View>
            )} */}
          </View>
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>No nutritionist assigned yet.</Text>
          </View>
        )}

        {!trainer && !nutritionist && (
          <View style={styles.noTeamCard}>
            <Users size={48} color={colors.textSecondary} style={styles.noTeamIcon} />
            <Text style={styles.noTeamText}>It looks like you don't have any team members assigned yet.</Text>
            <Text style={styles.noTeamSubText}>Please contact your administrator or trainer to get started.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginLeft: 10,
  },
  memberName: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: colors.text,
    marginBottom: 15,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 10,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noTeamCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noTeamIcon: {
    marginBottom: 20,
  },
  noTeamText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  noTeamSubText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
    color: colors.text,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
