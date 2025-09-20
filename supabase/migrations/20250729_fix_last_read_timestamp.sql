-- Add last_read_at columns to the conversations table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'participant1_last_read_at') THEN
    ALTER TABLE public.conversations ADD COLUMN participant1_last_read_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'participant2_last_read_at') THEN
    ALTER TABLE public.conversations ADD COLUMN participant2_last_read_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create or replace the function to update the last_read_at timestamp for a user in a conversation
CREATE OR REPLACE FUNCTION public.update_last_read_timestamp(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  convo RECORD;
BEGIN
  -- Retrieve the conversation participants
  SELECT participant1_id, participant2_id
  INTO convo
  FROM public.conversations
  WHERE id = p_conversation_id;

  -- Update the appropriate timestamp
  IF convo.participant1_id = p_user_id THEN
    UPDATE public.conversations
    SET participant1_last_read_at = NOW()
    WHERE id = p_conversation_id;
  ELSIF convo.participant2_id = p_user_id THEN
    UPDATE public.conversations
    SET participant2_last_read_at = NOW()
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.update_last_read_timestamp(UUID, UUID) TO authenticated;
