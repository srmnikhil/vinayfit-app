import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useRef, useEffect } from 'react';
import { realtimeService } from './realtimeService';

export interface Message {
  id: string;
  conversation_id?: string;
  room_id?: string;
  sender_id: string;
  recipient_id?: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system' | 'workout_share' | 'meal_share' | 'progress_photo';
  attachments: any[];
  metadata: any;
  reply_to_id?: string;
  parent_message_id?: string;
  parent_message?: {
    id: string;
    content: string;
    sender: {
      id: string;
      full_name: string;
    };
  };
  created_at: string;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  room_type: 'direct' | 'group' | 'support' | 'announcement' | 'community';
  category: 'general' | 'training' | 'nutrition' | 'admin' | 'hr' | 'support' | 'community';
  is_private: boolean;
  max_members: number;
  created_by?: string;
  room_avatar_url?: string;
  room_settings: any;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
  permissions: any;
  joined_at: string;
  last_read_at: string;
  notification_settings: any;
  is_pinned: boolean;
  custom_nickname?: string;
}

// Direct message functions
export async function getOrCreateConversation(userId1: string, userId2: string) {
  try {
    // First, try to find an existing conversation
    const { data: existingConversation, error: findError } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:participant1_id(id, full_name, avatar_url),
        participant2:participant2_id(id, full_name, avatar_url)
      `)
      .or(`and(participant1_id.eq.${userId1},participant2_id.eq.${userId2}),and(participant1_id.eq.${userId2},participant2_id.eq.${userId1})`)
      .single();

    if (existingConversation) {
      return { data: existingConversation, error: null };
    }

    // If no existing conversation, create a new one
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert([
        {
          participant1_id: userId1,
          participant2_id: userId2,
          last_message_at: new Date().toISOString()
        }
      ])
      .select(`
        *,
        participant1:participant1_id(id, full_name, avatar_url),
        participant2:participant2_id(id, full_name, avatar_url)
      `)
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      return { data: null, error: createError };
    }

    return { data: newConversation, error: null };
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    return { data: null, error };
  }
}

/**
 * Sends a message in a conversation with proper validation and security
 * @param conversationId - UUID of the conversation
 * @param senderId - UUID of the message sender
 * @param recipientId - UUID of the message recipient
 * @param content - Message content
 * @param messageType - Type of message (default: 'text')
 * @param attachments - Array of attachments (default: [])
 * @param metadata - Additional metadata (default: {})
 * @param replyToId - ID of the message being replied to (optional)
 * @returns Object containing the sent message or an error
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  recipientId: string,
  content: string,
  messageType: Message['message_type'] = 'text',
  attachments: any[] = [],
  metadata: any = {},
  parentMessageId?: string
) {
  try {
    // Input validation
    if (!conversationId || !senderId || !recipientId || !content) {
      throw new Error('Missing required message fields');
    }

    // Ensure attachments is always an array
    const safeAttachments = Array.isArray(attachments) ? attachments : [];

    // Call the secure database function
    const { data, error } = await supabase.rpc('send_message_with_status', {
      p_conversation_id: conversationId,
      p_sender_id: senderId,
      p_recipient_id: recipientId,
      p_content: content,
      p_message_type: messageType,
      p_attachments: safeAttachments,
      p_metadata: metadata,
      p_parent_message_id: parentMessageId,
    });

    if (error) {
      console.error('Error sending message:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to send message') 
    };
  }
}

export async function sendRoomMessage(
  roomId: string,
  senderId: string,
  content: string,
  messageType: Message['message_type'] = 'text',
  attachments: any[] = [],
  metadata: any = {},
  replyToId?: string
) {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        room_id: roomId,
        sender_id: senderId,
        content,
        message_type: messageType,
        attachments,
        metadata,
        reply_to_id: replyToId
      }
    ])
    .select()
    .single();
  
  return { data, error };
}

export const fetchMessages = async (conversationId: string, timestamp?: number) => {
    console.log(`[fetchMessages] Starting fetch for conversation: ${conversationId}`);
    console.log(`[fetchMessages] Timestamp: ${timestamp}`);
    
    if (!conversationId) {
      const error = new Error('No conversationId provided');
      console.error('[fetchMessages] Error:', error.message);
      return { data: null, error };
    }

  try {
    const queryParams = new URLSearchParams();
    if (timestamp) {
      queryParams.append('_t', timestamp.toString());
    }
    
    console.log('[fetchMessages] Executing Supabase query...');
    const { data, error, status, statusText } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, full_name, avatar_url),
        recipient:profiles!recipient_id(id, full_name, avatar_url),
        reply_to:messages!reply_to_id(id, content, sender_id)
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    console.log(`[fetchMessages] Query completed. Status: ${status} (${statusText})`);
    
    if (error) {
      console.error('[fetchMessages] Supabase query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return { data: null, error };
    }
    
    console.log(`[fetchMessages] Retrieved ${data?.length || 0} messages`);
    
    if (data && data.length > 0) {
      console.log('[fetchMessages] First message sample:', {
        id: data[0].id,
        content: data[0].content?.substring(0, 50) + (data[0].content?.length > 50 ? '...' : ''),
        sender_id: data[0].sender_id,
        created_at: data[0].created_at
      });
    } else {
      console.log('[fetchMessages] No messages found for this conversation');
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('[fetchMessages] Error in fetchMessages:', error);
    return { data: null, error };
  }
};

export async function fetchRoomMessages(roomId: string, limit: number = 50, offset: number = 0) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id(id, full_name, avatar_url),
      reply_to:messages!reply_to_id(id, content, sender_id)
    `)
    .eq('room_id', roomId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);
  
  return { data, error };
}

