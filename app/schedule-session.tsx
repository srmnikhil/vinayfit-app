import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, Plus } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';

export default function ScheduleSessionScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { clientId } = useLocalSearchParams();

  const handleNewSession = () => {
    router.push(`/trainers/new-session${clientId ? `?clientId=${clientId}` : ''}`);
  };

  const handleViewSessions = () => {
    router.push('/trainers/sessions');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Schedule Session</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleNewSession}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Plus size={24} color={colors.primary} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Schedule New Session</Text>
              <Text style={styles.actionDescription}>
                Create a new training session with a client
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleViewSessions}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.success}15` }]}>
              <Calendar size={24} color={colors.success} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>View All Sessions</Text>
              <Text style={styles.actionDescription}>
                See your complete session schedule
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Coming Soon', 'Calendar view will be available soon')}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.warning}15` }]}>
              <Clock size={24} color={colors.warning} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Calendar View</Text>
              <Text style={styles.actionDescription}>
                View sessions in calendar format
              </Text>
            </View>
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
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});