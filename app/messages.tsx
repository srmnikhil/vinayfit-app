import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Search,
  MessageSquare,
  Send,
  Phone,
  Video,
  MoreHorizontal
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

interface Message {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
}

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  const messages: Message[] = [
    {
      id: '1',
      clientId: 'client-1',
      clientName: 'Sarah Johnson',
      clientAvatar: '👩‍💼',
      lastMessage: 'Thanks for the workout plan! When should I start?',
      timestamp: '2 min ago',
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: '2',
      clientId: 'client-2',
      clientName: 'Mike Chen',
      clientAvatar: '👨‍💻',
      lastMessage: 'Great session today! Feeling stronger already.',
      timestamp: '1 hour ago',
      unreadCount: 0,
      isOnline: true,
    },
    {
      id: '3',
      clientId: 'client-3',
      clientName: 'Emma Wilson',
      clientAvatar: '👩‍🎨',
      lastMessage: 'Can we reschedule tomorrow\'s session?',
      timestamp: '3 hours ago',
      unreadCount: 1,
      isOnline: false,
    },
    {
      id: '4',
      clientId: 'client-4',
      clientName: 'Alex Rodriguez',
      clientAvatar: '👨‍🎯',
      lastMessage: 'The new nutrition plan is working great!',
      timestamp: 'Yesterday',
      unreadCount: 0,
      isOnline: false,
    },
    {
      id: '5',
      clientId: 'client-5',
      clientName: 'Lisa Park',
      clientAvatar: '👩‍🔬',
      lastMessage: 'Question about the deadlift form...',
      timestamp: '2 days ago',
      unreadCount: 3,
      isOnline: true,
    },
  ];

  const filteredMessages = messages.filter(message =>
    message.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMessagePress = (message: Message) => {
    router.push(`/chat/${message.clientId}`);
  };

  const handleCallClient = (message: Message) => {
    console.log('Call client:', message.clientName);
  };

  const handleVideoCall = (message: Message) => {
    console.log('Video call client:', message.clientName);
  };

  const renderMessageItem = (message: Message) => (
    <TouchableOpacity
      key={message.id}
      style={styles.messageItem}
      onPress={() => handleMessagePress(message)}
    >
      <View style={styles.messageLeft}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{message.clientAvatar}</Text>
          {message.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.messageInfo}>
          <View style={styles.messageHeader}>
            <Text style={styles.clientName}>{message.clientName}</Text>
            <Text style={styles.timestamp}>{message.timestamp}</Text>
          </View>
          <Text 
            style={[
              styles.lastMessage,
              message.unreadCount > 0 && styles.unreadMessage
            ]} 
            numberOfLines={1}
          >
            {message.lastMessage}
          </Text>
        </View>
      </View>
      
      <View style={styles.messageRight}>
        {message.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{message.unreadCount}</Text>
          </View>
        )}
        
        <View style={styles.messageActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleCallClient(message)}
          >
            <Phone size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleVideoCall(message)}
          >
            <Video size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const totalUnread = messages.reduce((sum, message) => sum + message.unreadCount, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Messages</Text>
          {totalUnread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <MoreHorizontal size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
            All ({messages.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'unread' && styles.activeTab]}
          onPress={() => setSelectedTab('unread')}
        >
          <Text style={[styles.tabText, selectedTab === 'unread' && styles.activeTabText]}>
            Unread ({totalUnread})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'online' && styles.activeTab]}
          onPress={() => setSelectedTab('online')}
        >
          <Text style={[styles.tabText, selectedTab === 'online' && styles.activeTabText]}>
            Online ({messages.filter(m => m.isOnline).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No messages found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search query' : 'Start a conversation with your clients'}
            </Text>
          </View>
        ) : (
          filteredMessages.map(renderMessageItem)
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  headerBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    fontSize: 24,
    width: 48,
    height: 48,
    textAlign: 'center',
    lineHeight: 48,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    backgroundColor: colors.success,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  messageInfo: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  timestamp: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  lastMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  unreadMessage: {
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
  },
  messageRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  messageActions: {
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