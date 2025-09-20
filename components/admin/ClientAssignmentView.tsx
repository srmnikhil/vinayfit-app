import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  UserPlus, 
  Dumbbell, 
  Apple,
  X,
  Check,
  ChevronDown,
  Calendar,
  MessageSquare
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'trial';
  trainer?: Professional;
  nutritionist?: Professional;
  goals: string[];
}

interface Professional {
  id: string;
  name: string;
  email: string;
  avatar: string;
  specialization?: string;
  rating: number;
  clientCount: number;
}

interface Assignment {
  clientId: string;
  professionalId: string;
  type: 'trainer' | 'nutritionist';
  assignedDate: string;
  assignedBy: string;
}

const mockTrainers: Professional[] = [
  {
    id: 't1',
    name: 'Mike Chen',
    email: 'mike@example.com',
    avatar: '👨‍💻',
    specialization: 'Strength Training',
    rating: 4.8,
    clientCount: 12
  },
  {
    id: 't2',
    name: 'Alex Rodriguez',
    email: 'alex@example.com',
    avatar: '👨‍🏫',
    specialization: 'HIIT & Cardio',
    rating: 4.7,
    clientCount: 15
  },
  {
    id: 't3',
    name: 'Jessica Kim',
    email: 'jessica@example.com',
    avatar: '👩‍🏫',
    specialization: 'Yoga & Flexibility',
    rating: 4.9,
    clientCount: 8
  }
];

const mockNutritionists: Professional[] = [
  {
    id: 'n1',
    name: 'Emma Davis',
    email: 'emma@example.com',
    avatar: '👩‍🎨',
    specialization: 'Sports Nutrition',
    rating: 4.9,
    clientCount: 8
  },
  {
    id: 'n2',
    name: 'Dr. Robert Smith',
    email: 'robert@example.com',
    avatar: '👨‍⚕️',
    specialization: 'Clinical Nutrition',
    rating: 4.8,
    clientCount: 10
  },
  {
    id: 'n3',
    name: 'Maria Garcia',
    email: 'maria@example.com',
    avatar: '👩‍⚕️',
    specialization: 'Weight Management',
    rating: 4.7,
    clientCount: 12
  }
];