// Room management functions
export async function createChatRoom(
  name: string,
  description: string,
  roomType: ChatRoom['room_type'],
  category: ChatRoom['category'],
  isPrivate: boolean,
  createdBy: string,
  maxMembers: number = 100
): Promise<{ data: ChatRoom | null; error: any }> {
  const { data, error } = await supabase
    .from('chat_rooms')
    .insert([
      {
        name,
        description,
        room_type: roomType,
        category,
        is_private: isPrivate,
        created_by: createdBy,
        max_members: maxMembers
      }
    ])
    .select()
    .single();
  
  if (data && !error) {
    // Add creator as owner
    await addRoomMember(data.id, createdBy, 'owner');
  }
  
  return { data, error };
}

export async function addRoomMember(
  roomId: string,
  userId: string,
  role: RoomMember['role'] = 'member'
): Promise<{ data: RoomMember | null; error: any }> {
  const permissions = {
    can_send_messages: true,
    can_add_members: role === 'owner' || role === 'admin',
    can_remove_members: role === 'owner' || role === 'admin',
    can_edit_room: role === 'owner'
  };

  const { data, error } = await supabase
    .from('room_members')
    .insert([
      {
        room_id: roomId,
        user_id: userId,
        role,
        permissions
      }
    ])
    .select()
    .single();
  
  return { data, error };
}

