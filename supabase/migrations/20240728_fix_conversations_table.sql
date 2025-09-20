-- Drop the existing conversations table to avoid conflicts
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS message_status CASCADE;

-- Recreate the conversations table with the correct schema
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Add a unique constraint to prevent duplicate conversations
  CONSTRAINT unique_conversation_participants 
    UNIQUE (participant1_id, participant2_id)
);

-- Create an index on participant columns for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant2_id);

-- Recreate the messages table with proper foreign key constraints
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  attachments jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz
);

-- Create an index on conversation_id for faster message lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);

-- Create message_status table
CREATE TABLE IF NOT EXISTS message_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'sent',
  timestamp timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create indexes for message_status
CREATE INDEX IF NOT EXISTS idx_message_status_message_id ON message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user_id ON message_status(user_id);

-- Set up Row Level Security (RLS) for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
DROP POLICY IF EXISTS "Users can read their conversations" ON conversations;
CREATE POLICY "Users can read their conversations"
  ON conversations FOR SELECT
  USING (
    participant1_id = auth.uid() OR 
    participant2_id = auth.uid()
  );

-- RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their messages" ON messages;
CREATE POLICY "Users can read their messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- RLS policies for message_status
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their message statuses" ON message_status;
CREATE POLICY "Users can read their message statuses"
  ON message_status FOR SELECT
  USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON message_status TO authenticated;

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at columns
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to update last_message_at when a new message is inserted
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_message_at
DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON messages;
CREATE TRIGGER update_conversation_last_message_trigger
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();
