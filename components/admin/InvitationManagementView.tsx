import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Mail, Clock, CircleCheck as CheckCircle, Circle as XCircle, RefreshCw, Copy, Calendar, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { UserRole } from '../../contexts/UserContext';

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  sentDate: string;
  expiryDate: string;
  trialDays: number;
  inviteLink: string;
  sentBy: string;
}

const mockInvitations: Invitation[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    role: 'trainer',
    status: 'pending',
    sentDate: '2024-06-10',
    expiryDate: '2024-06-17',
    trialDays: 14,
    inviteLink: 'https://vinayfit.app/invite?token=abc123',
    sentBy: 'Admin User',
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    role: 'client',
    status: 'accepted',
    sentDate: '2024-06-08',
    expiryDate: '2024-06-15',
    trialDays: 7,
    inviteLink: 'https://vinayfit.app/invite?token=def456',
    sentBy: 'Admin User',
  },
  {
    id: '3',
    email: 'bob.wilson@example.com',
    role: 'nutritionist',
    status: 'expired',
    sentDate: '2024-06-01',
    expiryDate: '2024-06-08',
    trialDays: 14,
    inviteLink: 'https://vinayfit.app/invite?token=ghi789',
    sentBy: 'Admin User',
  },
];

export default function InvitationManagementView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [invitations, setInvitations] = useState<Invitation[]>(mockInvitations);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const filteredInvitations = invitations.filter(invitation => 
    selectedStatus === 'all' || invitation.status === selectedStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'accepted': return colors.success;
      case 'expired': return colors.error;
      case 'cancelled': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'accepted': return CheckCircle;
      case 'expired': return XCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'client': return '#3B82F6';
      case 'trainer': return '#10B981';
      case 'nutritionist': return '#F59E0B';
      case 'admin': return '#EF4444';
      case 'hr': return '#8B5CF6';
      default: return colors.textSecondary;
    }
  };

  const handleCopyLink = (link: string) => {
    // In a real app, copy to clipboard
    Alert.alert('Copied!', 'Invitation link copied to clipboard');
    console.log('Copied to clipboard:', link);
  };

  const handleResendInvitation = (invitationId: string) => {
    Alert.alert(
      'Resend Invitation',
      'Are you sure you want to resend this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resend',
          onPress: () => {
            setInvitations(prev => 
              prev.map(inv => 
                inv.id === invitationId 
                  ? { 
                      ...inv, 
                      status: 'pending',
                      sentDate: new Date().toISOString().split('T')[0],
                      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    }
                  : inv
              )
            );
            Alert.alert('Success', 'Invitation has been resent');
          }
        }
      ]
    );
  };

  const handleCancelInvitation = (invitationId: string) => {
    Alert.alert(
      'Cancel Invitation',
      'Are you sure you want to cancel this invitation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            setInvitations(prev => 
              prev.map(inv => 
                inv.id === invitationId 
                  ? { ...inv, status: 'cancelled' }
                  : inv
              )
            );
          }
        }
      ]
    );
  };

  const renderInvitationCard = (invitation: Invitation) => {
    const StatusIcon = getStatusIcon(invitation.status);
    const isExpired = new Date(invitation.expiryDate) < new Date();
    const daysUntilExpiry = Math.ceil((new Date(invitation.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <View key={invitation.id} style={styles.invitationCard}>
        <View style={styles.invitationHeader}>
          <View style={styles.invitationInfo}>
            <Text style={styles.invitationEmail}>{invitation.email}</Text>
            <View style={styles.invitationMeta}>
              <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(invitation.role)}20` }]}>
                <Text style={[styles.roleText, { color: getRoleColor(invitation.role) }]}>
                  {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                </Text>
              </View>
              
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invitation.status) }]}>
                <StatusIcon size={12} color="#FFFFFF" />
                <Text style={styles.statusText}>
                  {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.invitationDetails}>
          <View style={styles.detailRow}>
            <Calendar size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              Sent: {new Date(invitation.sentDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {invitation.status === 'pending' && !isExpired
                ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
                : `Expired: ${new Date(invitation.expiryDate).toLocaleDateString()}`
              }
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <User size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              Trial: {invitation.trialDays} days
            </Text>
          </View>
        </View>

        <View style={styles.invitationActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleCopyLink(invitation.inviteLink)}
          >
            <Copy size={16} color={colors.primary} />
          </TouchableOpacity>
          
          {invitation.status === 'pending' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleResendInvitation(invitation.id)}
            >
              <RefreshCw size={16} color={colors.success} />
            </TouchableOpacity>
          )}
          
          {(invitation.status === 'pending' || invitation.status === 'expired') && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleCancelInvitation(invitation.id)}
            >
              <XCircle size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Invitation Management</Text>
      </View>

      {/* Status Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterChip,
              selectedStatus === option.value && styles.activeFilterChip
            ]}
            onPress={() => setSelectedStatus(option.value)}
          >
            <Text style={[
              styles.filterText,
              selectedStatus === option.value && styles.activeFilterText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Invitation Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{invitations.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{invitations.filter(i => i.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{invitations.filter(i => i.status === 'accepted').length}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{invitations.filter(i => i.status === 'expired').length}</Text>
          <Text style={styles.statLabel}>Expired</Text>
        </View>
      </View>

      {/* Invitations List */}
      <ScrollView style={styles.invitationsList} showsVerticalScrollIndicator={false}>
        {filteredInvitations.length === 0 ? (
          <View style={styles.emptyState}>
            <Mail size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No invitations found</Text>
            <Text style={styles.emptyText}>
              {selectedStatus === 'all' 
                ? "No invitations have been sent yet."
                : `No ${selectedStatus} invitations found.`}
            </Text>
          </View>
        ) : (
          filteredInvitations.map(renderInvitationCard)
        )}
        
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
  filterContainer: {
    marginVertical: 16,
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
    fontSize: 18,
    color: colors.text,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  invitationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  invitationCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  invitationMeta: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  invitationDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
});