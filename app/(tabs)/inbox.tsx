import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MessageSquare, Bell, Trophy, Calendar, TrendingUp, Heart, Clock, CircleCheck as CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';

const messages = [
  {
    id: 1,
    type: 'motivation',
    title: "You're doing great!",
    message: "You've completed 3 workouts this week. Keep up the momentum!",
    time: '2 hours ago',
    read: false,
    icon: Trophy,
    color: '#F59E0B',
  },
  {
    id: 2,
    type: 'reminder',
    title: 'Time for your workout',
    message: "Don't forget about your scheduled Full Body Strength session at 6 PM.",
    time: '4 hours ago',
    read: false,
    icon: Clock,
    color: '#6366F1',
  },
  {
    id: 3,
    type: 'achievement',
    title: 'New Achievement Unlocked!',
    message: "Congratulations! You've earned the 'First Workout' badge.",
    time: '1 day ago',
    read: true,
    icon: Trophy,
    color: '#10B981',
  },
  {
    id: 4,
    type: 'health',
    title: 'Weekly Health Summary',
    message: 'Your activity has increased by 15% compared to last week.',
    time: '2 days ago',
    read: true,
    icon: TrendingUp,
    color: '#EF4444',
  },
  {
    id: 5,
    type: 'social',
    title: 'Friend Activity',
    message: 'Sarah completed a 45-minute yoga session. Send her some encouragement!',
    time: '3 days ago',
    read: true,
    icon: Heart,
    color: '#EC4899',
  },
];

export default function InboxView() {
  const colorScheme = useColorScheme();
  // const colors = getColors(colorScheme);
    const colors = getColors(colorScheme ?? 'light');
  
  const styles = createStyles(colors);

  const [selectedFilter, setSelectedFilter] = useState('all');
  
  const unreadCount = messages.filter(m => !m.read).length;
  
  const filters = [
    { id: 'all', label: 'All', count: messages.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'motivation', label: 'Motivation', count: messages.filter(m => m.type === 'motivation').length },
    { id: 'reminders', label: 'Reminders', count: messages.filter(m => m.type === 'reminder').length },
  ];

  const filteredMessages = messages.filter(message => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unread') return !message.read;
    if (selectedFilter === 'motivation') return message.type === 'motivation';
    if (selectedFilter === 'reminders') return message.type === 'reminder';
    return true;
  });

  const markAsRead = (messageId: number) => {
    // In a real app, this would update the message state
    console.log('Mark message as read:', messageId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
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
            {filter.count > 0 && (
              <View style={[
                styles.filterCount,
                selectedFilter === filter.id && styles.activeFilterCount
              ]}>
                <Text style={[
                  styles.filterCountText,
                  selectedFilter === filter.id && styles.activeFilterCountText
                ]}>
                  {filter.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false}>
        {filteredMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No messages</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'unread' 
                ? "You're all caught up! No unread messages."
                : "Your inbox is empty. Messages will appear here."}
            </Text>
          </View>
        ) : (
          filteredMessages.map((message) => {
            const IconComponent = message.icon;
            return (
              <TouchableOpacity
                key={message.id}
                style={[styles.messageCard, !message.read && styles.unreadMessage]}
                onPress={() => markAsRead(message.id)}
              >
                <View style={[styles.messageIcon, { backgroundColor: `${message.color}15` }]}>
                  <IconComponent size={20} color={message.color} />
                </View>
                
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <Text style={[
                      styles.messageTitle,
                      !message.read && styles.unreadTitle
                    ]}>
                      {message.title}
                    </Text>
                    <Text style={styles.messageTime}>{message.time}</Text>
                  </View>
                  
                  <Text style={styles.messageText} numberOfLines={2}>
                    {message.message}
                  </Text>
                </View>
                
                {!message.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
   
  filterContainer: {
    marginTop: 16,
    marginBottom: 8,
    maxHeight: 50, // This allows natural sizing up to 50px
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
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
  filterCount: {
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  activeFilterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterCountText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: colors.textSecondary,
  },
  activeFilterCountText: {
    color: '#FFFFFF',
  },
  messagesList: {
    flex: 1,
  },
  messageCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadMessage: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  messageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  messageTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontFamily: 'Inter-Bold',
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
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
