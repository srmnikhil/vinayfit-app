-- Enhanced Realtime Chat System Migration
-- Supports multi-role communication: Clients, Trainers, Nutritionists, Admin, HR
-- Features: Presence, Broadcast, Enhanced Postgres Changes, Group Chats, Reactions, Typing Indicators

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user presence table for real-time status tracking
CREATE TABLE IF NOT EXISTS user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('online', 'offline', 'away', 'busy', 'invisible')) DEFAULT 'offline',
  last_seen timestamptz DEFAULT now(),
  current_activity text, -- 'chatting', 'working_out', 'meal_planning', etc.
  device_info jsonb DEFAULT '{}',
  location_context text, -- 'gym', 'home', 'office', etc.
  is_available_for_chat boolean DEFAULT true,
  custom_status_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create chat rooms table for group conversations
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  room_type text CHECK (room_type IN ('direct', 'group', 'support', 'announcement', 'community')) DEFAULT 'group',
  category text CHECK (category IN ('general', 'training', 'nutrition', 'admin', 'hr', 'support', 'community')) DEFAULT 'general',
  is_private boolean DEFAULT false,
  max_members integer DEFAULT 100,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  room_avatar_url text,
  room_settings jsonb DEFAULT '{}', -- notifications, permissions, etc.
  is_archived boolean DEFAULT false,
  archived_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create room members table with role-based permissions
CREATE TABLE IF NOT EXISTS room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text CHECK (role IN ('owner', 'admin', 'moderator', 'member', 'guest')) DEFAULT 'member',
  permissions jsonb DEFAULT '{"can_send_messages": true, "can_add_members": false, "can_remove_members": false, "can_edit_room": false}',
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  notification_settings jsonb DEFAULT '{"muted": false, "mention_only": false}',
  is_pinned boolean DEFAULT false,
  custom_nickname text,
  UNIQUE(room_id, user_id)
);

-- Enhance existing messages table
DO $$
BEGIN
  -- Add new columns to messages table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'room_id') THEN
    ALTER TABLE messages ADD COLUMN room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type') THEN
    ALTER TABLE messages ADD COLUMN message_type text CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'system', 'workout_share', 'meal_share', 'progress_photo')) DEFAULT 'text';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'attachments') THEN
    ALTER TABLE messages ADD COLUMN attachments jsonb DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'metadata') THEN
    ALTER TABLE messages ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'reply_to_id') THEN
    ALTER TABLE messages ADD COLUMN reply_to_id uuid;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'edited_at') THEN
    ALTER TABLE messages ADD COLUMN edited_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_deleted') THEN
    ALTER TABLE messages ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'deleted_at') THEN
    ALTER TABLE messages ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- Add the foreign key relationship for reply_to_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.table_constraints
    WHERE  constraint_name = 'messages_reply_to_id_fkey'
    AND    table_name = 'messages'
  )
  THEN
    ALTER TABLE messages
    ADD CONSTRAINT messages_reply_to_id_fkey
    FOREIGN KEY (reply_to_id)
    REFERENCES messages(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL, -- emoji or reaction name
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Create message status table for read receipts and delivery status
CREATE TABLE IF NOT EXISTS message_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
  timestamp timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create typing indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_typing boolean DEFAULT false,
  started_typing_at timestamptz DEFAULT now(),
  last_typing_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id),
  UNIQUE(room_id, user_id),
  CHECK ((conversation_id IS NOT NULL AND room_id IS NULL) OR (conversation_id IS NULL AND room_id IS NOT NULL))
);

-- Create broadcast channels table for system-wide announcements
CREATE TABLE IF NOT EXISTS broadcast_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name text UNIQUE NOT NULL,
  description text,
  channel_type text CHECK (channel_type IN ('system', 'announcements', 'maintenance', 'promotions', 'emergency')) DEFAULT 'system',
  target_roles text[] DEFAULT '{}', -- which user roles can receive broadcasts
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create broadcast messages table
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES broadcast_channels(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  message_data jsonb DEFAULT '{}',
  priority text CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  expires_at timestamptz,
  sent_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  sent_at timestamptz DEFAULT now(),
  target_users uuid[] DEFAULT '{}', -- specific users if not broadcast to all
  delivery_stats jsonb DEFAULT '{"sent": 0, "delivered": 0, "read": 0}'
);