export default function ClientAssignmentView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [assignmentType, setAssignmentType] = useState<'trainer' | 'nutritionist'>('trainer');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  // Fetch real users and their assignments
  const fetchClients = async () => {
    try {
      // 1. Fetch all clients from profiles table
      const { data: clientsData, error: clientsError } = await supabase
        .from('profiles')
        .select(`id, full_name, email, created_at, role`)
        .eq('role', 'client');
      
      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        setClients([]);
        return;
      }

      // 2. Fetch all active assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('client_assignments')
        .select(`
          client_id,
          trainer_id,
          nutritionist_id,
          status,
          trainer:profiles!client_assignments_trainer_id_fkey(id, full_name, email, specialization),
          nutritionist:profiles!client_assignments_nutritionist_id_fkey(id, full_name, email, specialization)
        `)
        .eq('status', 'active');

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
      }

      // 3. Create a map of client assignments
      const assignmentsMap: Record<string, any> = {};
      if (assignmentsData) {
        assignmentsData.forEach(assignment => {
          assignmentsMap[assignment.client_id] = assignment;
        });
      }

      // 4. Map clients with their assignments
      const mappedClients = (clientsData || []).map((c: any) => {
        const assignment = assignmentsMap[c.id];
        return {
          id: c.id,
          name: c.full_name || '',
          email: c.email,
          avatar: '👤',
          joinDate: c.created_at,
          status: 'active' as const, // Default status
          trainer: assignment?.trainer ? {
            id: assignment.trainer.id,
            name: assignment.trainer.full_name,
            email: assignment.trainer.email,
            avatar: '💪',
            specialization: assignment.trainer.specialization || '',
            rating: 0,
            clientCount: 0,
          } : undefined,
          nutritionist: assignment?.nutritionist ? {
            id: assignment.nutritionist.id,
            name: assignment.nutritionist.full_name,
            email: assignment.nutritionist.email,
            avatar: '🥗',
            specialization: assignment.nutritionist.specialization || '',
            rating: 0,
            clientCount: 0,
          } : undefined,
          goals: [],
        };
      });
      
      setClients(mappedClients);
    } catch (error) {
      console.error('Error in fetchClients:', error);
      setClients([]);
    }
  };

  // Fetch real professionals for assignment modal
  useEffect(() => {
      const fetchProfessionals = async () => {
    if (assignmentType === 'trainer') {
      try {
        // First, get all trainers from profiles
        const { data: trainersData, error: trainersError } = await supabase
          .from('profiles')
          .select('id, full_name, email, specialization')
          .eq('role', 'trainer');
        
        if (trainersError) throw trainersError;

        // Then, get client counts for each trainer from client_assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('client_assignments')
          .select('trainer_id')
          .eq('status', 'active')
          .not('trainer_id', 'is', null);

        if (assignmentsError) {
          console.error('Error fetching assignments for client count:', assignmentsError);
        }

        // Count clients per trainer
        const clientCounts: Record<string, number> = {};
        if (assignmentsData) {
          assignmentsData.forEach(assignment => {
            if (assignment.trainer_id) {
              clientCounts[assignment.trainer_id] = (clientCounts[assignment.trainer_id] || 0) + 1;
            }
          });
        }

        setProfessionals(
          (trainersData || []).map((trainer: any) => ({
            id: trainer.id,
            name: trainer.full_name,
            email: trainer.email,
            avatar: '💪',
            specialization: trainer.specialization || '',
            rating: 0, // Default rating
            clientCount: clientCounts[trainer.id] || 0,
          }))
        );
      } catch (error) {
        console.error('Error fetching trainers:', error);
        setProfessionals([]);
      }
    } else {
      try {
        // Nutritionists from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, specialization')
          .eq('role', 'nutritionist')
          .order('full_name');
        if (error) {
          console.error('Error fetching nutritionists:', error);
          setProfessionals([]);
          return;
        }
        setProfessionals(
          (data || []).map((n: any) => ({
            id: n.id,
            name: n.full_name,
            email: n.email,
            avatar: '🥗',
            specialization: n.specialization || '',
            rating: 0,
            clientCount: 0,
          }))
        );
      } catch (error) {
        console.error('Error fetching nutritionists:', error);
        setProfessionals([]);
      }
    }
  };
    fetchProfessionals();
  }, [assignmentType]);

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter = false;
    if (selectedFilter === 'all') {
      matchesFilter = true;
    } else if (selectedFilter === 'assigned') {
      matchesFilter = !!client.trainer || !!client.nutritionist;
    } else if (selectedFilter === 'unassigned') {
      matchesFilter = !client.trainer && !client.nutritionist;
    } else if (selectedFilter === 'trainer-only') {
      matchesFilter = !!client.trainer && !client.nutritionist;
    } else if (selectedFilter === 'nutritionist-only') {
      matchesFilter = !!client.nutritionist && !client.trainer;
    } else if (selectedFilter === 'fully-assigned') {
      matchesFilter = !!client.trainer && !!client.nutritionist;
    }
    return matchesSearch && matchesFilter;
  });

  const handleAssignProfessional = (client: Client, type: 'trainer' | 'nutritionist') => {
    setSelectedClient(client);
    setAssignmentType(type);
    setSelectedProfessional(null);
    setShowAssignModal(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedClient || !selectedProfessional) return;

    // Debug logging
    console.log('Assigning professional:', {
      assignmentType,
      selectedProfessional,
      selectedClient
    });

    try {
      // Check if assignment already exists
      const { data: existingAssignment, error: checkError } = await supabase
        .from('client_assignments')
        .select('id')
        .eq('client_id', selectedClient.id)
        .eq('status', 'active')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing assignment:', checkError);
        Alert.alert('Error', 'Failed to check existing assignment.');
        return;
      }

      let result;
      if (existingAssignment) {
        // Update existing assignment
        const updateData = assignmentType === 'trainer' 
          ? { trainer_id: selectedProfessional.id }
          : { nutritionist_id: selectedProfessional.id };
        
        result = await supabase
          .from('client_assignments')
          .update(updateData)
          .eq('id', existingAssignment.id);
      } else {
        // Create new assignment
        const newAssignment: any = {
          client_id: selectedClient.id,
          status: 'active',
          assigned_date: new Date().toISOString().split('T')[0]
        };
        
        if (assignmentType === 'trainer') {
          newAssignment.trainer_id = selectedProfessional.id;
        } else {
          newAssignment.nutritionist_id = selectedProfessional.id;
        }
        
        result = await supabase
          .from('client_assignments')
          .insert(newAssignment);
      }

      // Debug logging
      console.log('Supabase assignment result:', result);

      if (result.error) {
        console.error('Assignment error:', result.error);
        Alert.alert('Error', 'Failed to assign professional.');
        return;
      }

      // Refetch clients using robust two-step mapping
      await fetchClients();

      Alert.alert(
        'Assignment Successful',
        `${selectedProfessional.name} has been assigned as ${assignmentType} to ${selectedClient.name}`
      );

      setShowAssignModal(false);
      setSelectedClient(null);
      setSelectedProfessional(null);
    } catch (error) {
      console.error('Error in assignment:', error);
      Alert.alert('Error', 'Failed to assign professional.');
    }
  };

  const handleRemoveAssignment = (client: Client, type: 'trainer' | 'nutritionist') => {
    Alert.alert(
      'Remove Assignment',
      `Are you sure you want to remove the ${type} assignment for ${client.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Find the assignment record
              const { data: assignment, error: findError } = await supabase
                .from('client_assignments')
                .select('id')
                .eq('client_id', client.id)
                .eq('status', 'active')
                .single();

              if (findError) {
                console.error('Error finding assignment:', findError);
                Alert.alert('Error', 'Failed to find assignment.');
                return;
              }

              // Update the assignment to remove the trainer/nutritionist
              const updateData = type === 'trainer' 
                ? { trainer_id: null }
                : { nutritionist_id: null };

              const { error } = await supabase
                .from('client_assignments')
                .update(updateData)
                .eq('id', assignment.id);

              if (error) {
                console.error('Error removing assignment:', error);
                Alert.alert('Error', 'Failed to remove assignment.');
                return;
              }

              // Refetch clients to update UI
              await fetchClients();
            } catch (error) {
              console.error('Error in remove assignment:', error);
              Alert.alert('Error', 'Failed to remove assignment.');
            }
          }
        }
      ]
    );
  };

  const getProfessionals = () => professionals;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'trial': return colors.warning;
      case 'inactive': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const renderClientCard = (client: Client) => (
    <View key={client.id} style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <View style={styles.clientInfo}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>{client.avatar}</Text>
          </View>
          
          <View style={styles.clientDetails}>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientEmail}>{client.email}</Text>
            <View style={styles.clientMeta}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(client.status) }]}>
                <Text style={styles.statusText}>
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </Text>
              </View>
              <Text style={styles.joinDate}>
                Joined: {new Date(client.joinDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.goalsSection}>
        <Text style={styles.goalsLabel}>Goals:</Text>
        <View style={styles.goalTags}>
          {client.goals.map((goal, index) => (
            <View key={index} style={styles.goalTag}>
              <Text style={styles.goalTagText}>{goal}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.assignmentsSection}>
        <Text style={styles.assignmentsLabel}>Assignments</Text>
        
        {/* Trainer Assignment */}
        <View style={styles.assignmentRow}>
          <View style={styles.assignmentInfo}>
            <Dumbbell size={16} color={colors.primary} />
            <Text style={styles.assignmentType}>Trainer</Text>
          </View>
          
          {client.trainer ? (
            <View style={styles.assignedProfessional}>
              <View style={styles.professionalInfo}>
                <Text style={styles.professionalName}>{client.trainer.name}</Text>
                <Text style={styles.professionalSpec}>{client.trainer.specialization}</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveAssignment(client, 'trainer')}
              >
                <X size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.assignButton}
              onPress={() => handleAssignProfessional(client, 'trainer')}
            >
              <UserPlus size={16} color={colors.primary} />
              <Text style={styles.assignButtonText}>Assign</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Nutritionist Assignment */}
        <View style={styles.assignmentRow}>
          <View style={styles.assignmentInfo}>
            <Apple size={16} color={colors.success} />
            <Text style={styles.assignmentType}>Nutritionist</Text>
          </View>
          
          {client.nutritionist ? (
            <View style={styles.assignedProfessional}>
              <View style={styles.professionalInfo}>
                <Text style={styles.professionalName}>{client.nutritionist.name}</Text>
                <Text style={styles.professionalSpec}>{client.nutritionist.specialization}</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveAssignment(client, 'nutritionist')}
              >
                <X size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.assignButton}
              onPress={() => handleAssignProfessional(client, 'nutritionist')}
            >
              <UserPlus size={16} color={colors.success} />
              <Text style={styles.assignButtonText}>Assign</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderProfessionalOption = (professional: Professional) => (
    <TouchableOpacity
      key={professional.id}
      style={[
        styles.professionalOption,
        selectedProfessional?.id === professional.id && styles.selectedProfessionalOption
      ]}
      onPress={() => setSelectedProfessional(professional)}
    >
      <View style={styles.professionalOptionInfo}>
        <View style={styles.professionalAvatar}>
          <Text style={styles.professionalAvatarText}>{professional.avatar}</Text>
        </View>
        
        <View style={styles.professionalDetails}>
          <Text style={styles.professionalOptionName}>{professional.name}</Text>
          <Text style={styles.professionalOptionEmail}>{professional.email}</Text>
          <Text style={styles.professionalOptionSpec}>{professional.specialization}</Text>
          
          <View style={styles.professionalStats}>
            <Text style={styles.professionalStat}>⭐ {professional.rating}</Text>
            <Text style={styles.professionalStat}>👥 {professional.clientCount} clients</Text>
          </View>
        </View>
      </View>
      
      {selectedProfessional?.id === professional.id && (
        <View style={styles.selectedIndicator}>
          <Check size={20} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Client Assignments</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerStat}>{clients.length} Clients</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { id: 'all', label: 'All Clients' },
          { id: 'assigned', label: 'Assigned' },
          { id: 'unassigned', label: 'Unassigned' },
          { id: 'trainer-only', label: 'Trainer Only' },
          { id: 'nutritionist-only', label: 'Nutritionist Only' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.activeFilterChip
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter.id && styles.activeFilterText
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Assignment Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {clients.filter(c => c.trainer && c.nutritionist).length}
          </Text>
          <Text style={styles.statLabel}>Fully Assigned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {clients.filter(c => c.trainer).length}
          </Text>
          <Text style={styles.statLabel}>Have Trainer</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {clients.filter(c => c.nutritionist).length}
          </Text>
          <Text style={styles.statLabel}>Have Nutritionist</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {clients.filter(c => !c.trainer && !c.nutritionist).length}
          </Text>
          <Text style={styles.statLabel}>Unassigned</Text>
        </View>
      </View>

      {/* Client List */}
      <ScrollView style={styles.clientList} showsVerticalScrollIndicator={false}>
        {filteredClients.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No clients found</Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? "Try adjusting your search terms"
                : "No clients match the selected filter"}
            </Text>
          </View>
        ) : (
          filteredClients.map(renderClientCard)
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Assignment Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Assign {assignmentType === 'trainer' ? 'Trainer' : 'Nutritionist'}
            </Text>
            <TouchableOpacity 
              onPress={handleConfirmAssignment}
              disabled={!selectedProfessional}
            >
              <Text style={[
                styles.confirmButtonText,
                !selectedProfessional && styles.confirmButtonDisabled
              ]}>
                Assign
              </Text>
            </TouchableOpacity>
          </View>

          {selectedClient && (
            <View style={styles.modalClientInfo}>
              <Text style={styles.modalClientName}>Client: {selectedClient.full_name}</Text>
              <Text style={styles.modalClientEmail}>{selectedClient.email}</Text>
            </View>
          )}

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>
              Available {assignmentType === 'trainer' ? 'Trainers' : 'Nutritionists'}
            </Text>
            
            {getProfessionals().map(renderProfessionalOption)}
          </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  headerStat: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  filterContainer: {
    marginBottom: 16,
    maxHeight: 40,
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  clientList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  clientCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  clientHeader: {
    marginBottom: 16,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontSize: 20,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  clientEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  joinDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  goalsSection: {
    marginBottom: 16,
  },
  goalsLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  goalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalTag: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  goalTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.primary,
  },
  assignmentsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  assignmentsLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  assignmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assignmentType: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  assignedProfessional: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 8,
    flex: 2,
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  professionalSpec: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: 4,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assignButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  confirmButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  confirmButtonDisabled: {
    color: colors.textTertiary,
  },
  modalClientInfo: {
    backgroundColor: colors.surface,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 8,
  },
  modalClientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  modalClientEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  professionalOption: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedProfessionalOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  professionalOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  professionalAvatarText: {
    fontSize: 20,
  },
  professionalDetails: {
    flex: 1,
  },
  professionalOptionName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  professionalOptionEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  professionalOptionSpec: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  professionalStats: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  professionalStat: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});