export async function getUserRooms(userId: string): Promise<{ data: any[] | null; error: any }> {
  const { data, error } = await supabase
    .from('room_members')
    .select(`
      *,
      room:chat_rooms(
        *,
        created_by:profiles!chat_rooms_created_by_fkey(id, full_name, avatar_url)
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });
  
  return { data, error };
}

export async function getRoomMembers(roomId: string): Promise<{ data: any[] | null; error: any }> {
  const { data, error } = await supabase
    .from('room_members')
    .select(`
      *,
      user:profiles!room_members_user_id_fkey(id, full_name, avatar_url, role)
    `)
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
  
  return { data, error };
}

// Message reactions
export async function addMessageReaction(messageId: string, userId: string, reactionType: string) {
  const { data, error } = await supabase
    .from('message_reactions')
    .insert([
      {
        message_id: messageId,
        user_id: userId,
        reaction_type: reactionType
      }
    ])
    .select()
    .single();
  
  return { data, error };
}

export async function removeMessageReaction(messageId: string, userId: string, reactionType: string) {
  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType);
  
  return { error };
}

// Message editing and deletion
export async function editMessage(messageId: string, newContent: string, userId: string) {
  const { data, error } = await supabase
    .from('messages')
    .update({
      content: newContent,
      edited_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .eq('sender_id', userId)
    .select()
    .single();
  
  return { data, error };
}

export async function deleteMessage(messageId: string, userId: string) {
  const { data, error } = await supabase
    .from('messages')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .eq('sender_id', userId)
    .select()
    .single();
  
  return { data, error };
}

// Simplified realtime message hook
export function useRealtimeMessages(conversationId: string, onNewMessage: (msg: any) => void) {
  // Use ref to keep track of the latest callback
  const callbackRef = useRef(onNewMessage);
  
  // Update the ref when onNewMessage changes
  useEffect(() => {
    callbackRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    if (!conversationId) return;
    
    console.log(`[useRealtimeMessages] Setting up for consultation: ${conversationId}`);
    
    // Handle new messages
    const handleNewMessage = (message: any) => {
      if (!message || !message.id) return;
      
      try {
        // Ensure we have required fields
        const processedMessage = {
          ...message,
          created_at: message.created_at || new Date().toISOString(),
          updated_at: message.updated_at || new Date().toISOString(),
          // Ensure we have a valid timestamp for sorting
          timestamp: message.created_at || new Date().toISOString()
        };
        
        // Use the latest callback
        if (typeof callbackRef.current === 'function') {
          callbackRef.current(processedMessage);
        }
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    };
    
    // Subscribe to the conversation
    const channel = realtimeService.subscribeToConversation(
      conversationId,
      handleNewMessage,
      undefined // onTyping callback is optional
    );
    
    // Cleanup function
    return () => {
      if (channel) {
        console.log(`[useRealtimeMessages] Cleaning up: ${conversationId}`);
        realtimeService.unsubscribe(`conversation_${conversationId}`);
      }
    };
  }, [conversationId]); // Only depend on consultationId
}

export function useRealtimeRoomMessages(
  roomId: string, 
  onNewMessage: (msg: any) => void,
  onTyping?: (typing: any) => void,
  onMemberChange?: (member: any) => void
) {
  useEffect(() => {
    if (!roomId) return;
    
    const channel = realtimeService.subscribeToRoom(
      roomId,
      onNewMessage,
      onTyping,
      onMemberChange
    );
    
    return () => {
      realtimeService.unsubscribe(`room_${roomId}`);
    };
  }, [roomId, onNewMessage, onTyping, onMemberChange]);
}

export function useRealtimePresence(onPresenceChange: (presence: any) => void) {
  useEffect(() => {
    // This would be handled by the realtime service initialization
    // The presence changes are automatically tracked
    return () => {
      // Cleanup handled by realtime service
    };
  }, [onPresenceChange]);
}

// Utility functions
export async function getUnreadMessageCounts(userId: string) {
  return await realtimeService.getUnreadCounts();
}

export async function markConversationAsRead(conversationId: string, userId: string) {
  if (!userId || !conversationId) return;

  try {
    // Call the new database function to update the timestamp
    const { error } = await supabase.rpc('update_last_read_timestamp', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error updating last read timestamp:', error);
    }
  } catch (error) {
    console.error('Failed to mark conversation as read:', error);
  }
}

export async function markRoomAsRead(roomId: string, userId: string) {
  return await realtimeService.markMessagesAsRead(roomId);
}

export async function sendTypingIndicator(conversationId?: string, roomId?: string, isTyping: boolean = true) {
  return await realtimeService.sendTypingIndicator(conversationId, roomId, isTyping);
}

// Search and filter functions
export async function searchMessages(query: string, conversationId?: string, roomId?: string) {
  let queryBuilder = supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
    `)
    .ilike('content', `%${query}%`)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (conversationId) {
    queryBuilder = queryBuilder.eq('conversation_id', conversationId);
  }
  
  if (roomId) {
    queryBuilder = queryBuilder.eq('room_id', roomId);
  }

  const { data, error } = await queryBuilder;
  return { data, error };
}

export async function getConversationsList(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participant1:participant1_id(id, full_name, avatar_url),
      participant2:participant2_id(id, full_name, avatar_url),
      last_message:messages!id(content, created_at, sender_id)
    `)
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
    .eq('is_archived', false)
    .order('last_message_at', { ascending: false });

  return { data, error };
}
