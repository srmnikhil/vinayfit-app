import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  TrendingUp,
  Users,
  Calendar,
  Target,
  Award,
  Activity,
  Clock,
  Flame,
  ChevronDown
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  const periods = ['This Week', 'This Month', 'Last 3 Months', 'This Year'];

  const overviewStats = [
    { label: 'Total Clients', value: '24', change: '+12%', trend: 'up', icon: Users },
    { label: 'Sessions This Month', value: '156', change: '+8%', trend: 'up', icon: Calendar },
    { label: 'Avg Session Rating', value: '4.8', change: '+0.2', trend: 'up', icon: Award },
    { label: 'Client Retention', value: '94%', change: '+3%', trend: 'up', icon: Target },
  ];

  const clientProgress = [
    { name: 'Sarah Johnson', progress: 92, sessions: 24, trend: 'up' },
    { name: 'Mike Chen', progress: 88, sessions: 20, trend: 'up' },
    { name: 'Emma Wilson', progress: 76, sessions: 18, trend: 'down' },
    { name: 'Alex Rodriguez', progress: 85, sessions: 22, trend: 'up' },
    { name: 'Lisa Park', progress: 91, sessions: 26, trend: 'up' },
  ];

  const sessionData = [
    { day: 'Mon', sessions: 8, revenue: 640 },
    { day: 'Tue', sessions: 6, revenue: 480 },
    { day: 'Wed', sessions: 10, revenue: 800 },
    { day: 'Thu', sessions: 7, revenue: 560 },
    { day: 'Fri', sessions: 9, revenue: 720 },
    { day: 'Sat', sessions: 12, revenue: 960 },
    { day: 'Sun', sessions: 5, revenue: 400 },
  ];

  const maxSessions = Math.max(...sessionData.map(d => d.sessions));

  const renderOverviewCard = (stat: any, index: number) => {
    const IconComponent = stat.icon;
    const isPositive = stat.trend === 'up';
    
    return (
      <View key={index} style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <View style={[styles.overviewIcon, { backgroundColor: `${colors.primary}15` }]}>
            <IconComponent size={20} color={colors.primary} />
          </View>
          <View style={[
            styles.changeIndicator,
            { backgroundColor: isPositive ? colors.success : colors.error }
          ]}>
            <TrendingUp size={12} color="#FFFFFF" />
            <Text style={styles.changeText}>{stat.change}</Text>
          </View>
        </View>
        <Text style={styles.overviewValue}>{stat.value}</Text>
        <Text style={styles.overviewLabel}>{stat.label}</Text>
      </View>
    );
  };

  const renderProgressBar = (progress: number) => (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${progress}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>{progress}%</Text>
    </View>
  );

  const renderSessionChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Weekly Sessions</Text>
      <View style={styles.chart}>
        {sessionData.map((data, index) => (
          <View key={index} style={styles.chartBar}>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar,
                  { 
                    height: (data.sessions / maxSessions) * 100,
                    backgroundColor: colors.primary 
                  }
                ]} 
              />
            </View>
            <Text style={styles.barLabel}>{data.day}</Text>
            <Text style={styles.barValue}>{data.sessions}</Text>
          </View>
        ))}
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
        <Text style={styles.title}>Analytics</Text>
        <TouchableOpacity style={styles.periodSelector}>
          <Text style={styles.periodText}>{selectedPeriod}</Text>
          <ChevronDown size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Revenue Overview */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1E40AF', '#3730A3'] : ['#667EEA', '#764BA2']}
          style={styles.revenueCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.revenueContent}>
            <Text style={styles.revenueLabel}>TOTAL REVENUE</Text>
            <Text style={styles.revenueValue}>$12,450</Text>
            <Text style={styles.revenueChange}>+18% from last month</Text>
          </View>
        </LinearGradient>

        {/* Overview Stats */}
        <View style={styles.overviewGrid}>
          {overviewStats.map(renderOverviewCard)}
        </View>

        {/* Session Chart */}
        {renderSessionChart()}

        {/* Client Progress */}
        <View style={styles.progressSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Client Progress</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {clientProgress.map((client, index) => (
            <View key={index} style={styles.progressItem}>
              <View style={styles.progressInfo}>
                <Text style={styles.clientName}>{client.name}</Text>
                <Text style={styles.sessionCount}>{client.sessions} sessions</Text>
              </View>
              {renderProgressBar(client.progress)}
              <View style={styles.trendIcon}>
                <TrendingUp 
                  size={16} 
                  color={client.trend === 'up' ? colors.success : colors.error}
                  style={client.trend === 'down' && { transform: [{ rotate: '180deg' }] }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Activity size={24} color={colors.primary} />
              <Text style={styles.metricValue}>89%</Text>
              <Text style={styles.metricLabel}>Session Completion</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Clock size={24} color={colors.success} />
              <Text style={styles.metricValue}>52 min</Text>
              <Text style={styles.metricLabel}>Avg Session Time</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Flame size={24} color={colors.warning} />
              <Text style={styles.metricValue}>7.2</Text>
              <Text style={styles.metricLabel}>Avg Weekly Sessions</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Target size={24} color={colors.error} />
              <Text style={styles.metricValue}>76%</Text>
              <Text style={styles.metricLabel}>Goal Achievement</Text>
            </View>
          </View>
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
    flex: 1,
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  periodText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginRight: 4,
  },
  content: {
    flex: 1,
  },
  revenueCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
  },
  revenueContent: {
    alignItems: 'flex-start',
  },
  revenueLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  revenueValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  revenueChange: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  changeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  overviewValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 4,
  },
  overviewLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  barLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  barValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  viewAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  progressInfo: {
    flex: 1,
    marginRight: 16,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  sessionCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    marginRight: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
    minWidth: 30,
  },
  trendIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});