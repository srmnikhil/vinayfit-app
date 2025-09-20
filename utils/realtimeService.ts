import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UserPresence {
  user_id: string;
  status: 'online' | 'offline' | 'away' | 'busy' | 'invisible';
  last_seen: string;
  current_activity?: string;
  location_context?: string;
  is_available_for_chat: boolean;
  custom_status_message?: string;
}

export interface TypingIndicator {
  user_id: string;
  conversation_id?: string;
  room_id?: string;
  is_typing: boolean;
  started_typing_at: string;
}

export interface BroadcastMessage {
  id: string;
  channel_id: string;
  title: string;
  content: string;
  message_data: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  sent_at: string;
}

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private presenceChannel: RealtimeChannel | null = null;
  private currentUserId: string | null = null;

  // Initialize the realtime service
  async initialize(userId: string) {
    this.currentUserId = userId;
    await this.setupPresenceTracking();
    await this.setupBroadcastChannels();
  }

  // Setup presence tracking
  private async setupPresenceTracking() {
    if (!this.currentUserId) return;

    this.presenceChannel = supabase.channel('user_presence', {
      config: {
        presence: {
          key: this.currentUserId,
        },
      },
    });

    // Track presence changes
    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = this.presenceChannel?.presenceState();
        console.log('Presence sync:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Set initial presence
          await this.updatePresence('online');
        }
      });
  }

  // Setup broadcast channels for system announcements
  private async setupBroadcastChannels() {
    const broadcastChannel = supabase.channel('system_broadcasts');

    broadcastChannel
      .on('broadcast', { event: 'announcement' }, (payload) => {
        console.log('System announcement:', payload);
        this.handleBroadcastMessage(payload.payload as BroadcastMessage);
      })
      .on('broadcast', { event: 'emergency' }, (payload) => {
        console.log('Emergency alert:', payload);
        this.handleEmergencyAlert(payload.payload);
      })
      .subscribe();

    this.channels.set('system_broadcasts', broadcastChannel);
  }

  // Update user presence
  async updatePresence(
    status: UserPresence['status'],
    activity?: string,
    location?: string,
    customMessage?: string
  ) {
    if (!this.currentUserId) return;

    try {
      // Update database
      const { error } = await supabase.rpc('update_user_presence', {
        p_user_id: this.currentUserId,
        p_status: status,
        p_activity: activity,
        p_location: location,
        p_custom_message: customMessage,
      });

      if (error) {
        console.error('Error updating presence:', error);
        return;
      }

      // Update realtime presence
      if (this.presenceChannel) {
        await this.presenceChannel.track({
          user_id: this.currentUserId,
          status,
          current_activity: activity,
          location_context: location,
          custom_status_message: customMessage,
          last_seen: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  // Subscribe to conversation messages - simplified version
  subscribeToConversation(
    conversationId: string,
    onMessage: (message: any) => void,
    onTyping?: (typing: TypingIndicator) => void
  ) {
    const channelName = `conversation_${conversationId}`;
    
    // Clean up existing channel if it exists
    if (this.channels.has(channelName)) {
      const existingChannel = this.channels.get(channelName);
      if (existingChannel) {
        try {
          supabase.removeChannel(existingChannel);
        } catch (error) {
          console.error('Error removing existing channel:', error);
        }
      }
      this.channels.delete(channelName);
    }

    console.log(`[Realtime] Creating new channel for conversation: ${conversationId}`);
    
    // Create a new channel
    const channel = supabase.channel(channelName);
    
    // Handle message events
    const messageHandler = (payload: any) => {
      try {
        if (payload?.new && onMessage) {
          onMessage(payload.new);
        }
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    };

    // Handle typing events
    const typingHandler = (payload: any) => {
      try {
        if (payload?.new && onTyping) {
          onTyping(payload.new);
        }
      } catch (error) {
        console.error('Error in typing handler:', error);
      }
    };

    try {
      // Set up message listeners
      const messageSubscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages', 
            filter: `conversation_id=eq.${conversationId}` 
          },
          (payload) => messageHandler(payload)
        )
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'messages', 
            filter: `conversation_id=eq.${conversationId}` 
          },
          (payload) => messageHandler(payload)
        );

      // Set up typing indicator listener if callback is provided
      if (onTyping) {
        messageSubscription.on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'typing_indicators', 
            filter: `conversation_id=eq.${conversationId}` 
          },
          (payload) => typingHandler(payload)
        );
      }

      // Subscribe to the channel
      messageSubscription.subscribe((status) => {
        console.log(`[Realtime] Subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Successfully subscribed to ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error');
        } else if (status === 'TIMED_OUT') {
          console.error('[Realtime] Connection timed out');
        } else if (status === 'CLOSED') {
          console.log('[Realtime] Channel closed');
        }
      });

      // Store the subscription
      this.channels.set(channelName, messageSubscription);
      return messageSubscription;
    } catch (error) {
      console.error('[Realtime] Error setting up subscription:', error);
      throw error;
    }

    this.channels.set(channelName, channel);
    return channel;
  }

  // Subscribe to room messages
  subscribeToRoom(
    roomId: string,
    onMessage: (message: any) => void,
    onTyping?: (typing: TypingIndicator) => void,
    onMemberChange?: (member: any) => void
  ) {
    const channelName = `room_${roomId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          onMessage(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          onMessage(payload.new);
        }
      );

    // Subscribe to typing indicators
    if (onTyping) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.new) {
            onTyping(payload.new as TypingIndicator);
          }
        }
      );
    }

    // Subscribe to member changes
    if (onMemberChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          onMemberChange(payload.new || payload.old);
        }
      );
    }

    channel.subscribe();
    this.channels.set(channelName, channel);
    return channel;
  }

  // Subscribe to message reactions
  subscribeToMessageReactions(
    messageId: string,
    onReaction: (reaction: any) => void
  ) {
    const channelName = `reactions_${messageId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`,
        },
        (payload) => {
          onReaction({
            event: payload.eventType,
            reaction: payload.new || payload.old,
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Send typing indicator
  async sendTypingIndicator(
    conversationId?: string,
    roomId?: string,
    isTyping: boolean = true
  ) {
    if (!this.currentUserId) return;

    try {
      const now = new Date().toISOString();
      const identifier = conversationId ? { conversation_id: conversationId } : { room_id: roomId };
      
      if (isTyping) {
        // Upsert the typing indicator
        const { error } = await supabase
          .from('typing_indicators')
          .upsert(
            {
              ...identifier,
              user_id: this.currentUserId,
              is_typing: true,
              last_typing_at: now,
              // Conditionally set started_typing_at on insert
              started_typing_at: now, 
            },
            {
              onConflict: conversationId ? 'conversation_id,user_id' : 'room_id,user_id',
            }
          );

        if (error) throw error;
      } else {
        // Remove the typing indicator
        const { error } = await supabase
          .from('typing_indicators')
          .delete()
          .match({ ...identifier, user_id: this.currentUserId });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  // Send broadcast message (admin only)
  async sendBroadcast(
    channelName: string,
    event: string,
    payload: any,
    targetUsers?: string[]
  ) {
    try {
      const channel = this.channels.get('system_broadcasts');
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event,
          payload: {
            ...payload,
            target_users: targetUsers,
            sent_at: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
    }
  }

  // Get online users in a room
  async getOnlineRoomMembers(roomId: string): Promise<UserPresence[]> {
    try {
      const { data, error } = await supabase.rpc('get_online_room_members', {
        p_room_id: roomId,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting online room members:', error);
      return [];
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, roomId?: string) {
    if (!this.currentUserId) return;

    try {
      const { error } = await supabase.rpc('mark_messages_as_read', {
        p_user_id: this.currentUserId,
        p_conversation_id: conversationId,
        p_room_id: roomId,
      });

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Get unread message counts
  async getUnreadCounts(): Promise<any[]> {
    if (!this.currentUserId) return [];

    try {
      const { data, error } = await supabase.rpc('get_unread_counts', {
        p_user_id: this.currentUserId,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting unread counts:', error);
      return [];
    }
  }

  // Handle broadcast messages
  private handleBroadcastMessage(message: BroadcastMessage) {
    // Emit custom event for the app to handle
    const event = new CustomEvent('broadcast_message', {
      detail: message,
    });
    window.dispatchEvent(event);
  }

  // Handle emergency alerts
  private handleEmergencyAlert(alert: any) {
    // Emit custom event for emergency alerts
    const event = new CustomEvent('emergency_alert', {
      detail: alert,
    });
    window.dispatchEvent(event);
  }

  // Unsubscribe from a channel
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();

    if (this.presenceChannel) {
      supabase.removeChannel(this.presenceChannel);
      this.presenceChannel = null;
    }
  }

  // Cleanup on app close/logout
  async cleanup() {
    if (this.currentUserId) {
      await this.updatePresence('offline');
    }
    this.unsubscribeAll();
    this.currentUserId = null;
  }
}

export const realtimeService = new RealtimeService();
