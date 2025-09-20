import { realtimeService } from '../utils/realtimeService';
import { 
  getOrCreateConversation, 
  sendMessage, 
  fetchMessages, 
  createChatRoom, 
  addRoomMember, 
  sendRoomMessage, 
  fetchRoomMessages 
} from '../utils/chatService';
import { supabase } from '../lib/supabase';

// Mock user IDs
const USER1_ID = 'user1_test_id';
const USER2_ID = 'user2_test_id';

describe('Realtime Chat System', () => {
  let conversationId: string;
  let roomId: string;

  beforeAll(async () => {
    // Initialize realtime service for both users
    await realtimeService.initialize(USER1_ID);
    await realtimeService.initialize(USER2_ID);
  });

  afterAll(async () => {
    // Clean up test data
    if (conversationId) {
      await supabase.from('conversations').delete().eq('id', conversationId);
    }
    if (roomId) {
      await supabase.from('chat_rooms').delete().eq('id', roomId);
    }
    realtimeService.cleanup();
  });

  describe('Direct Messages', () => {
    it('should create a new conversation', async () => {
      const conversation = await getOrCreateConversation(USER1_ID, USER2_ID);
      expect(conversation).toBeDefined();
      expect(conversation.id).toBeDefined();
      conversationId = conversation.id;
    });

    it('should send and receive a message in real-time', async () => {
      const messageContent = 'Hello, this is a test message!';
      
      // Setup a listener for the new message
      const messagePromise = new Promise<any>((resolve) => {
        realtimeService.subscribeToConversation(conversationId, (newMessage) => {
          resolve(newMessage);
        });
      });

      // Send the message
      await sendMessage(conversationId, USER1_ID, USER2_ID, messageContent);

      // Wait for the message to be received
      const receivedMessage = await messagePromise;

      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.content).toBe(messageContent);
      expect(receivedMessage.sender_id).toBe(USER1_ID);
    });

    it('should fetch all messages for a conversation', async () => {
      const { data: messages, error } = await fetchMessages(conversationId);
      expect(error).toBeNull();
      expect(messages).toBeDefined();
      expect(messages!.length).toBeGreaterThan(0);
    });
  });

  describe('Group Chat Rooms', () => {
    it('should create a new chat room', async () => {
      const roomName = 'Test Room';
      const { data: room, error } = await createChatRoom(
        roomName,
        'A room for testing',
        'group',
        'general',
        false,
        USER1_ID
      );
      expect(error).toBeNull();
      expect(room).toBeDefined();
      expect(room!.name).toBe(roomName);
      roomId = room!.id;
    });

    it('should add members to the room', async () => {
      const { error: error1 } = await addRoomMember(roomId, USER1_ID, 'owner');
      const { error: error2 } = await addRoomMember(roomId, USER2_ID, 'member');
      expect(error1).toBeNull();
      expect(error2).toBeNull();
    });

    it('should send and receive a room message in real-time', async () => {
      const messageContent = 'Hello, room!';

      // Setup a listener for the new message
      const messagePromise = new Promise<any>((resolve) => {
        realtimeService.subscribeToRoom(roomId, (newMessage) => {
          resolve(newMessage);
        });
      });

      // Send the message
      await sendRoomMessage(roomId, USER2_ID, messageContent);

      // Wait for the message to be received
      const receivedMessage = await messagePromise;

      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.content).toBe(messageContent);
      expect(receivedMessage.sender_id).toBe(USER2_ID);
      expect(receivedMessage.room_id).toBe(roomId);
    });

    it('should fetch all messages for a room', async () => {
      const { data: messages, error } = await fetchRoomMessages(roomId);
      expect(error).toBeNull();
      expect(messages).toBeDefined();
      expect(messages!.length).toBeGreaterThan(0);
    });
  });

  describe('Presence Tracking', () => {
    it('should update user presence to online', async () => {
      await realtimeService.updatePresence('online');
      // Note: Verification of presence updates would typically be done
      // by listening to presence events on another client.
      // For this test, we're just ensuring the update function runs without error.
    });

    it('should track typing indicators', async () => {
      const typingPromise = new Promise<any>((resolve) => {
        realtimeService.subscribeToConversation(
          conversationId,
          () => {},
          (typingIndicator) => {
            resolve(typingIndicator);
          }
        );
      });

      await realtimeService.sendTypingIndicator(conversationId, undefined, true);

      const receivedTypingIndicator = await typingPromise;
      expect(receivedTypingIndicator).toBeDefined();
      expect(receivedTypingIndicator.is_typing).toBe(true);
      expect(receivedTypingIndicator.user_id).toBe(USER1_ID);

      // Clean up typing indicator
      await realtimeService.sendTypingIndicator(conversationId, undefined, false);
    });
  });
});
