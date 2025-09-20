import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import {
  getConversationsList,
  getUserRooms,
  createChatRoom,
  addRoomMember,
  getUnreadMessageCounts,
  ChatRoom,
  RoomMember,
} from '../../utils/chatService';
import { realtimeService } from '../../utils/realtimeService';
import {
  MessageCircle,
  Users,
  Plus,
  Search,
  Bell,
  Settings,
  Hash,
  Lock,
  Globe,
  Crown,
  Shield,
  User,
} from 'lucide-react-native';

interface ConversationItem {
  id: string;
  type: 'direct' | 'room';
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  roomType?: ChatRoom['room_type'];
  category?: ChatRoom['category'];
  memberRole?: RoomMember['role'];
}

interface CreateRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: any) => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  visible,
  onClose,
  onCreateRoom,
}) => {
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomType, setRoomType] = useState<ChatRoom['room_type']>('group');
  const [category, setCategory] = useState<ChatRoom['category']>('general');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme || 'light');
  const modalStyles = createStyles(colors);

  const handleCreate = async () => {
    if (!roomName.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    setIsLoading(true);
    try {
      await onCreateRoom({
        name: roomName.trim(),
        description: roomDescription.trim(),
        roomType,
        category,
        isPrivate,
      });
      
      // Reset form
      setRoomName('');
      setRoomDescription('');
      setRoomType('group');
      setCategory('general');
      setIsPrivate(false);
      onClose();
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[modalStyles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[modalStyles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[modalStyles.modalCancelButton, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[modalStyles.modalTitle, { color: colors.text }]}>Create Room</Text>
          <TouchableOpacity onPress={handleCreate} disabled={isLoading}>
            <Text style={[modalStyles.modalCreateButton, { color: colors.primary }]}>
              {isLoading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={modalStyles.modalContent}>
          <View style={modalStyles.inputGroup}>
            <Text style={[modalStyles.inputLabel, { color: colors.text }]}>Room Name</Text>
            <TextInput
              style={[modalStyles.textInput, { borderColor: colors.border, color: colors.text }]}
              value={roomName}
              onChangeText={setRoomName}
              placeholder="Enter room name"
              placeholderTextColor={colors.textSecondary}
              maxLength={50}
            />
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={[modalStyles.inputLabel, { color: colors.text }]}>Description (Optional)</Text>
            <TextInput
              style={[modalStyles.textInput, { borderColor: colors.border, color: colors.text }]}
              value={roomDescription}
              onChangeText={setRoomDescription}
              placeholder="Enter room description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={[modalStyles.inputLabel, { color: colors.text }]}>Room Type</Text>
            <View style={modalStyles.optionGroup}>
              {[
                { value: 'group', label: 'Group Chat', icon: Users },
                { value: 'support', label: 'Support', icon: MessageCircle },
                { value: 'community', label: 'Community', icon: Globe },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    modalStyles.optionButton,
                    { borderColor: colors.border },
                    roomType === option.value && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                  ]}
                  onPress={() => setRoomType(option.value as ChatRoom['room_type'])}
                >
                  <option.icon size={20} color={roomType === option.value ? colors.primary : colors.textSecondary} />
                  <Text style={[
                    modalStyles.optionText,
                    { color: roomType === option.value ? colors.primary : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={[modalStyles.inputLabel, { color: colors.text }]}>Category</Text>
            <View style={modalStyles.optionGroup}>
              {[
                { value: 'general', label: 'General' },
                { value: 'training', label: 'Training' },
                { value: 'nutrition', label: 'Nutrition' },
                { value: 'support', label: 'Support' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    modalStyles.categoryButton,
                    { borderColor: colors.border },
                    category === option.value && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                  ]}
                  onPress={() => setCategory(option.value as ChatRoom['category'])}
                >
                  <Text style={[
                    modalStyles.categoryText,
                    { color: category === option.value ? colors.primary : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[modalStyles.toggleOption, { borderColor: colors.border }]}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <View style={modalStyles.toggleContent}>
              <Lock size={20} color={colors.textSecondary} />
              <View style={modalStyles.toggleText}>
                <Text style={[modalStyles.toggleTitle, { color: colors.text }]}>Private Room</Text>
                <Text style={[modalStyles.toggleDescription, { color: colors.textSecondary }]}>
                  Only invited members can join
                </Text>
              </View>
            </View>
            <View style={[
              modalStyles.toggle,
              { backgroundColor: isPrivate ? colors.primary : colors.border }
            ]}>
              <View style={[
                modalStyles.toggleIndicator,
                { backgroundColor: colors.background },
                isPrivate && modalStyles.toggleIndicatorActive
              ]} />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default function TrainerMessagesView() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? 'light');
  const styles = createStyles(colors);

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'rooms'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<any[]>([]);

  // Initialize realtime service
  useEffect(() => {
    if (user?.id) {
      realtimeService.initialize(user.id);
      realtimeService.updatePresence('online', 'browsing_messages');
    }
  }, [user?.id]);

  // Load conversations and rooms
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [conversationsResult, roomsResult, unreadResult] = await Promise.all([
        getConversationsList(user.id),
        getUserRooms(user.id),
        getUnreadMessageCounts(user.id),
      ]);

      const conversationItems: ConversationItem[] = [];

      // Process direct conversations
      if (conversationsResult.data) {
        conversationsResult.data.forEach((conv: any) => {
          const otherParticipant = conv.participant1_id === user.id 
            ? conv.participant2 
            : conv.participant1;
          
          const unread = unreadResult.find((u: any) => u.conversation_id === conv.id);
          
          conversationItems.push({
            id: conv.id,
            type: 'direct',
            name: otherParticipant?.full_name || 'Unknown User',
            avatar: otherParticipant?.avatar_url,
            lastMessage: conv.last_message?.[0]?.content,
            lastMessageTime: conv.last_message_at,
            unreadCount: unread?.unread_count || 0,
            isOnline: false, // Will be updated by presence
          });
        });
      }

      // Process rooms
      if (roomsResult.data) {
        roomsResult.data.forEach((roomMember: any) => {
          const room = roomMember.room;
          const unread = unreadResult.find((u: any) => u.room_id === room.id);
          
          conversationItems.push({
            id: room.id,
            type: 'room',
            name: room.name,
            avatar: room.room_avatar_url,
            lastMessage: '', // Will be populated from last message
            lastMessageTime: room.updated_at,
            unreadCount: unread?.unread_count || 0,
            roomType: room.room_type,
            category: room.category,
            memberRole: roomMember.role,
          });
        });
      }

      // Sort by last message time
      conversationItems.sort((a, b) => 
        new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
      );

      setConversations(conversationItems);
      setUnreadCounts(unreadResult);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    }
  }, [user?.id]);

  useEffect(() => {
    loadConversations().finally(() => setIsLoading(false));
  }, [loadConversations]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadConversations();
    setIsRefreshing(false);
  }, [loadConversations]);

  // Create new room
  const handleCreateRoom = useCallback(async (roomData: any) => {
    if (!user?.id) return;

    try {
      const { data, error } = await createChatRoom(
        roomData.name,
        roomData.description,
        roomData.roomType,
        roomData.category,
        roomData.isPrivate,
        user.id
      );

      if (error) throw error;

      // Refresh conversations list
      await loadConversations();
      
      Alert.alert('Success', 'Room created successfully!');
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }, [user?.id, loadConversations]);

  // Filter conversations based on search and tab
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'direct' && conv.type === 'direct') ||
      (activeTab === 'rooms' && conv.type === 'room');
    
    return matchesSearch && matchesTab;
  });

  // Navigate to chat
  const handleConversationPress = useCallback((conversation: ConversationItem) => {
    if (conversation.type === 'direct') {
      router.push(`/chat/${conversation.id}`);
    } else {
      router.push(`/chat/${conversation.id}`);
    }
  }, [router]);

  // Render conversation item
  const renderConversationItem = useCallback(({ item }: { item: ConversationItem }) => {
    const getRoleIcon = () => {
      switch (item.memberRole) {
        case 'owner': return <Crown size={14} color={colors.warning} />;
        case 'admin': return <Shield size={14} color={colors.primary} />;
        case 'moderator': return <User size={14} color={colors.success} />;
        default: return null;
      }
    };

    const getRoomIcon = () => {
      if (item.type === 'direct') return <MessageCircle size={20} color={colors.textSecondary} />;
      
      switch (item.roomType) {
        case 'group': return <Users size={20} color={colors.textSecondary} />;
        case 'support': return <MessageCircle size={20} color={colors.textSecondary} />;
        case 'community': return <Globe size={20} color={colors.textSecondary} />;
        case 'announcement': return <Hash size={20} color={colors.textSecondary} />;
        default: return <MessageCircle size={20} color={colors.textSecondary} />;
      }
    };

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { borderBottomColor: colors.border }]}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.conversationAvatar}>
          {getRoomIcon()}
          {item.isOnline && item.type === 'direct' && (
            <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.conversationTitleRow}>
              <Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.type === 'room' && getRoleIcon()}
            </View>
            {item.lastMessageTime && (
              <Text style={[styles.conversationTime, { color: colors.textSecondary }]}>
                {new Date(item.lastMessageTime).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.conversationFooter}>
            <Text 
              style={[styles.conversationMessage, { color: colors.textSecondary }]} 
              numberOfLines={1}
            >
              {item.lastMessage || 'No messages yet'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.unreadCount, { color: colors.background }]}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [colors, handleConversationPress]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading conversations...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Bell size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchText, { color: colors.text }]}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {[
          { key: 'all', label: 'All' },
          { key: 'direct', label: 'Direct' },
          { key: 'rooms', label: 'Rooms' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? colors.primary : colors.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderConversationItem}
        style={styles.conversationsList}
        contentContainerStyle={styles.conversationsContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageCircle size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No conversations yet
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Start a conversation or create a room to get started
            </Text>
          </View>
        }
      />

      {/* Create Room Modal */}
      <CreateRoomModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateRoom={handleCreateRoom}
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  conversationsList: {
    flex: 1,
  },
  conversationsContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 12,
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancelButton: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCreateButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    minWidth: 120,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleText: {
    marginLeft: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  toggleIndicatorActive: {
    alignSelf: 'flex-end',
  },
});