-- Create user chat settings table
CREATE TABLE IF NOT EXISTS user_chat_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  notification_preferences jsonb DEFAULT '{
    "push_notifications": true,
    "email_notifications": false,
    "sound_enabled": true,
    "vibration_enabled": true,
    "quiet_hours": {"enabled": false, "start": "22:00", "end": "08:00"},
    "mention_notifications": true,
    "direct_message_notifications": true,
    "group_message_notifications": true
  }',
  privacy_settings jsonb DEFAULT '{
    "show_online_status": true,
    "show_last_seen": true,
    "allow_direct_messages": true,
    "read_receipts": true
  }',
  theme_preferences jsonb DEFAULT '{
    "theme": "system",
    "message_bubble_style": "modern",
    "font_size": "medium"
  }',
  blocked_users uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enhance conversations table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'conversation_type') THEN
    ALTER TABLE conversations ADD COLUMN conversation_type text CHECK (conversation_type IN ('direct', 'support', 'consultation')) DEFAULT 'direct';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'metadata') THEN
    ALTER TABLE conversations ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'is_archived') THEN
    ALTER TABLE conversations ADD COLUMN is_archived boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'last_message_at') THEN
    ALTER TABLE conversations ADD COLUMN last_message_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chat_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_presence
CREATE POLICY "Users can read all presence data"
  ON user_presence
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own presence"
  ON user_presence
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for chat_rooms
CREATE POLICY "Users can read public rooms"
  ON chat_rooms
  FOR SELECT
  TO authenticated
  USING (
    NOT is_private 
    OR EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = id 
      AND rm.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create rooms"
  ON chat_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Room owners and admins can update rooms"
  ON chat_rooms
  FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = id 
      AND rm.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      AND rm.role IN ('owner', 'admin')
    )
  );

