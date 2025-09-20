import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Dimensions,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import {
  fetchMessages,
  sendMessage,
  useRealtimeMessages,
  markConversationAsRead,
  sendTypingIndicator,
  addMessageReaction,
  Message
} from '../../utils/chatService';
import { realtimeService } from '../../utils/realtimeService';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, uploadImage } from '../../lib/supabase';
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Check,
  AlertCircle,
  RefreshCw,
  Reply,
  Plus,
  Camera,
  Image as ImageIcon,
  Mic,
  FileText,
  Video,
  Play,
  Pause,
  X
} from 'lucide-react-native';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { VoiceRecorder, VoicePlayer } from '../../components/chat/index';
import BottomSheet from '../../components/BottomSheet';
import CameraMedia from '../../components/chat/media/CameraMedia';
import PhotoMedia from '../../components/chat/media/PhotoMedia';
import VideoMedia from '../../components/chat/media/VideoMedia';
import FileMedia from '../../components/chat/media/FileMedia';
import DocumentMedia from '../../components/chat/media/DocumentMedia';
import { MediaItem, MediaType } from '../../components/chat/media/types';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// Import for video thumbnail and player
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Audio, Video as ExpoVideo } from 'expo-av'; // Import Audio

const { width: screenWidth } = Dimensions.get('window');

interface EnhancedMessage extends Message {
  conversation_id?: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  recipient?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  reactions?: Array<{
    id: string;
    reaction_type: string;
    user_id: string;
    created_at: string;
  }>;
  is_edited?: boolean;
  parent_message?: EnhancedMessage;
}

