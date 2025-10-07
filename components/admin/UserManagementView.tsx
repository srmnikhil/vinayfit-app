import React, { useState } from 'react';
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
  Mail, 
  Calendar, 
  Shield, 
  UserCheck, 
  UserX, 
  Clock,
  ChevronDown,
  X
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { UserRole } from '../../contexts/UserContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'trial' | 'pending';
  joinDate: string;
  trialEndDate?: string;
  lastActive: string;
  avatar: string;
}

interface InviteData {
  email: string;
  role: UserRole;
  trialDays: number;
  customMessage: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'trainer',
    status: 'active',
    joinDate: '2024-01-15',
    lastActive: '2 hours ago',
    avatar: '👩‍💼',
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike@example.com',
    role: 'client',
    status: 'trial',
    joinDate: '2024-06-01',
    trialEndDate: '2024-06-15',
    lastActive: '1 day ago',
    avatar: '👨‍💻',
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    role: 'nutritionist',
    status: 'active',
    joinDate: '2024-03-20',
    lastActive: '30 min ago',
    avatar: '👩‍🎨',
  },
  {
    id: '4',
    name: 'David Lee',
    email: 'david@example.com',
    role: 'hr',
    status: 'pending',
    joinDate: '2024-06-10',
    lastActive: 'Never',
    avatar: '👨‍💼',
  },
];

const roleOptions: { value: UserRole; label: string; color: string }[] = [
  { value: 'client', label: 'Client', color: '#3B82F6' },
  { value: 'trainer', label: 'Trainer', color: '#10B981' },
  { value: 'nutritionist', label: 'Nutritionist', color: '#F59E0B' },
  { value: 'admin', label: 'Admin', color: '#EF4444' },
  { value: 'hr', label: 'HR', color: '#8B5CF6' },
];

const statusOptions = [
  { value: 'all', label: 'All Users' },
  { value: 'active', label: 'Active' },
  { value: 'trial', label: 'Trial' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
];

export default function UserManagementView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  const [inviteData, setInviteData] = useState<InviteData>({
    email: '',
    role: 'client',
    trialDays: 14,
    customMessage: '',
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'trial': return colors.warning;
      case 'pending': return colors.info;
      case 'inactive': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getRoleColor = (role: UserRole) => {
    const roleOption = roleOptions.find(option => option.value === role);
    return roleOption?.color || colors.textSecondary;
  };

  const handleSendInvite = () => {
    if (!inviteData.email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    // Generate invitation link
    const inviteLink = `https://vinayfit.app/invite?token=${generateInviteToken()}&role=${inviteData.role}&trial=${inviteData.trialDays}`;
    
    // In a real app, this would send an email
    Alert.alert(
      'Invitation Sent!',
      `Invitation link has been sent to ${inviteData.email}\n\nLink: ${inviteLink}`,
      [
        {
          text: 'Copy Link',
          onPress: () => {
            // In a real app, copy to clipboard
            console.log('Copied to clipboard:', inviteLink);
          }
        },
        { text: 'OK' }
      ]
    );

    // Reset form
    setInviteData({
      email: '',
      role: 'client',
      trialDays: 14,
      customMessage: '',
    });
    setShowInviteModal(false);
  };

  const generateInviteToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleUserAction = (userId: string, action: 'activate' | 'deactivate' | 'delete') => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => {
            setUsers(prev => {
              if (action === 'delete') {
                return prev.filter(user => user.id !== userId);
              } else {
                return prev.map(user => 
                  user.id === userId 
                    ? { ...user, status: action === 'activate' ? 'active' : 'inactive' }
                    : user
                );
              }
            });
          }
        }
      ]
    );
  };

  const renderUserCard = (user: User) => (
    <View key={user.id} style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{user.avatar}</Text>
        </View>
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          
          <View style={styles.userMeta}>
            <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(user.role)}20` }]}>
              <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) }]}>
              <Text style={styles.statusText}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.lastActive}>Last active: {user.lastActive}</Text>
          
          {user.status === 'trial' && user.trialEndDate && (
            <Text style={styles.trialInfo}>
              Trial ends: {new Date(user.trialEndDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleUserAction(user.id, user.status === 'active' ? 'deactivate' : 'activate')}
        >
          {user.status === 'active' ? (
            <UserX size={16} color={colors.error} />
          ) : (
            <UserCheck size={16} color={colors.success} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleUserAction(user.id, 'delete')}
        >
          <X size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <Text style={styles.title}>User Management</Text> */}
        <TouchableOpacity 
          style={styles.inviteButton}
          onPress={() => setShowInviteModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.inviteButtonText}>Invite User</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* User Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.filter(u => u.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.filter(u => u.status === 'trial').length}</Text>
          <Text style={styles.statLabel}>Trial</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.filter(u => u.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* User List */}
      <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
        {filteredUsers.map(renderUserCard)}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Invite User Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invite User</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={inviteData.email}
                onChangeText={(text) => setInviteData(prev => ({ ...prev, email: text }))}
                placeholder="user@example.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {roleOptions.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleOption,
                      inviteData.role === role.value && styles.selectedRoleOption
                    ]}
                    onPress={() => setInviteData(prev => ({ ...prev, role: role.value }))}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      inviteData.role === role.value && styles.selectedRoleOptionText
                    ]}>
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Trial Period (Days)</Text>
              <TextInput
                style={styles.input}
                value={inviteData.trialDays.toString()}
                onChangeText={(text) => setInviteData(prev => ({ ...prev, trialDays: parseInt(text) || 0 }))}
                placeholder="14"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Custom Message (Optional)</Text>
              <TextInput
                style={styles.textArea}
                value={inviteData.customMessage}
                onChangeText={(text) => setInviteData(prev => ({ ...prev, customMessage: text }))}
                placeholder="Welcome to BODIQU! We're excited to have you join our team..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.sendInviteButton}
              onPress={handleSendInvite}
            >
              <Mail size={20} color="#FFFFFF" />
              <Text style={styles.sendInviteButtonText}>Send Invitation</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter Users</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Status</Text>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.filterOption,
                    selectedStatus === status.value && styles.selectedFilterOption
                  ]}
                  onPress={() => setSelectedStatus(status.value)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedStatus === status.value && styles.selectedFilterOptionText
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Role</Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedRole === 'all' && styles.selectedFilterOption
                ]}
                onPress={() => setSelectedRole('all')}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedRole === 'all' && styles.selectedFilterOptionText
                ]}>
                  All Roles
                </Text>
              </TouchableOpacity>
              {roleOptions.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.filterOption,
                    selectedRole === role.value && styles.selectedFilterOption
                  ]}
                  onPress={() => setSelectedRole(role.value)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedRole === role.value && styles.selectedFilterOptionText
                  ]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inviteButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
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
  filterButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
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
    fontSize: 20,
    color: colors.text,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  userEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  roleBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
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
  lastActive: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  trialInfo: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.warning,
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalContent: {
    flex: 1,
    padding: 20,
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
  textArea: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 100,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedRoleOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
  },
  selectedRoleOptionText: {
    color: '#FFFFFF',
  },
  filterOption: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
  },
  selectedFilterOptionText: {
    color: '#FFFFFF',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sendInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
  },
  sendInviteButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});