-- Helper function to check room membership (breaks RLS recursion)
CREATE OR REPLACE FUNCTION is_room_member(p_room_id uuid, p_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = p_room_id AND user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get user role in a room (breaks RLS recursion)
CREATE OR REPLACE FUNCTION get_user_role_in_room(p_room_id uuid, p_user_id uuid)
RETURNS text AS $$
  SELECT role FROM public.room_members
  WHERE room_id = p_room_id AND user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies for room_members
DROP POLICY IF EXISTS "Room members can read membership" ON room_members;
CREATE POLICY "Room members can read membership"
  ON room_members
  FOR SELECT
  TO authenticated
  USING (
    is_room_member(room_members.room_id, (SELECT id FROM profiles WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Room admins can manage members" ON room_members;
CREATE POLICY "Room admins can manage members"
  ON room_members
  FOR ALL
  TO authenticated
  USING (
    get_user_role_in_room(room_members.room_id, (SELECT id FROM profiles WHERE user_id = auth.uid())) IN ('owner', 'admin')
  )
  WITH CHECK (
    get_user_role_in_room(room_members.room_id, (SELECT id FROM profiles WHERE user_id = auth.uid())) IN ('owner', 'admin')
  );

-- Enhanced RLS Policies for messages (update existing)
DROP POLICY IF EXISTS "Users can read their messages" ON messages;
CREATE POLICY "Users can read their messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR recipient_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR (
      room_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM room_members rm 
        WHERE rm.room_id = messages.room_id 
        AND rm.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND (
      (conversation_id IS NOT NULL AND room_id IS NULL)
      OR (
        room_id IS NOT NULL 
        AND conversation_id IS NULL
        AND EXISTS (
          SELECT 1 FROM room_members rm 
          WHERE rm.room_id = messages.room_id 
          AND rm.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
          AND (rm.permissions->>'can_send_messages')::boolean = true
        )
      )
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for message_reactions
CREATE POLICY "Users can read reactions"
  ON message_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.id = message_id 
      AND (
        m.sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR m.recipient_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR (
          m.room_id IS NOT NULL 
          AND EXISTS (
            SELECT 1 FROM room_members rm 
            WHERE rm.room_id = m.room_id 
            AND rm.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
          )
        )
      )
    )
  );

CREATE POLICY "Users can manage own reactions"
  ON message_reactions
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for message_status
CREATE POLICY "Users can read message status"
  ON message_status
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.id = message_id 
      AND m.sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own message status"
  ON message_status
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for typing_indicators
CREATE POLICY "Users can read typing indicators"
  ON typing_indicators
  FOR SELECT
  TO authenticated
  USING (
    (
      conversation_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM conversations c 
        WHERE c.id = conversation_id 
        AND (
          c.participant1_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR c.participant2_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
      )
    )
    OR (
      room_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM room_members rm 
        WHERE rm.room_id = typing_indicators.room_id 
        AND rm.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can manage own typing indicators"
  ON typing_indicators
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for broadcast_channels
CREATE POLICY "Users can read active broadcast channels"
  ON broadcast_channels
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage broadcast channels"
  ON broadcast_channels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for broadcast_messages
CREATE POLICY "Users can read relevant broadcast messages"
  ON broadcast_messages
  FOR SELECT
  TO authenticated
  USING (
    (target_users = '{}' OR (SELECT id FROM profiles WHERE user_id = auth.uid()) = ANY(target_users))
    AND (expires_at IS NULL OR expires_at > now())
    AND EXISTS (
      SELECT 1 FROM broadcast_channels bc 
      WHERE bc.id = channel_id 
      AND bc.is_active = true
      AND (
        bc.target_roles = '{}' 
        OR EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.user_id = auth.uid() 
          AND p.role = ANY(bc.target_roles)
        )
      )
    )
  );

-- RLS Policies for user_chat_settings
CREATE POLICY "Users can manage own chat settings"
  ON user_chat_settings
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_type_category ON chat_rooms(room_type, category);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_archived ON chat_rooms(is_archived);

CREATE INDEX IF NOT EXISTS idx_room_members_room_user ON room_members(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_role ON room_members(role);

CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_message_status_message_user ON message_status(message_id, user_id);
CREATE INDEX IF NOT EXISTS idx_message_status_status ON message_status(status);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_room ON typing_indicators(room_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user ON typing_indicators(user_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_messages_channel ON broadcast_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_sent_at ON broadcast_messages(sent_at);

-- Create functions for real-time operations

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id uuid,
  p_status text,
  p_activity text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_custom_message text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, current_activity, location_context, last_seen, updated_at)
  VALUES (p_user_id, p_status, p_activity, p_location, now(), now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    status = EXCLUDED.status,
    current_activity = EXCLUDED.current_activity,
    location_context = EXCLUDED.location_context,
    last_seen = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get online users in a room
CREATE OR REPLACE FUNCTION get_online_room_members(p_room_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  status text,
  current_activity text,
  last_seen timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    up.status,
    up.current_activity,
    up.last_seen
  FROM room_members rm
  JOIN profiles p ON p.id = rm.user_id
  LEFT JOIN user_presence up ON up.user_id = p.id
  WHERE rm.room_id = p_room_id
  AND (up.status IN ('online', 'away', 'busy') OR up.status IS NULL)
  ORDER BY up.last_seen DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_user_id uuid,
  p_conversation_id uuid,
  p_room_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update message status for conversation or room
  INSERT INTO message_status (message_id, user_id, status, timestamp)
  SELECT m.id, p_user_id, 'read', now()
  FROM messages m
  WHERE (
    (p_conversation_id IS NOT NULL AND m.conversation_id = p_conversation_id)
    OR (p_room_id IS NOT NULL AND m.room_id = p_room_id)
  )
  AND m.sender_id != p_user_id
  ON CONFLICT (message_id, user_id) 
  DO UPDATE SET 
    status = 'read',
    timestamp = now();
    
  -- Update last_read_at for room members
  IF p_room_id IS NOT NULL THEN
    UPDATE room_members 
    SET last_read_at = now()
    WHERE room_id = p_room_id AND user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE last_typing_at < now() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message counts
CREATE OR REPLACE FUNCTION get_unread_counts(p_user_id uuid)
RETURNS TABLE (
  conversation_id uuid,
  room_id uuid,
  unread_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.conversation_id,
    m.room_id,
    COUNT(*) as unread_count
  FROM messages m
  LEFT JOIN message_status ms ON ms.message_id = m.id AND ms.user_id = p_user_id
  WHERE m.sender_id != p_user_id
  AND (ms.status IS NULL OR ms.status != 'read')
  AND (
    (m.conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = m.conversation_id 
      AND (c.participant1_id = p_user_id OR c.participant2_id = p_user_id)
    ))
    OR (m.room_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = m.room_id AND rm.user_id = p_user_id
    ))
  )
  GROUP BY m.conversation_id, m.room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic updates

-- Trigger to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversations 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Trigger to automatically create message status entries
CREATE OR REPLACE FUNCTION create_message_status()
RETURNS TRIGGER AS $$
BEGIN
  -- For direct conversations
  IF NEW.conversation_id IS NOT NULL THEN
    INSERT INTO message_status (message_id, user_id, status)
    SELECT NEW.id, NEW.recipient_id, 'sent'
    WHERE NEW.sender_id != NEW.recipient_id;
  END IF;
  
  -- For room messages
  IF NEW.room_id IS NOT NULL THEN
    INSERT INTO message_status (message_id, user_id, status)
    SELECT NEW.id, rm.user_id, 'sent'
    FROM room_members rm
    WHERE rm.room_id = NEW.room_id
    AND rm.user_id != NEW.sender_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_message_status
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_status();

-- Create default broadcast channels
INSERT INTO broadcast_channels (channel_name, description, channel_type, target_roles, created_by)
VALUES 
  ('system_announcements', 'System-wide announcements', 'announcements', '{"client", "trainer", "nutritionist", "admin", "hr"}', NULL),
  ('maintenance_alerts', 'Maintenance and downtime notifications', 'maintenance', '{"client", "trainer", "nutritionist", "admin", "hr"}', NULL),
  ('trainer_updates', 'Updates for trainers', 'announcements', '{"trainer", "admin"}', NULL),
  ('client_promotions', 'Promotional messages for clients', 'promotions', '{"client"}', NULL),
  ('emergency_alerts', 'Emergency notifications', 'emergency', '{"client", "trainer", "nutritionist", "admin", "hr"}', NULL)
ON CONFLICT (channel_name) DO NOTHING;

-- Create default chat rooms
INSERT INTO chat_rooms (name, description, room_type, category, is_private, created_by)
VALUES 
  ('General Discussion', 'General chat for all users', 'group', 'general', false, NULL),
  ('Trainer Support', 'Support channel for trainers', 'support', 'training', true, NULL),
  ('Nutrition Tips', 'Share nutrition tips and advice', 'group', 'nutrition', false, NULL),
  ('Client Success Stories', 'Share your fitness journey', 'community', 'community', false, NULL)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create a scheduled job to clean up old typing indicators (if pg_cron is available)
-- SELECT cron.schedule('cleanup-typing-indicators', '*/1 * * * *', 'SELECT cleanup_typing_indicators();');

COMMENT ON TABLE user_presence IS 'Tracks real-time user presence and activity status';
COMMENT ON TABLE chat_rooms IS 'Group chat rooms with role-based access';
COMMENT ON TABLE room_members IS 'Room membership with permissions and settings';
COMMENT ON TABLE message_reactions IS 'Emoji reactions to messages';
COMMENT ON TABLE message_status IS 'Message delivery and read status tracking';
COMMENT ON TABLE typing_indicators IS 'Real-time typing indicators';
COMMENT ON TABLE broadcast_channels IS 'System-wide broadcast channels';
COMMENT ON TABLE broadcast_messages IS 'Broadcast messages and announcements';
COMMENT ON TABLE user_chat_settings IS 'User chat preferences and settings';