interface TypingUser {
  user_id: string;
  full_name?: string;
}

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  created_at: string;
  last_message_at: string;
  participant1_last_read_at: string | null;
  participant2_last_read_at: string | null;
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuth();
  const userId = user?.id;

  // Chat state
  const [recipientId, setRecipientId] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [recipientInfo, setRecipientInfo] = useState<any>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<EnhancedMessage | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Media and attachment states
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false); // State for recording status from VoiceRecorder
  const [recordingTime, setRecordingTime] = useState(0); // State for recording duration from VoiceRecorder
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Media component states
  const [activeMediaTab, setActiveMediaTab] = useState<string>('photo');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  // Animation values
  const recordingAnimation = useRef(new Animated.Value(0)).current;
  const attachmentAnimation = useRef(new Animated.Value(0)).current;

  // Theme and online status
  const theme = useColorScheme() || 'light';
  const colors = getColors(theme);
  const [onlineStatus, setOnlineStatus] = useState<string>('offline');

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  // Message sent sound
  const [messageSentSound, setMessageSentSound] = useState<Audio.Sound | null>(null);

  // Load message sent sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/message-sent.mp3') // Ensure this path is correct and the file exists
        );
        setMessageSentSound(sound);
      } catch (error) {
        console.error('Error loading message sent sound:', error);
      }
    };

    loadSound();

    return () => {
      if (messageSentSound) {
        messageSentSound.unloadAsync();
      }
    };
  }, []);


  // Initialize realtime service
  useEffect(() => {
    if (userId) {
      realtimeService.initialize(userId);

      // Update presence to online
      realtimeService.updatePresence('online', 'chatting');

      return () => {
        realtimeService.updatePresence('offline');
      };
    }
  }, [userId]);

  // Helper function to fetch recipient info
  const fetchRecipientInfo = async (recipientId: string) => {
    const { data: recipientData } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', recipientId)
      .single();

    if (recipientData) {
      setRecipientInfo(recipientData);
    }
  };

  // Get conversation details and recipient info
  useEffect(() => {
    const fetchConversationDetails = async () => {
      if (!conversationId || !userId) {
        return;
      }

      try {
        setIsLoading(true);

        // If the ID is a valid UUID, treat it as a conversation ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (uuidRegex.test(conversationId)) {
          // This is an existing conversation, fetch its details
          const { data: conversationData, error: conversationError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single();

          if (conversationError) {
            if (conversationError.code === 'PGRST116') {
              // No conversation found, treat it as a new conversation with the ID as recipient
              console.log('No conversation found, treating as new conversation with user ID:', conversationId);
              const recipientId = conversationId;
              setRecipientId(recipientId);
              await fetchRecipientInfo(recipientId);

              // Get or create conversation
              const { data: rpcData, error } = await supabase
                .rpc('get_or_create_conversation', {
                  user_id_1: userId,
                  user_id_2: recipientId,
                })
                .single();

              if (error) throw error;

              if (rpcData) {
                const newConversation = rpcData as Conversation;
                setConversation(newConversation);
                if (newConversation.id !== conversationId) {
                  router.replace(`/chat/${newConversation.id}`);
                }
                await markConversationAsRead(newConversation.id, userId);
              }
              return;
            }
            throw conversationError;
          }

          if (conversationData) {
            setConversation(conversationData as Conversation);
            // Set the other participant as recipient
            const otherParticipantId =
              conversationData.participant1_id === userId
                ? conversationData.participant2_id
                : conversationData.participant1_id;
            setRecipientId(otherParticipantId);
            await fetchRecipientInfo(otherParticipantId);
            await markConversationAsRead(conversationData.id, userId);
          }
        } else {
          // This is a new conversation with a user ID
          const recipientId = conversationId;
          setRecipientId(recipientId);
          await fetchRecipientInfo(recipientId);

          // Get or create conversation
          const { data: rpcData, error } = await supabase
            .rpc('get_or_create_conversation', {
              user_id_1: userId,
              user_id_2: recipientId,
            })
            .single();

          if (error) throw error;

          if (rpcData) {
            const newConversation = rpcData as Conversation;
            setConversation(newConversation);
            // If we got a different conversation ID, update the URL
            if (newConversation.id !== conversationId) {
              router.replace(`/chat/${newConversation.id}`);
            }
            await markConversationAsRead(newConversation.id, userId);
          }
        }
      } catch (error: any) {
        console.error('Error in fetchConversationDetails:', error);
        Alert.alert('Error', 'Failed to load conversation. Please try again.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversationDetails();
  }, [conversationId, userId]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    console.log('Loading messages for conversation:', conversationId);
    setIsLoading(true);
    try {
      const { data, error } = await fetchMessages(conversationId);
      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} messages at ${new Date().toISOString()}`);

      // Always update with fresh data from server
      if (data) {
        setMessages(data);
      }

      // Mark as read after loading messages
      if (userId) {
        await markConversationAsRead(conversationId, userId);
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, userId]);

  // Load messages on initial mount and when conversationId changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Enhanced focus effect for when the screen comes into view
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, reloading messages...');

      // Small delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        loadMessages();
      }, 100);

      // Mark as read when coming into focus
      if (conversationId && userId) {
        markConversationAsRead(conversationId, userId);
      }

      return () => clearTimeout(timer);
    }, [conversationId, userId, loadMessages])
  );

  // Track temporary message IDs to handle optimistic updates
  const tempMessageIds = useRef<Set<string>>(new Set());

  // Setup realtime message subscription with stable callback
  const handleNewMessage = useCallback((newMessage: EnhancedMessage) => {
    if (!newMessage || !newMessage.id) {
      console.error('❌ Invalid message received:', newMessage);
      return;
    }
    
    // Log the full message for debugging
    console.log('🔄 Processing message:', {
      id: newMessage.id,
      tempId: newMessage.metadata?.tempId,
      content: newMessage.content?.substring(0, 30) + '...',
      type: newMessage.message_type,
      from: newMessage.sender_id === userId ? 'me' : 'other',
      hasMetadata: !!newMessage.metadata,
      metadata: newMessage.metadata
    });
    
    setMessages(prev => {
      console.log('📋 Current messages count:', prev.length);
      
      // If this is a confirmation of a temporary message
      const tempId = newMessage.metadata?.tempId;
      if (tempId) {
        console.log('🔍 Looking for temp message by tempId:', tempId);
        
        // Find the index of the temp message by tempId or direct ID match
        const tempIndex = prev.findIndex(msg => {
          const isMatch = (msg.metadata?.tempId === tempId) || (msg.id === tempId);
          if (isMatch) {
            console.log('🔹 Found potential match:', {
              msgId: msg.id,
              msgTempId: msg.metadata?.tempId,
              content: msg.content?.substring(0, 30) + '...'
            });
          }
          return isMatch;
        });
        
        if (tempIndex !== -1) {
          const tempMessage = prev[tempIndex];
          console.log('✅ Found temp message at index', tempIndex, ':', {
            tempId: tempMessage.metadata?.tempId,
            id: tempMessage.id,
            content: tempMessage.content?.substring(0, 30) + '...'
          });
          
          // Create the confirmed message by merging temp message with server message
          const confirmedMessage: EnhancedMessage = {
            ...tempMessage,         // Keep existing temp message data
            ...newMessage,          // Apply server data (overwrites temp message data)
            id: newMessage.id,      // Use server's ID
            metadata: {
              ...tempMessage.metadata,
              ...newMessage.metadata,
              isSending: false,
              isUploading: false,
              uploadProgress: 100,
              error: undefined,
              tempId: undefined    // Remove tempId since this is now a confirmed message
            }
          };
          
          // Create new array with the updated message
          const updated = [...prev];
          updated[tempIndex] = confirmedMessage;
          
          console.log('🔄 Replaced temp message:', {
            oldId: tempMessage.id,
            newId: confirmedMessage.id,
            oldContent: tempMessage.content?.substring(0, 30) + '...',
            newContent: confirmedMessage.content?.substring(0, 30) + '...'
          });
          
          return updated;
        } else {
          console.log('⚠️ Temp message not found in current messages:', tempId);
          console.log('📋 Current message IDs:', prev.map(m => ({
            id: m.id,
            tempId: m.metadata?.tempId,
            content: m.content?.substring(0, 20) + '...',
            type: m.message_type
          })));
          
          // If temp message not found, add the new message if it's not already in the list
          const messageExists = prev.some(msg => msg.id === newMessage.id);
          console.log('📝 Message exists check:', { messageExists, messageId: newMessage.id });
          
          return messageExists ? prev : [...prev, newMessage];
        }
      }
  
      // For new messages from other users
      console.log('👤 Processing new message from other user');
      const existingIndex = prev.findIndex(msg => msg.id === newMessage.id);
      
      if (existingIndex === -1) {
        console.log('➕ Adding new message to the beginning');
        return [newMessage, ...prev];
      }
      
      console.log('⏩ Message already exists, skipping');
      return prev;
    });
  }, [userId]);
  // Use a ref to store the latest message handler
  const messageHandlerRef = useRef(handleNewMessage);

  // Update the ref when handleNewMessage changes
  useEffect(() => {
    messageHandlerRef.current = handleNewMessage;
  }, [handleNewMessage]);

  // Setup the realtime subscription with a stable callback
  useRealtimeMessages(conversationId, useCallback((message: any) => {
    messageHandlerRef.current?.(message);
  }, []));

  // Subscribe to conversation updates for read receipts
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation-updates:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          setConversation(payload.new as Conversation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Handle typing indicators
  const handleTyping = useCallback((isCurrentlyTyping: boolean) => {
    if (isCurrentlyTyping !== isTyping) {
      setIsTyping(isCurrentlyTyping);
      if (conversationId && recipientId) {
        sendTypingIndicator(conversationId, undefined, isCurrentlyTyping);
      }
    }
  }, [conversationId, isTyping, recipientId]);

  // Handle input change with typing indicators
  const handleInputChange = useCallback((text: string) => {
    setInput(text);

    if (text.length > 0 && !isTyping) {
      handleTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  }, [handleTyping, isTyping]);

  // Handle creating a new conversation
  const handleNewConversation = useCallback(async () => {
    if (!userId || !recipientId) return;

    try {
      setIsLoading(true);

      // Create a new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert([
          {
            participant1_id: userId,
            participant2_id: recipientId,
            created_at: new Date().toISOString(),
            last_message_at: new Date().toISOString()
          }
        ])
        .select('*')
        .single();

      if (convError) throw convError;
      if (!newConversation) throw new Error('Failed to create new conversation');

      // Update the URL with the new conversation ID
      router.replace(`/chat/${newConversation.id}`);

      // Return the new conversation ID
      return newConversation.id;
    } catch (error: any) {
      console.error('Error creating new conversation:', error);
      Alert.alert('Error', 'Failed to create a new conversation. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, recipientId]);

  // Handle sending audio messages
  const handleSendAudio = useCallback(async (audioData: any) => {
    const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let currentConversationId = conversationId;

    if (!userId) {
      console.error('Cannot send message: No user ID');
      Alert.alert('Error', 'You must be logged in to send messages');
      return;
    }

    if (!recipientId) {
      console.error('Cannot send message: No recipient ID');
      Alert.alert('Error', 'No recipient selected. Please try again.');
      return;
    }

    // Create the temporary message for optimistic UI
    const tempMessage: EnhancedMessage = {
      id: tempMessageId,
      conversation_id: currentConversationId,
      sender_id: userId,
      recipient_id: recipientId,
      content: 'Audio message',
      message_type: 'audio',
      attachments: [{
        type: 'audio',
        uri: audioData.uri,
        duration: audioData.duration,
        size: audioData.size,
        name: audioData.name || `audio-${Date.now()}.m4a`,
        url: audioData.uri // Temporary URL for preview
      }],
      metadata: {
        isOptimistic: true,
        tempId: tempMessageId,
        isSending: true
      },
      created_at: new Date().toISOString(),
      is_deleted: false,
      sender: {
        id: userId,
        full_name: user?.user_metadata?.full_name || 'You',
        avatar_url: user?.user_metadata?.avatar_url
      },
      parent_message_id: replyingTo?.id,
      parent_message: replyingTo || undefined,
    };

    // Track this temporary message ID
    tempMessageIds.current.add(tempMessageId);

    // Optimistically update the UI
    console.log('[handleSendAudio] Optimistically adding message:', tempMessage);
    setMessages(prev => [...prev, tempMessage]);
    setInput('');
    setReplyingTo(null);
    setSelectedMedia(null);

    const sendActualMessage = async (conversationIdToUse: string) => {
      try {
        console.log('[handleSendAudio] Sending message to chatService:', { conversationIdToUse, userId, recipientId, tempMessageId });
        const { data: serverMessage, error } = await sendMessage(
          conversationIdToUse,
          userId,
          recipientId,
          'Audio message',
          'audio',
          [{
            type: 'audio',
            uri: audioData.uri,
            duration: audioData.duration,
            size: audioData.size,
            name: audioData.name || `audio-${Date.now()}.m4a`,
            url: audioData.uri
          }],
          { tempId: tempMessageId }, // Pass tempId in metadata
          replyingTo?.id
        );

        if (error) throw error;

        console.log('[handleSendAudio] Message sent successfully via chatService. Server response:', serverMessage);
        if (messageSentSound) {
          await messageSentSound.replayAsync();
        }
        return true;
      } catch (error) {
        console.error('Send audio message error:', error);
        return false;
      }
    };

    const createAndSend = async () => {
      console.log('Creating new conversation for audio message');
      const newConversationId = await handleNewConversation();
      if (!newConversationId) {
        throw new Error('Failed to create new conversation for audio');
      }
      router.replace(`/chat/${newConversationId}`);
      return await sendActualMessage(newConversationId);
    };

    try {
      let messageSent = false;
      if (currentConversationId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isValidUuid = uuidRegex.test(currentConversationId);
        if (isValidUuid) {
          messageSent = await sendActualMessage(currentConversationId);
        }
      }
      if (!messageSent) {
        messageSent = await createAndSend();
      }
      if (!messageSent) {
        throw new Error('Failed to send audio message after creating new conversation');
      }
    } catch (error) {
      console.error('Send audio message error:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessageId
          ? {
              ...msg,
              metadata: {
                ...msg.metadata,
                isError: true,
                isSending: false,
                error: 'Failed to send. Tap to retry.'
              }
            }
          : msg
      ));
    }
  }, [conversationId, userId, recipientId, handleNewConversation, user?.user_metadata, replyingTo, messageSentSound]);


  // Handle sending message (text)
  const handleSend = useCallback(async (messageType: string = 'text', attachments: any[] = []) => {
    const trimmedInput = input.trim();

    if (!trimmedInput && messageType === 'text' && attachments.length === 0) {
      console.log('Cannot send empty message');
      return;
    }

    if (!userId) {
      console.error('Cannot send message: No user ID');
      Alert.alert('Error', 'You must be logged in to send messages');
      return;
    }

    if (!recipientId) {
      console.error('Cannot send message: No recipient ID');
      Alert.alert('Error', 'No recipient selected. Please try again.');
      return;
    }

    // Create a temporary message ID for optimistic UI update
    const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let currentConversationId = conversationId;

    // Create the temporary message for optimistic UI
    const tempMessage: EnhancedMessage = {
      id: tempMessageId,
      conversation_id: currentConversationId,
      sender_id: userId,
      recipient_id: recipientId,
      content: trimmedInput || (messageType === 'audio' ? 'Audio message' : 'Media'),
      message_type: messageType as any,
      attachments: attachments,
      metadata: {
        isOptimistic: true,
        tempId: tempMessageId,
        isSending: true,
        sentAt: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      is_deleted: false,
      sender: {
        id: userId,
        full_name: user?.user_metadata?.full_name || 'You',
        avatar_url: user?.user_metadata?.avatar_url
      },
      parent_message_id: replyingTo?.id,
      parent_message: replyingTo || undefined,
    };

    // Track this temporary message ID
    tempMessageIds.current.add(tempMessageId);

    // Optimistically update the UI
    console.log('[handleSend] Optimistically adding message:', {
      id: tempMessageId,
      content: tempMessage.content?.substring(0, 30) + '...',
      type: messageType,
      attachmentsCount: attachments.length
    });
    
    setMessages(prev => {
      console.log('[handleSend] Current messages before adding temp message:', prev.length);
      const updated = [...prev, tempMessage];
      console.log('[handleSend] Messages after adding temp message:', updated.length);
      return updated;
    });
    
    // Clear input and reset states
    setInput('');
    setReplyingTo(null);
    setSelectedMedia(null);

    const sendActualMessage = async (conversationIdToUse: string) => {
      try {
        console.log('[handleSend] Sending message to chatService:', { 
          conversationId: conversationIdToUse, 
          userId, 
          recipientId, 
          content: trimmedInput || (messageType === 'audio' ? 'Audio message' : 'Media'),
          messageType,
          tempMessageId,
          hasAttachments: attachments.length > 0
        });
        
        const { data: serverMessage, error } = await sendMessage(
          conversationIdToUse,
          userId,
          recipientId,
          trimmedInput || (messageType === 'audio' ? 'Audio message' : 'Media'),
          messageType as any,
          attachments,
          { 
            tempId: tempMessageId, // Pass tempId in metadata
            isOptimistic: true,
            sentAt: new Date().toISOString()
          },
          replyingTo?.id
        );

        if (error) {
          console.error('[handleSend] Error from sendMessage:', error);
          throw error;
        }

        console.log('[handleSend] Message sent successfully via chatService. Server response:', {
          id: serverMessage?.id,
          tempId: serverMessage?.metadata?.tempId,
          content: serverMessage?.content?.substring(0, 30) + '...'
        });
        
        if (messageSentSound) {
          await messageSentSound.replayAsync();
        }
        
        // The realtime subscription will handle updating the message via handleNewMessage
        return true;
      } catch (error) {
        console.error('[handleSend] Error sending message:', error);
        
        // Update the UI to show the error
        setMessages(prev => {
          return prev.map(msg => {
            if (msg.id === tempMessageId) {
              console.log('[handleSend] Marking message as failed:', tempMessageId);
              return {
                ...msg,
                metadata: {
                  ...msg.metadata,
                  isSending: false,
                  isError: true,
                  error: 'Failed to send. Tap to retry.'
                }
              };
            }
            return msg;
          });
        });
        
        return false;
      }
    };

    const createAndSend = async () => {
      console.log('Creating new conversation for message');
      const newConversationId = await handleNewConversation();
      if (!newConversationId) {
        throw new Error('Failed to create new conversation');
      }

      // Update the conversation ID in the URL
      router.replace(`/chat/${newConversationId}`);

      // Send the message with the new conversation ID
      return await sendActualMessage(newConversationId);
    };

    try {
      let messageSent = false;

      // First, try to send the message with the current conversation ID if it exists
      if (currentConversationId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isValidUuid = uuidRegex.test(currentConversationId);

        if (isValidUuid) {
          // Try sending with the existing conversation ID
          messageSent = await sendActualMessage(currentConversationId);
        }
      }

      // If message wasn't sent (either no conversation ID or send failed), create a new conversation
      if (!messageSent) {
        messageSent = await createAndSend();
      }

      // If we still couldn't send the message, show an error
      if (!messageSent) {
        throw new Error('Failed to send message after creating new conversation');
      }
    } catch (error) {
      console.error('Send message error:', error);

      // Update the message to show error state
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessageId
          ? {
              ...msg,
              metadata: {
                ...msg.metadata,
                isError: true,
                isSending: false,
                error: 'Failed to send. Tap to retry.'
              }
            }
          : msg
      ));

      // Keep the message content for retry
      setInput(trimmedInput);
    }
  }, [input, conversationId, userId, recipientId, handleNewConversation, user?.user_metadata, replyingTo, messageSentSound]);

  // Add function to scroll to a specific message
  const scrollToMessage = useCallback((messageId: string) => {
    // Find the index of the message in the reversed array
    const reversedMessages = [...messages].reverse();
    const messageIndex = reversedMessages.findIndex(msg => msg.id === messageId);

    if (messageIndex !== -1 && flatListRef.current) {
      // Scroll to the message
      flatListRef.current.scrollToIndex({
        index: messageIndex,
        animated: true,
        viewPosition: 0.5, // Center the message in the view
      });

      // Highlight the message temporarily
      setHighlightedMessageId(messageId);

      // Clear highlight after 2 seconds
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    }
  }, [messages]);

  // Add reaction to message
  const handleAddReaction = useCallback(async (messageId: string, reactionType: string) => {
    if (!userId) return;

    try {
      await addMessageReaction(messageId, userId, reactionType);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, [userId]);

  // Remove reaction from message
  const handleRemoveReaction = useCallback(async (messageId: string, reactionId: string) => {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', reactionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  }, []);

  /**
   * Create a media item. For videos, generate a thumbnail URI.
   */
  const createMediaItem = async (uri: string, type: MediaType, name?: string): Promise<MediaItem> => {
    if (type === 'video') {
      try {
        const { uri: thumbnail } = await VideoThumbnails.getThumbnailAsync(uri, {
          time: 1000,
        });
        return {
          id: `${type}-${Date.now()}`,
          uri,
          type,
          name: name || `video-${Date.now()}.mp4`,
          createdAt: new Date().toISOString(),
          thumbnail,
        };
      } catch (e) {
        console.warn('Failed to generate video thumbnail', e);
        return {
          id: `${type}-${Date.now()}`,
          uri,
          type,
          name: name || `video-${Date.now()}.mp4`,
          createdAt: new Date().toISOString(),
          thumbnail: undefined,
        };
      }
    } else {
      return {
        id: `${type}-${Date.now()}`,
        uri,
        type,
        name: name || `${type}-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
    }
  };


  const handleAttachmentPick = async (type: string) => {
    setShowAttachmentOptions(false);
    setActiveMediaTab(null);

    try {
      if (type === 'camera') {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
        });
        if (!result.canceled && result.assets.length > 0) {
          const mediaItemsPromises = result.assets.map(asset => createMediaItem(asset.uri, 'image', asset.fileName));
          const mediaItems = await Promise.all(mediaItemsPromises);
          handleMediaSelected(mediaItems);
        }
      } else if (type === 'photo') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 1,
        });
        if (!result.canceled && result.assets.length > 0) {
          const mediaItemsPromises = result.assets.map(asset => createMediaItem(asset.uri, 'image', asset.fileName));
          const mediaItems = await Promise.all(mediaItemsPromises);
          handleMediaSelected(mediaItems);
        }
      } else if (type === 'video') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsMultipleSelection: true,
        });
        if (!result.canceled && result.assets.length > 0) {
          const mediaItemsPromises = result.assets.map(asset => createMediaItem(asset.uri, 'video', asset.fileName));
          const mediaItems = await Promise.all(mediaItemsPromises);
          handleMediaSelected(mediaItems);
        }
      }
      else if (type === 'audio') {
        // Start audio recording flow, or alert for now
        Alert.alert('Audio', 'Audio recording is not yet implemented in picker');
        // Or you may implement your audio recorder integration here.
      } else if (type === 'file' || type === 'document') {
        const result = await DocumentPicker.getDocumentAsync({ multiple: true });
        if (result.type === 'success') {
          // DocumentPicker returns a single file, so wrap into array
          const files = Array.isArray(result.output) ? result.output : [result];
          const mediaItemsPromises = files.map(file => createMediaItem(file.uri, 'file', file.name));
          const mediaItems = await Promise.all(mediaItemsPromises);
          handleMediaSelected(mediaItems);
        }
      } else {
        Alert.alert('Unsupported', `Attachment type ${type} is not supported yet.`);
      }
    } catch (error) {
      console.error('Error selecting attachment:', error);
      Alert.alert('Error', 'Failed to select attachment.');
    }
  };

  // Handle media selection from CameraMedia (which only provides URI)
  const handleCameraMediaSelect = async (uri: string) => {
    const mediaItem = await createMediaItem(uri, 'image');
    handleMediaSelected(mediaItem);
  };

  // Media component handlers
  const handleMediaSelected = (media: MediaItem | MediaItem[]) => {
    const items = Array.isArray(media) ? media : [media];
    setMediaItems(prev => [...prev, ...items]);
  };

  // Upload media file to Supabase storage using the shared uploadImage utility
  const uploadMedia = async (media: MediaItem): Promise<MediaItem> => {
    try {
      console.log('Starting upload for media:', media.uri);

      // If it's already a URL, return as is
      if (media.uri.startsWith('http')) {
        console.log('Media is already a URL, skipping upload');
        return media;
      }

      // Determine the bucket based on media type
      const bucketName = 'chat-media';

      // Perform the actual upload
      const publicUrl = await uploadImage(media.uri, bucketName);

      if (!publicUrl) {
        throw new Error('No URL returned from upload');
      }

      // Get file extension for mime type
      const fileExtension = media.uri.split('.').pop()?.toLowerCase() ||
        (media.type === 'image' ? 'jpg' : 'file');

      // Return the media item with the new URL
      return {
        ...media,
        url: publicUrl,
        name: publicUrl.split('/').pop() || media.name || `file-${Date.now()}`,
        mimeType: media.mimeType ||
          (media.type === 'image' ? `image/${fileExtension}` :
            media.type === 'video' ? `video/${fileExtension}` :
              'application/octet-stream')
      };
    } catch (error) {
      console.error('Error in uploadMedia:', error);
      throw new Error(`Failed to upload media: ${error.message}`);
    }
  };

  // Handle sending media
  const handleSendMedia = async () => {
    if (mediaItems.length === 0) return;

    const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let currentConversationId = conversationId;

    try {
      setIsSending(true);

      // Create a temporary message to show in the chat for the group upload
      const tempMessage: EnhancedMessage = {
        id: tempMessageId,
        content: 'Sending media...',
        sender_id: userId,
        recipient_id: recipientId,
        conversation_id: currentConversationId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_type: mediaItems[0]?.type as any || 'file',
        status: 'sending',
        metadata: {
          isOptimistic: true,
          tempId: tempMessageId,
          isSending: true,
          isUploading: true,
          uploadProgress: 0,
          mediaCount: mediaItems.length,
          isMedia: true
        },
        is_deleted: false,
        sender: {
          id: userId,
          full_name: user?.user_metadata?.full_name || 'You',
          avatar_url: user?.user_metadata?.avatar_url
        },
        read_at: null,
        delivered_at: null,
        sent_at: new Date().toISOString(),
        attachments: mediaItems.map(media => ({
          type: media.type,
          uri: media.uri,
          url: media.uri, // Temporary local URI for preview
          name: media.name || `file-${Date.now()}`,
          size: media.size,
          mimeType: media.mimeType,
          width: media.width,
          height: media.height,
          duration: media.duration,
          thumbnail: media.thumbnail // Include thumbnail for video preview
        }))
      };

      // Add the temporary message to the UI
      setMessages(prev => [...prev, tempMessage]);

// Add this line to track the temporary message ID
tempMessageIds.current.add(tempMessageId);
      // Scroll to the bottom to show the new message
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);

      // Track upload progress
      let completedUploads = 0;
      const totalUploads = mediaItems.length;

      const uploadedMediaPromises = mediaItems.map(async (item, index) => {
        try {
          const uploadedItem = await uploadMedia(item);
          completedUploads++;
          // Update overall progress after each item is fully uploaded
          const overallProgress = (completedUploads / totalUploads) * 100;
          setMessages(prev => prev.map(msg =>
            msg.id === tempMessageId
              ? {
                  ...msg,
                  metadata: {
                    ...msg.metadata,
                    uploadProgress: Math.round(overallProgress)
                  }
                }
              : msg
          ));
          return uploadedItem;
        } catch (error) {
          console.error(`Error uploading media item ${index + 1}:`, error);
          throw new Error(`Failed to upload ${item.name || 'media'}: ${error.message}`);
        }
      });

      const uploadedMedia = await Promise.all(uploadedMediaPromises);
      console.log('Successfully uploaded', uploadedMedia.length, 'media items');

      // Prepare attachments for the message
      const attachments = uploadedMedia.map(media => {
        if (!media.url && !media.uri) {
          console.error('Media item has no URL or URI:', media);
          throw new Error('Invalid media item: missing URL');
        }

        return {
          type: media.type,
          url: media.url || media.uri,
          name: media.name || `media-${Date.now()}`,
          size: media.size,
          mimeType: media.mimeType,
          width: media.width,
          height: media.height,
          duration: media.duration,
          thumbnail: media.thumbnail // Pass thumbnail to the final message
        };
      });

      // Determine message type based on the first media item
      const messageType = uploadedMedia[0]?.type || 'file';
      const content = uploadedMedia.length > 1
        ? `Sent ${uploadedMedia.length} media files`
        : `Sent a ${messageType} file`;

      console.log('Sending message with attachments:', {
        content,
        attachmentCount: attachments.length,
        firstAttachment: attachments[0]
      });

      // Send the message with the uploaded media
      const { error, data: sentMessage } = await sendMessage(
        currentConversationId,
        userId,
        recipientId,
        content,
        messageType as any,
        attachments,
        {
          tempId: tempMessageId,
          mediaCount: uploadedMedia.length,
          isMedia: true
        },
        replyingTo?.id
      );

      if (error) throw error;

      if (messageSentSound) {
        await messageSentSound.replayAsync();
      }

      // Clear media items and reset UI on success
      setMediaItems([]);
      setShowAttachmentOptions(false);
      setActiveMediaTab(null);

    } catch (error) {
      console.error('Error sending media:', error);

      // Update the message to show error
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessageId
          ? {
              ...msg,
              status: 'error',
              content: 'Failed to send',
              metadata: {
                ...msg.metadata,
                uploadError: error.message,
                isUploading: false,
                isSending: false
              }
            }
          : msg
      ));

      Alert.alert('Error', 'Failed to send media. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Audio recording functions
  // This callback will be triggered by the VoiceRecorder component
  const handleRecordingStateChange = useCallback((state: { isRecording: boolean, duration: number }) => {
    setIsRecording(state.isRecording);
    setRecordingTime(state.duration);

    if (state.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      recordingAnimation.stopAnimation();
      recordingAnimation.setValue(0);
    }
  }, [recordingAnimation]);


  // Audio playback functions
  const toggleAudioPlayback = (messageId: string) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null);
      // Stop audio playback
    } else {
      setPlayingAudio(messageId);
      // Start audio playback
      // Mock - replace with actual audio playback
      setTimeout(() => {
        setPlayingAudio(null);
      }, 3000);
    }
  };

  // Safe string utility function
  const safeStartsWith = (str: any, search: string) => {
    try {
      if (str && typeof str === 'string') {
        return str.startsWith(search);
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Generate a stable key for messages with maximum safety
  const getMessageKey = useCallback((message: any) => {
    try {
      // Safely get message ID with fallbacks
      let messageId = 'unknown';
      if (message && typeof message === 'object') {
        if (message.id !== undefined && message.id !== null) {
          messageId = String(message.id);
        } else if (message.metadata?.tempId) { // Use metadata.tempId for optimistic messages
          messageId = `temp-${message.metadata.tempId}`;
        }
      }

      // Create a safe key using our safeStartsWith, without timestamp
      const key = safeStartsWith(messageId, 'temp-')
        ? `temp-${messageId}`
        : `msg-${messageId}`;

      return key;
    } catch (error) {
      console.error('Error in getMessageKey:', error);
      return `error-${Date.now()}`;
    }
  }, []);

  // Render message content based on type
  const renderMessageContent = (message: EnhancedMessage) => {
    const isOwnMessage = message.sender_id === userId;
    const isUploading = message.metadata?.isUploading;
    const uploadProgress = message.metadata?.uploadProgress || 0;
    const uploadError = message.metadata?.uploadError;

    // Show upload progress if message is being uploaded
    if (isUploading) {
      return (
        <View style={styles.uploadContainer}>
          {message.attachments?.[0]?.type === 'image' && message.attachments?.[0]?.uri && (
            <Image
              source={{ uri: message.attachments[0].uri }} // Use uri for local preview during upload
              style={[styles.messageImage, { opacity: 0.7 }]}
              resizeMode="cover"
            />
          )}
          {message.attachments?.[0]?.type === 'video' && (
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: message.attachments?.[0]?.thumbnail || message.attachments?.[0]?.uri }} // Use thumbnail or uri for local preview
                style={[styles.messageImage, { opacity: 0.7 }]}
                resizeMode="cover"
              />
              <View style={styles.playButtonOverlay}>
                <View style={styles.playButton}>
                  <Video size={24} color={colors.background} />
                </View>
              </View>
            </View>
          )}
          {message.attachments?.[0]?.type === 'file' && (
            <View style={styles.fileContainer}>
              <View style={[styles.fileIcon, isOwnMessage && styles.ownFileIcon]}>
                <FileText size={24} color={isOwnMessage ? colors.primary : colors.background} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={[
                  styles.fileName,
                  isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                ]}>
                  {message.attachments?.[0]?.name || 'File'}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.progressOverlay}>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${uploadProgress}%`,
                    backgroundColor: uploadError ? colors.error : colors.primary
                  }
                ]}
              />
              <Text style={styles.progressText}>
                {uploadError ? 'Error' : `${Math.round(uploadProgress)}%`}
              </Text>
            </View>
            {uploadError && (
              <Text style={[styles.progressText, { fontSize: 10, marginTop: 4 }]}>
                {uploadError}
              </Text>
            )}
          </View>
        </View>
      );
    }

    switch (message.message_type) {
      case 'image':
        return (
          <TouchableOpacity onPress={() => setSelectedMedia(message.attachments?.[0])}>
            <Image
              source={{ uri: message.attachments?.[0]?.url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {message.content && (
              <Text style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                { marginTop: 8 }
              ]}>
                {message.content}
              </Text>
            )}
          </TouchableOpacity>
        );


      case 'video':
        return (
          <TouchableOpacity
            style={styles.videoContainer}
            onPress={() => setSelectedMedia(message.attachments?.[0])}
          >
            {/* Show thumbnail or fallback image */}
            <Image
              source={{ uri: message.attachments?.[0]?.thumbnail || message.attachments?.[0]?.url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            <View style={styles.playButtonOverlay}>
              <View style={styles.playButton}>
                <Play size={24} color={colors.background} />
              </View>
            </View>
            {message.content && (
              <Text
                style={[
                  styles.messageText,
                  isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                  { marginTop: 8 },
                ]}
              >
                {message.content}
              </Text>
            )}
          </TouchableOpacity>
        );

      case 'audio':
        return (
          <View style={styles.voiceMessageContent}>
            <VoicePlayer
              audioUri={message.attachments?.[0]?.url} // Use URL for playback
              duration={message.attachments?.[0]?.duration || 0}
              colors={{
                primary: isOwnMessage ? colors.background : colors.primary,
                background: isOwnMessage ? colors.primary : colors.background,
                text: isOwnMessage ? colors.text : colors.text, // Text color for player
                textSecondary: isOwnMessage ? colors.background + 'B3' : colors.textSecondary,
                error: colors.error,
                border: colors.border
              }}
              isOwnMessage={isOwnMessage}
              style={styles.voicePlayer}
            />
          </View>
        );

      case 'file':
        return (
          <View style={styles.fileContainer}>
            <View style={[styles.fileIcon, isOwnMessage && styles.ownFileIcon]}>
              <FileText size={24} color={isOwnMessage ? colors.primary : colors.background} />
            </View>
            <View style={styles.fileInfo}>
              <Text style={[
                styles.fileName,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText
              ]}>
                {message.attachments?.[0]?.name || 'File'}
              </Text>
              <Text style={[
                styles.fileSize,
                { color: isOwnMessage ? colors.background + 'B3' : colors.textSecondary }
              ]}>
                {message.attachments?.[0]?.size || 'Unknown size'}
              </Text>
            </View>
          </View>
        );

      default:
        return (
          <Text style={[
            styles.messageText,
            message.sender_id === userId ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
        );
    }
  };

  // Render message status indicator
  const renderMessageStatus = (message: EnhancedMessage) => {
    const isTempMessage = safeStartsWith(message.id, 'temp-');
    const isError = message.metadata?.isError;
    const isSending = message.metadata?.isSending === true;
    const isUploading = message.metadata?.isUploading === true;
  
    console.log(
      `[renderMessageStatus] Message ID: ${message.id}, ` +
      `isSending: ${isSending}, ` +
      `isUploading: ${isUploading}, ` +
      `isTemp: ${isTempMessage}, ` +
      `isError: ${isError}, ` +
      `metadata:`, 
      message.metadata
    );
  
    if (isError) {
      return (
        <TouchableOpacity
          onPress={() => handleRetryMessage(message)}
          style={styles.retryButton}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AlertCircle size={14} color={colors.error} style={{ marginRight: 4 }} />
            <Text style={{ color: colors.error, fontSize: 10 }}>Retry</Text>
          </View>
        </TouchableOpacity>
      );
    }
  
    // Only show loading indicator if it's a temporary message or explicitly marked as sending/uploading
    if ((isSending || isUploading) && isTempMessage) {
      return <ActivityIndicator size={14} color={colors.textSecondary} style={styles.statusIcon} />;
    }
  
    // If the message is confirmed by the server (not temporary)
    if (!isTempMessage) {
      return <Check size={14} color={colors.textSecondary} style={styles.statusIcon} />;
    }
  
    return null;
  };
  const handleSetReply = (message: EnhancedMessage) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Handle retry for failed messages
  const handleRetryMessage = async (message: EnhancedMessage) => {
    if (!userId || !recipientId) return;

    try {
      // Update the message to show it's being sent
      setMessages(prev => prev.map(msg =>
        msg.id === message.id
          ? { ...msg, metadata: { ...msg.metadata, isError: false, isSending: true } }
          : msg
      ));

      // Try to send the message again
      const { error } = await sendMessage(
        message.conversation_id || '',
        userId,
        recipientId,
        message.content,
        message.message_type,
        message.attachments,
        { tempId: message.id } // Pass tempId in metadata for retry
      );

      if (error) throw error;

    } catch (error) {
      console.error('Failed to resend message:', error);
      // Update the message to show it failed again
      setMessages(prev => prev.map(msg =>
        msg.id === message.id
          ? { ...msg, metadata: { ...msg.metadata, isError: true, isSending: false } }
          : msg
      ));
    }
  };

  // Toggle attachment options
  const toggleAttachmentOptions = () => {
    setShowAttachmentOptions(!showAttachmentOptions);

    Animated.timing(attachmentAnimation, {
      toValue: showAttachmentOptions ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Message item component
  const MessageItem = ({ item, prevMessage, lastReadTimestamp }: { item: EnhancedMessage, prevMessage: EnhancedMessage | null, lastReadTimestamp: string | null }) => {
    // Add a safety check for the message object
    if (!item) {
      console.error('Attempted to render null/undefined message');
      return null;
    }

    const isOwnMessage = item.sender_id === userId;
    const isHighlighted = highlightedMessageId === item.id;

    // Check if the date is different from the previous message
    const showDateSeparator = !prevMessage || new Date(item.created_at).toDateString() !== new Date(prevMessage.created_at).toDateString();

    // Check if this is the first unread message
    const isFirstUnread = lastReadTimestamp ? new Date(item.created_at) > new Date(lastReadTimestamp) && (!prevMessage || new Date(prevMessage.created_at) <= new Date(lastReadTimestamp)) : false;

    const messageStyle = [
      styles.messageBubble,
      isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
      isHighlighted && styles.highlightedMessage,
    ];

    // Generate a unique key for each message
    const messageKey = getMessageKey(item);

    // Don't show the sender name for consecutive messages from the same user
    const showSenderName = !isOwnMessage && (!prevMessage || prevMessage.sender_id !== item.sender_id);

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        )}
        {isFirstUnread && (
          <View style={styles.unreadSeparator}>
            <Text style={styles.unreadSeparatorText}>New Messages</Text>
          </View>
        )}
        <TouchableOpacity
          onLongPress={() => handleSetReply(item)}
          delayLongPress={200}
        >
          <View
            key={messageKey}
            style={[
              styles.messageContainer,
              isOwnMessage ? styles.ownMessage : styles.otherMessage,
              {
                opacity: (item?.id && safeStartsWith(item.id, 'temp-')) ? 0.7 : 1,
                marginTop: showSenderName ? 8 : 2,
              }
            ]}
          >
            {showSenderName && (
              <Text style={[styles.senderName, { color: colors.textSecondary }]}>
                {item.sender?.full_name || 'Unknown User'}
              </Text>
            )}

            <View style={messageStyle}>
              {item.parent_message && (
                <TouchableOpacity
                  onPress={() => scrollToMessage(item.parent_message!.id)}
                  style={[
                    styles.replyContainer,
                    isOwnMessage ? styles.ownReplyContainer : styles.otherReplyContainer
                  ]}
                >
                  <View style={[
                    styles.replyIndicator,
                    { backgroundColor: isOwnMessage ? colors.background + '60' : colors.primary + '60' }
                  ]} />
                  <View style={styles.replyContent}>
                    <View style={styles.replyHeader}>
                      <Reply size={14} color={isOwnMessage ? colors.background + 'B3' : colors.primary} />
                      <Text style={[
                        styles.replySenderName,
                        { color: isOwnMessage ? colors.background + 'B3' : colors.primary }
                      ]}>
                        {item.parent_message.sender?.full_name || 'Unknown User'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.replyMessageText,
                        { color: isOwnMessage ? colors.background + '99' : colors.textSecondary }
                      ]}
                      numberOfLines={2}
                    >
                      {item.parent_message.message_type === 'text'
                        ? item.parent_message.content
                        : `${item.parent_message.message_type} message`}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Render message content based on type */}
              {renderMessageContent(item)}

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 }}>
                <Text style={[
                  styles.timeText,
                  isOwnMessage ? styles.ownTimeText : { color: colors.textSecondary + '99' }
                ]}>
                  {formatMessageTime(item.created_at)}
                </Text>

                {item.is_edited && (
                  <Text style={[
                    styles.editedText,
                    { color: isOwnMessage ? colors.background + 'B3' : colors.textSecondary + '99' }
                  ]}>
                    (edited)
                  </Text>
                )}

                {/* Message status indicator */}
                {item.sender_id === userId && renderMessageStatus(item)}
              </View>

              {/* Reactions */}
              {item.reactions && item.reactions.length > 0 && (
                <View style={styles.reactionsContainer}>
                  {item.reactions.map((reaction) => {
                    const isUserReaction = reaction.user_id === userId;
                    return (
                      <TouchableOpacity
                        key={reaction.id}
                        style={[styles.reactionBubble, isUserReaction && styles.userReactionBubble]}
                        onPress={() => isUserReaction
                          ? handleRemoveReaction(item.id, reaction.id)
                          : handleAddReaction(item.id, reaction.reaction_type)
                        }
                      >
                        <Text style={styles.reactionText}>
                          {reaction.reaction_type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </>
    );
  };

  // Memoized version of MessageItem to prevent unnecessary re-renders
  const MemoizedMessageItem = React.memo(MessageItem);

  // Format date safely, handling invalid or missing dates
  const formatMessageTime = useCallback((dateString: string | undefined): string => {
    try {
      if (!dateString) return '';

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return '';
      }

      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }, []);

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = getStyles(colors);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {recipientInfo?.full_name || 'Chat'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {onlineStatus === 'online' ? 'Online' : 'Offline'}
          </Text>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          renderItem={({ item, index }) => {
            const reversedMessages = [...messages].reverse();
            const prevMessage = index > 0 ? reversedMessages[index - 1] : null;
            const recipientLastRead = conversation?.participant1_id === recipientId
              ? conversation?.participant1_last_read_at
              : conversation?.participant2_last_read_at;

            return (
              <MemoizedMessageItem
                item={item}
                prevMessage={prevMessage}
                lastReadTimestamp={recipientLastRead ?? null}
              />
            );
          }}
          keyExtractor={(item) => getMessageKey(item)} // Use the stable key
          contentContainerStyle={styles.messagesContent}
          style={styles.messagesList}
          inverted
          initialNumToRender={15}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={100}
          windowSize={11}
          removeClippedSubviews={true}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onScrollToIndexFailed={(info) => {
            console.warn('Failed to scroll to index:', info);
            // Fallback: scroll to the end
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        />

        {/* Typing indicator */}
        {otherUserTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {otherUserTyping} is typing...
            </Text>
          </View>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Animated.View style={[
              styles.recordingDot,
              {
                opacity: recordingAnimation,
                transform: [{
                  scale: recordingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  })
                }]
              }
            ]} />
            <Text style={styles.recordingText}>
              Recording... {formatRecordingTime(recordingTime)}
            </Text>
            {/* The cancel button will be handled by VoiceRecorder's internal gesture */}
            {/* <TouchableOpacity onPress={cancelAudioRecording} style={styles.cancelRecordingButton}>
              <X size={20} color={colors.error} />
            </TouchableOpacity> */}
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <View style={styles.replyingToIndicator} />
              <View style={styles.replyingToContent}>
                <Text style={styles.replyingToLabel}>Replying to {replyingTo.sender?.full_name}</Text>
                <Text style={styles.replyingToText} numberOfLines={2}>
                  {replyingTo.message_type === 'text'
                    ? replyingTo.content
                    : `${replyingTo.message_type} message`}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCancelReply} style={styles.cancelReplyButton}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {mediaItems.length > 0 && (
            <View style={styles.selectedMediaInputContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedMediaInputList}
              >
                {mediaItems.map((item, index) => (
                  <View key={item.id} style={styles.selectedMediaInputItem}>
                    {item.type === 'image' ? (
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.selectedMediaInputThumbnail}
                        resizeMode="cover"
                      />
                    ) : item.type === 'video' ? (
                      <View style={[styles.selectedMediaInputThumbnail, { justifyContent: 'center', alignItems: 'center' }]}>
                        {item.thumbnail ? (
                          <Image
                            source={{ uri: item.thumbnail }}
                            style={styles.selectedMediaInputThumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <Video size={24} color={colors.primary} />
                        )}
                        <View style={styles.videoPlayIconOverlay}>
                          <Play size={16} color={colors.background} />
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.selectedMediaInputThumbnail, { justifyContent: 'center', alignItems: 'center' }]}>
                        <FileText size={24} color={colors.primary} />
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removeMediaInputButton}
                      onPress={() => {
                        const updatedItems = [...mediaItems];
                        updatedItems.splice(index, 1);
                        setMediaItems(updatedItems);
                      }}
                    >
                      <X size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.mediaInputActions}>
                <TouchableOpacity
                  style={[styles.mediaInputActionButton, { backgroundColor: colors.surface }]}
                  onPress={() => setMediaItems([])}
                >
                  <Text style={[styles.mediaInputActionButtonText, { color: colors.error }]}>
                    Clear
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mediaInputActionButton, { backgroundColor: colors.primary }]}
                  onPress={handleSendMedia}
                >
                  <Text style={[styles.mediaInputActionButtonText, { color: colors.background }]}>
                    Send ({mediaItems.length})
                  </Text>
                  <Send size={16} color={colors.background} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={toggleAttachmentOptions}
            >
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={1000}
            />

            {input.trim() ? (
              <TouchableOpacity
                style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                disabled={!input.trim()}
                onPress={() => handleSend()}
              >
                <Send size={20} color={colors.background} />
              </TouchableOpacity>
            ) : (
              <VoiceRecorder
                onSendAudio={handleSendAudio}
                onRecordingStateChange={handleRecordingStateChange} // Pass the new callback
                colors={{
                  primary: colors.primary,
                  background: colors.background,
                  text: colors.text,
                  textSecondary: colors.textSecondary,
                  error: colors.error,
                  border: colors.border
                }}
                style={styles.voiceRecorder}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Options BottomSheet */}
      <BottomSheet
        visible={showAttachmentOptions}
        onClose={() => setShowAttachmentOptions(false)}
        title="Send Media"
        colors={{
          background: colors.background,
          text: colors.text,
          textSecondary: colors.textSecondary,
          border: colors.border,
          surface: colors.surface,
        }}
        snapPoints={[0.3, 0.4]}
        showHandle={true}
        enablePanGesture={true}
        closeOnBackdropPress={true}
      >
        <View style={styles.bottomSheetContent}>
          {mediaItems.length > 0 && (
            <View style={styles.selectedMediaContainer}>
              <View style={styles.selectedMediaHeader}>
                <Text style={styles.selectedMediaTitle}>
                  Selected ({mediaItems.length})
                </Text>
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={() => setMediaItems([])}
                >
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.selectedMediaList}
              >
                {mediaItems.map((item, index) => (
                  <View key={item.id} style={styles.selectedMediaItem}>
                    {item.type === 'image' ? (
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.selectedMediaThumbnail}
                        resizeMode="cover"
                      />
                    ) : item.type === 'video' ? (
                      <View style={[styles.selectedMediaThumbnail, { justifyContent: 'center', alignItems: 'center' }]}>
                        {item.thumbnail ? (
                          <Image
                            source={{ uri: item.thumbnail }}
                            style={styles.selectedMediaThumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <Video size={24} color={colors.primary} />
                        )}
                        <View style={styles.videoPlayIconOverlay}>
                          <Play size={16} color={colors.background} />
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.selectedMediaThumbnail, { justifyContent: 'center', alignItems: 'center' }]}>
                        <FileText size={24} color={colors.primary} />
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => {
                        const updatedItems = [...mediaItems];
                        updatedItems.splice(index, 1);
                        setMediaItems(updatedItems);
                      }}
                    >
                      <X size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.mediaActionButtons}>
                <TouchableOpacity
                  style={[styles.mediaActionButton, { backgroundColor: colors.surface }]}
                  onPress={() => setMediaItems([])}
                >
                  <Text style={[styles.mediaActionButtonText, { color: colors.error }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mediaActionButton, { backgroundColor: colors.primary }]}
                  onPress={handleSendMedia}
                >
                  <Text style={[styles.mediaActionButtonText, { color: colors.background }]}>
                    Send {mediaItems.length} {mediaItems.length === 1 ? 'Item' : 'Items'}
                  </Text>
                  <Send size={16} color={colors.background} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.attachmentGrid}>
            <TouchableOpacity style={styles.attachmentItem} onPress={() => handleAttachmentPick('camera')}>
              <View style={[styles.attachmentIcon, { backgroundColor: '#2196F320' }]}>
                <Camera size={28} color="#2196F3" />
              </View>
              <Text style={styles.attachmentLabel}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachmentItem} onPress={() => handleAttachmentPick('photo')}>
              <View style={[styles.attachmentIcon, { backgroundColor: '#4CAF5020' }]}>
                <ImageIcon size={28} color="#4CAF50" />
              </View>
              <Text style={styles.attachmentLabel}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachmentItem} onPress={() => handleAttachmentPick('video')}>
              <View style={[styles.attachmentIcon, { backgroundColor: '#FF980020' }]}>
                <Video size={28} color="#FF9800" />
              </View>
              <Text style={styles.attachmentLabel}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachmentItem} onPress={() => handleAttachmentPick('audio')}>
              <View style={[styles.attachmentIcon, { backgroundColor: '#E91E6320' }]}>
                <Mic size={28} color="#E91E63" />
              </View>
              <Text style={styles.attachmentLabel}>Audio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachmentItem} onPress={() => handleAttachmentPick('file')}>
              <View style={[styles.attachmentIcon, { backgroundColor: '#9C27B020' }]}>
                <FileText size={28} color="#9C27B0" />
              </View>
              <Text style={styles.attachmentLabel}>File</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachmentItem} onPress={() => handleAttachmentPick('document')}>
              <View style={[styles.attachmentIcon, { backgroundColor: `${colors.primary}20` }]}>
                <FileText size={28} color={colors.primary} />
              </View>
              <Text style={styles.attachmentLabel}>Document</Text>
            </TouchableOpacity>
          </View>

          {activeMediaTab === 'camera' && (
            <CameraMedia onMediaSelect={handleCameraMediaSelect} />
          )}
          {activeMediaTab === 'photo' && (
            <PhotoMedia onMediaSelected={handleMediaSelected} />
          )}
          {activeMediaTab === 'video' && (
            <VideoMedia onMediaSelected={handleMediaSelected} />
          )}
          {activeMediaTab === 'audio' && (
            <View style={styles.audioMediaContainer}>
              <TouchableOpacity onPress={handleSendMedia} style={styles.sendMediaButton}>
                <Text style={styles.sendMediaButtonText}>Send Media</Text>
              </TouchableOpacity>
            </View>
          )}
          {activeMediaTab === 'file' && (
            <FileMedia onMediaSelected={handleMediaSelected} />
          )}
          {activeMediaTab === 'document' && (
            <DocumentMedia onMediaSelected={handleMediaSelected} />
          )}
        </View>
      </BottomSheet>

      {/* Media Preview Modal */}
      <Modal
        visible={!!selectedMedia}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMedia(null)}
      >
        <View style={styles.mediaPreviewContainer}>
          <TouchableOpacity
            style={styles.mediaPreviewBackground}
            onPress={() => setSelectedMedia(null)}
          />
          <View style={styles.mediaPreviewContent}>
            <TouchableOpacity
              style={styles.closeMediaButton}
              onPress={() => setSelectedMedia(null)}
            >
              <X size={24} color={colors.background} />
            </TouchableOpacity>
            {selectedMedia && (
              selectedMedia.type === 'image' ? (
                <Image
                  source={{ uri: selectedMedia.url || selectedMedia.uri }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              ) : selectedMedia.type === 'video' ? (
                <ExpoVideo
                  source={{ uri: selectedMedia.url || selectedMedia.uri }}
                  rate={1.0}
                  volume={1.0}
                  isMuted={false}
                  resizeMode="contain"
                  shouldPlay
                  useNativeControls
                  style={styles.fullScreenVideo}
                />
              ) : (
                <View style={styles.videoPlayerContainer}>
                  <Text style={styles.videoPlayerText}>
                    Preview not available for this media type.
                  </Text>
                </View>
              )
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  fullScreenVideo: {
    width: screenWidth,
    height: '80%',
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 10,
  },
  dateSeparatorText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  unreadSeparator: {
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 10,
  },
  unreadSeparatorText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  ownMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  otherMessageBubble: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 2,
  },
  highlightedMessage: {
    backgroundColor: colors.primary + '20',
    transform: [{ scale: 1.02 }],
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: colors.background,
  },
  otherMessageText: {
    color: colors.text,
  },
  // Media message styles
  messageImage: {
    width: 250,
    height: 200,
    borderRadius: 12,
    marginVertical: 4,
  },
  uploadContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '80%',
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  videoContainer: {
    position: 'relative',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
    paddingVertical: 4,
  },
  audioPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ownAudioPlayButton: {
    backgroundColor: colors.background + '20',
  },
  audioWaveform: {
    flex: 1,
    marginRight: 12,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    justifyContent: 'space-between',
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  audioDuration: {
    fontSize: 12,
    fontWeight: '500',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
    paddingVertical: 4,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ownFileIcon: {
    backgroundColor: colors.background + '20',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
  },
  // Reply styles
  replyContainer: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  ownReplyContainer: {
    backgroundColor: colors.background + '10',
    borderLeftColor: colors.background,
  },
  otherReplyContainer: {
    backgroundColor: colors.primary + '10',
    borderLeftColor: colors.primary,
  },
  replyIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 1.5,
  },
  replyContent: {
    paddingLeft: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replySenderName: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  replyMessageText: {
    fontSize: 12,
    lineHeight: 16,
  },
  // Reactions styles
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  reactionBubble: {
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  userReactionBubble: {
    backgroundColor: colors.primary + '20',
  },
  reactionText: {
    fontSize: 12,
  },
  // Message status styles
  statusIcon: {
    marginLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    marginLeft: 6,
    padding: 2,
  },
  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  ownTimeText: {
    color: colors.background + 'B3',
  },
  editedText: {
    fontSize: 10,
    fontStyle: 'italic',
    marginLeft: 4,
  },
  // Typing indicator styles
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  typingText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  // Recording indicator styles
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.error + '10',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
    marginRight: 8,
  },
  voiceRecorder: {
    width: 40, // Fixed width for the mic button
    height: 40, // Fixed height for the mic button
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12, // Adjusted margin for placement
  },
  voiceMessageContent: {
    // This wraps the VoicePlayer to apply bubble-like styling
    // The VoicePlayer itself will handle its internal layout
    paddingVertical: 4,
    // No background or alignment here, it's handled by the messageBubble and messageContainer
  },
  voicePlayer: {
    width: 200, // Example width, adjust as needed
  },
  recordingText: {
    flex: 1,
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  cancelRecordingButton: {
    padding: 4,
  },
  // Input container styles
  inputContainer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  replyingToIndicator: {
    width: 3,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 1.5,
    marginRight: 12,
  },
  replyingToContent: {
    flex: 1,
  },
  replyingToHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyingToTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  replyingToText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  cancelReplyButton: {
    padding: 4,
    marginLeft: 8,
  },
  cancelReplyText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  attachmentButton: {
    width: 40, // Fixed width for the plus button
    height: 40, // Fixed height for the plus button
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // Adjusted margin for placement
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 8,
    // No marginRight here, it will be handled by the next button
    maxHeight: 100,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12, // Adjusted margin for placement
  },
  sendButtonDisabled: {
    backgroundColor: colors.textSecondary + '40',
  },
  stopRecordingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // BottomSheet styles
  bottomSheetContent: {
    flex: 1,
    padding: 16,
  },
  selectedMediaContainer: {
    padding: 16,
  },
  selectedMediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedMediaTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  clearAllButton: {
    padding: 4,
  },
  clearAllText: {
    fontSize: 14,
    color: colors.error,
  },
  selectedMediaList: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  selectedMediaItem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginRight: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.background,
  },
  selectedMediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  attachmentItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 24,
  },
  attachmentIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachmentLabel: {
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  mediaActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mediaActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  mediaActionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  audioMediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  audioWaveform: {
    width: '100%',
    height: 60,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateIcon: {
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  mediaPreviewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPreviewBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mediaPreviewContent: {
    width: screenWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeMediaButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  fullScreenImage: {
    width: screenWidth,
    height: '80%',
  },
  videoPlayerContainer: {
    width: screenWidth,
    height: '80%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '500',
  },
  sendMediaButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendMediaButtonText: {
    fontSize: 16,
    color: colors.background,
  },
  // New styles for selected media in input container
  selectedMediaInputContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  selectedMediaInputList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  selectedMediaInputItem: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginRight: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.background,
  },
  selectedMediaInputThumbnail: {
    width: '100%',
    height: '100%',
  },
  removeMediaInputButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.background,
    zIndex: 1,
  },
  mediaInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  mediaInputActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  mediaInputActionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  videoPlayIconOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
  }
});
