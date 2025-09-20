-- Add last_read_at columns to the conversations table
ALTER TABLE public.conversations
ADD COLUMN participant1_last_read_at TIMESTAMPTZ,
ADD COLUMN participant2_last_read_at TIMESTAMPTZ;

-- Create a function to update the last_read_at timestamp for a user in a conversation
CREATE OR REPLACE FUNCTION public.update_last_read_timestamp(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.conversations
  SET
    participant1_last_read_at = CASE
      WHEN participant1_id = p_user_id THEN NOW()
      ELSE participant1_last_read_at
    END,
    participant2_last_read_at = CASE
      WHEN participant2_id = p_user_id THEN NOW()
      ELSE participant2_last_read_at
    END
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.update_last_read_timestamp(UUID, UUID) TO authenticated;
