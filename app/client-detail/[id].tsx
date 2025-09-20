import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  MessageSquare, 
  Phone, 
  Video,
  Calendar,
  TrendingUp,
  Target,
  Activity,
  Clock,
  Dumbbell,
  Plus,
  Edit3,
  MoreHorizontal,
  Award,
  Flame,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  User,
  Mail,
  MapPin,
  Heart,
  Scale,
  Zap
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function ClientDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams();

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
  });
  const [sessionNotes, setSessionNotes] = useState('');

  // Fetch client data from Supabase
  const fetchClient = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== 'string') {
        setError('Invalid client ID.');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      console.log('Fetching client profile for ID:', id);
      
      // First, try to fetch the profile without role filter to see if it exists
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id);
      
      console.log('All profiles with this ID:', { allProfiles, allProfilesError });
      
      // Fetch client profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'client')
        .single();
      
      console.log('Client profile result:', { profile, profileError });
      
      if (profileError || !profile) {
        // If no client profile found, check if it's a different role
        if (allProfiles && allProfiles.length > 0) {
          const foundProfile = allProfiles[0];
          console.log('Found profile with different role:', foundProfile);
          setError(`Profile found but has role '${foundProfile.role}' instead of 'client'.`);
        } else {
          setError('Client profile not found. Please check the client ID.');
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch stats (get most recent, do not use .single())
      const { data: statsArr } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', id)
        .order('date', { ascending: false })
        .limit(1);
      const stats = statsArr && statsArr.length > 0 ? statsArr[0] : null;

      // Fetch goals
      const { data: goals } = await supabase
        .from('goals')
        .select('title')
        .eq('user_id', id)
        .eq('status', 'active');

      // Fetch recent workouts
      const { data: recentWorkouts } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', id)
        .order('date', { ascending: false })
        .limit(3);

      // Fetch upcoming sessions
      console.log('Fetching upcoming sessions for client ID:', id);
      let { data: upcomingSessions, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('client_id', id)
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true })
        .limit(3);
      
      console.log('Upcoming sessions result:', { upcomingSessions, sessionsError });
      
      // If no sessions found, try alternative table names
      if (!upcomingSessions || upcomingSessions.length === 0) {
        console.log('No sessions found in training_sessions, trying sessions table...');
        const { data: altSessions, error: altError } = await supabase
          .from('sessions')
          .select('*')
          .eq('client_id', id)
          .gte('session_date', new Date().toISOString().split('T')[0])
          .order('session_date', { ascending: true })
          .limit(3);
        
        console.log('Alternative sessions result:', { altSessions, altError });
        
        if (altSessions && altSessions.length > 0) {
          upcomingSessions = altSessions;
        }
      }

      // Debug: Check if there are any sessions at all for this client
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('client_id', id);
      
      console.log('All sessions for this client:', { allSessions, allSessionsError });

      // Fetch achievements (mocked for now)
      const achievements = [];

      // Progress data (weight over time)
      const { data: progressData } = await supabase
        .from('daily_stats')
        .select('date, weight_kg')
        .eq('user_id', id)
        .order('date', { ascending: true });

      setClient({
        id: profile.id,
        name: profile.full_name || profile.email,
        email: profile.email,
        avatar: '👤',
        phone: profile.phone_number || '',
        location: profile.location || '',
        joinDate: profile.created_at,
        lastWorkout: recentWorkouts && recentWorkouts[0] ? recentWorkouts[0].date : '',
        nextSession: upcomingSessions && upcomingSessions[0] ? `${upcomingSessions[0].session_date || upcomingSessions[0].scheduled_date} ${upcomingSessions[0].scheduled_time}` : '',
        status: 'active', // Default status since profiles table doesn't have status
        streak: stats?.streak || 0,
        totalWorkouts: stats?.total_workouts || 0,
        completedWorkouts: stats?.completed_workouts || 0,
        compliance: stats?.compliance || 0,
        goals: goals?.map((g: any) => g.title) || [],
        stats: {
          currentWeight: stats?.weight_kg || 0,
          targetWeight: 0, // You can fetch from goals if you store it
          weightLoss: 0, // Calculate from progressData
          bodyFat: stats?.body_fat || 0,
          muscle: stats?.muscle || 0,
        },
        recentWorkouts: recentWorkouts || [],
        upcomingSessions: upcomingSessions || [],
        progressData: (progressData || []).map((d: any) => ({ date: d.date, weight: d.weight_kg })),
        achievements,
      });
      setEditForm({
        name: profile.full_name || profile.email,
        email: profile.email,
        phone: profile.phone_number || '',
        location: profile.location || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load client');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClient();
    // eslint-disable-next-line
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading client...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Client Not Found</Text>
          <Text style={styles.errorText}>{error || 'The requested client could not be found.'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Handlers (same as before)
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClient();
  };

  const handleCall = () => {
    Alert.alert('Call Client', `Calling ${client.name}...`);
  };

  const handleVideoCall = () => {
    Alert.alert('Video Call', `Starting video call with ${client.name}...`);
  };

  const handleMessage = () => {
    router.push(`/chat/${client.id}`);
  };

  const handleScheduleSession = () => {
    router.push(`/schedule-session?clientId=${client.id}`);
  };

  const handleEditSession = (session: any) => {
    console.log('Edit session pressed:', session);
    console.log('Session ID:', session.id);
    console.log('Session ID type:', typeof session.id);
    
    if (!session.id) {
      console.error('No session ID found!');
      Alert.alert('Error', 'Session ID not found');
      return;
    }
    
    // Navigate to session edit page
    const route = `/session/${session.id}`;
    console.log('Navigating to:', route);
    
    // Use push to navigate to the session edit page
    router.push(route);
  };

  const handleSaveEdit = async () => {
    try {
      console.log('Saving client edits:', editForm);
      
      // Update the profile in the database
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          location: editForm.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating client profile:', error);
        Alert.alert('Error', 'Failed to update client information: ' + error.message);
        return;
      }
      
      console.log('Client profile updated successfully:', data);
      
      // Update local state
      setClient((prev: any) => prev ? { 
        ...prev, 
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        location: editForm.location
      } : null);
      
      setShowEditModal(false);
      Alert.alert('Success', 'Client information updated successfully');
      
    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
      Alert.alert('Error', 'Failed to update client information');
    }
  };

  const handleAddNotes = () => {
    if (sessionNotes.trim()) {
      Alert.alert('Success', 'Session notes added successfully');
      setSessionNotes('');
      setShowNotesModal(false);
    }
  };

  const createTestSession = async () => {
    try {
      console.log('Creating test session for client:', client.id);
      
      // Get current trainer ID
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        Alert.alert('Error', 'Could not get trainer ID');
        return;
      }
      
      // Create a test session for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('training_sessions')
        .insert({
          client_id: client.id,
          trainer_id: userData.user.id,
          session_date: tomorrowStr,
          scheduled_time: '10:00:00',
          duration: 60,
          session_type: 'Personal Training',
          status: 'scheduled',
          location: 'Gym A',
          notes: 'Test session created from client details page'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating test session:', error);
        Alert.alert('Error', 'Failed to create test session: ' + error.message);
        return;
      }
      
      console.log('Test session created:', data);
      Alert.alert('Success', 'Test session created! Refresh the page to see it.');
      
      // Refresh the client data
      await fetchClient();
      
    } catch (error) {
      console.error('Error in createTestSession:', error);
      Alert.alert('Error', 'Failed to create test session');
    }
  };

  // Render functions (use dynamic client)
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
            <Scale size={20} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>{client.stats.currentWeight}kg</Text>
          <Text style={styles.statLabel}>Current Weight</Text>
          <Text style={[styles.statChange, { color: colors.success }]}>-{Math.abs(client.stats.weightLoss)}kg</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
            <Target size={20} color={colors.success} />
          </View>
          <Text style={styles.statValue}>{client.compliance}%</Text>
          <Text style={styles.statLabel}>Compliance</Text>
          <Text style={[styles.statChange, { color: colors.success }]}>+5% this week</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
            <Flame size={20} color={colors.warning} />
          </View>
          <Text style={styles.statValue}>{client.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
          <Text style={[styles.statChange, { color: colors.success }]}>Personal best!</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.error}15` }]}>
            <Heart size={20} color={colors.error} />
          </View>
          <Text style={styles.statValue}>{client.stats.bodyFat}%</Text>
          <Text style={styles.statLabel}>Body Fat</Text>
          <Text style={[styles.statChange, { color: colors.success }]}>-2.1% this month</Text>
        </View>
      </View>
      {/* Progress Chart */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Weight Progress</Text>
        <View style={styles.progressChart}>
          {Array.isArray(client.progressData) && client.progressData.length > 0 ? (
            client.progressData.map((point: any, index: number) => (
              <View key={index} style={styles.progressPoint}>
                <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.progressDate}>
                  {point.date ? new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                </Text>
                <Text style={styles.progressWeight}>
                  {point.weight != null ? `${point.weight}kg` : '0kg'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.progressDate}>No progress data available.</Text>
          )}
        </View>
      </View>
      {/* Goals */}
      <View style={styles.goalsCard}>
        <Text style={styles.goalsTitle}>Current Goals</Text>
        <View style={styles.goalsList}>
          {Array.isArray(client.goals) && client.goals.length > 0 ? (
            client.goals.map((goal: string, index: number) => (
              <View key={index} style={styles.goalItem}>
                <Target size={16} color={colors.primary} />
                <Text style={styles.goalText}>{goal}</Text>
                <CheckCircle size={16} color={colors.success} />
              </View>
            ))
          ) : (
            <Text style={styles.goalText}>No active goals.</Text>
          )}
        </View>
      </View>
      {/* Recent Achievements (empty for now) */}
      <View style={styles.achievementsCard}>
        <Text style={styles.achievementsTitle}>Recent Achievements</Text>
        {client.achievements && client.achievements.length > 0 ? client.achievements.map((achievement: any) => (
          <View key={achievement.id} style={styles.achievementItem}>
            <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDate}>{new Date(achievement.date).toLocaleDateString()}</Text>
            </View>
            <Award size={16} color={colors.warning} />
          </View>
        )) : <Text style={styles.achievementDate}>No achievements yet.</Text>}
      </View>
    </View>
  );

  const renderWorkoutsTab = () => (
    <View style={styles.tabContent}>
      {/* Workout Summary */}
      <View style={styles.workoutSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{client.completedWorkouts}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{client.totalWorkouts}</Text>
          <Text style={styles.summaryLabel}>Total Planned</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{client.totalWorkouts > 0 ? Math.round((client.completedWorkouts / client.totalWorkouts) * 100) : 0}%</Text>
          <Text style={styles.summaryLabel}>Success Rate</Text>
        </View>
      </View>
      {/* Recent Workouts */}
      <Text style={styles.sectionTitle}>Recent Workouts</Text>
      {client.recentWorkouts && client.recentWorkouts.length > 0 ? client.recentWorkouts.map((workout: any) => (
        <View key={workout.id} style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutType}>{workout.type}</Text>
              <Text style={styles.workoutDate}>{new Date(workout.date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.workoutStatus}>
              {workout.completed ? (
                <CheckCircle size={20} color={colors.success} />
              ) : (
                <AlertCircle size={20} color={colors.warning} />
              )}
            </View>
          </View>
          <View style={styles.workoutDetails}>
            <View style={styles.workoutDetail}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.workoutDetailText}>{workout.duration != null ? workout.duration : 0} min</Text>
            </View>
            <View style={styles.workoutDetail}>
              <Dumbbell size={14} color={colors.textSecondary} />
              <Text style={styles.workoutDetailText}>{workout.exercises != null ? workout.exercises : 0} exercises</Text>
            </View>
          </View>
          {workout.notes && (
            <Text style={styles.workoutNotes}>{workout.notes}</Text>
          )}
        </View>
      )) : <Text style={styles.workoutNotes}>No recent workouts.</Text>}
    </View>
  );

  const renderScheduleTab = () => {
    console.log('Rendering schedule tab, upcomingSessions:', client.upcomingSessions);
    return (
    <View style={styles.tabContent}>
      <View style={styles.scheduleHeader}>
        <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
        <TouchableOpacity style={styles.addSessionButton} onPress={handleScheduleSession}>
          <Plus size={16} color={colors.primary} />
          <Text style={styles.addSessionText}>Add Session</Text>
        </TouchableOpacity>
      </View>
      {client.upcomingSessions && client.upcomingSessions.length > 0 ? client.upcomingSessions.map((session: any) => (
        <View key={session.id} style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionDateTime}>
              <Text style={styles.sessionDate}>{new Date(session.session_date || session.scheduled_date || session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
              <Text style={styles.sessionTime}>{session.scheduled_time || session.time}</Text>
            </View>
            <TouchableOpacity style={styles.sessionActions}>
              <MoreHorizontal size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionType}>{session.session_type || session.type}</Text>
            <View style={styles.sessionMeta}>
              <View style={styles.sessionMetaItem}>
                <Clock size={14} color={colors.textSecondary} />
                <Text style={styles.sessionMetaText}>{session.duration != null ? session.duration : 0} min</Text>
              </View>
              <View style={styles.sessionMetaItem}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text style={styles.sessionMetaText}>{session.location || 'N/A'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.sessionButtons}>
            <TouchableOpacity style={styles.sessionButton}>
              <MessageSquare size={16} color={colors.primary} />
              <Text style={styles.sessionButtonText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sessionButton}
              onPress={() => handleEditSession(session)}
            >
              <Edit3 size={16} color={colors.textSecondary} />
              <Text style={styles.sessionButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )) : (
        <View style={styles.noSessionsContainer}>
          <Text style={styles.sessionMetaText}>No upcoming sessions.</Text>
          <TouchableOpacity 
            style={styles.createTestSessionButton} 
            onPress={() => createTestSession()}
          >
            <Text style={styles.createTestSessionText}>Create Test Session</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Details</Text>
        <TouchableOpacity 
          onPress={() => {
            console.log('Edit button pressed, current editForm:', editForm);
            setShowEditModal(true);
          }} 
          style={styles.headerEditButton}
        >
          <Edit3 size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Client Info Card */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1E293B', '#334155'] : ['#F8FAFC', '#E2E8F0']}
          style={styles.clientCard}
        >
          <View style={styles.clientHeader}>
            <View style={styles.clientAvatarContainer}>
              <Text style={styles.clientAvatar}>{client.avatar}</Text>
              {client.streak > 0 && (
                <View style={styles.streakBadge}>
                  <Flame size={12} color="#FFFFFF" />
                  <Text style={styles.streakText}>{client.streak}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{client.name}</Text>
              <Text style={styles.clientEmail}>{client.email}</Text>
              <Text style={styles.clientJoinDate}>
                Member since {new Date(client.joinDate).toLocaleDateString()}
              </Text>
              
              <View style={styles.clientStatus}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: client.status === 'active' ? colors.success : colors.warning }
                ]}>
                  <Text style={styles.statusText}>
                    {client.status === 'active' ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <Text style={styles.lastWorkout}>Last workout: {client.lastWorkout}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
              <MessageSquare size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Phone size={20} color={colors.success} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleVideoCall}>
              <Video size={20} color={colors.warning} />
              <Text style={styles.actionButtonText}>Video</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowNotesModal(true)}>
              <Edit3 size={20} color={colors.textSecondary} />
              <Text style={styles.actionButtonText}>Notes</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
            onPress={() => setSelectedTab('overview')}
          >
            <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'workouts' && styles.activeTab]}
            onPress={() => setSelectedTab('workouts')}
          >
            <Text style={[styles.tabText, selectedTab === 'workouts' && styles.activeTabText]}>
              Workouts
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'schedule' && styles.activeTab]}
            onPress={() => setSelectedTab('schedule')}
          >
            <Text style={[styles.tabText, selectedTab === 'schedule' && styles.activeTabText]}>
              Schedule
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'workouts' && renderWorkoutsTab()}
        {selectedTab === 'schedule' && renderScheduleTab()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Client Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Client</Text>
            <TouchableOpacity onPress={handleSaveEdit}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter full name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.email}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                placeholder="Enter email address"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.phone}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.location}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, location: text }))}
                placeholder="Enter location"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Session Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Session Notes</Text>
            <TouchableOpacity onPress={handleAddNotes}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Notes for {client.name}</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="Add notes about the session, progress, or observations..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
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
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerEditButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  clientCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  clientAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  clientAvatar: {
    fontSize: 48,
    width: 80,
    height: 80,
    textAlign: 'center',
    lineHeight: 80,
    backgroundColor: colors.surface,
    borderRadius: 40,
    overflow: 'hidden',
  },
  streakBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.warning,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 4,
  },
  clientEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  clientJoinDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 12,
  },
  clientStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  lastWorkout: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 64) / 2,
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
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  statChange: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  progressChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  progressPoint: {
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  progressWeight: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  goalsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  goalsList: {
    gap: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  achievementsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  achievementEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  achievementDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  workoutSummary: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  workoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  workoutDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  workoutStatus: {
    padding: 4,
  },
  workoutDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  workoutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutDetailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  workoutNotes: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addSessionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDateTime: {
    flex: 1,
  },
  sessionDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  sessionTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.primary,
  },
  sessionActions: {
    padding: 4,
  },
  sessionDetails: {
    marginBottom: 12,
  },
  sessionType: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  sessionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sessionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
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
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  noSessionsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  createTestSessionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  createTestSessionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.white,
  },
});