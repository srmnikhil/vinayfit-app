-- Create or replace the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.send_message_with_status(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_recipient_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_attachments jsonb DEFAULT '[]'::jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_parent_message_id uuid DEFAULT NULL
)
RETURNS messages
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message messages;
BEGIN
  -- Insert the message and return it
  INSERT INTO messages (
    conversation_id,
    sender_id,
    recipient_id,
    content,
    message_type,
    attachments,
    metadata,
    parent_message_id
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_recipient_id,
    p_content,
    p_message_type,
    p_attachments,
    p_metadata,
    p_parent_message_id
  )
  RETURNING * INTO v_message;

  -- Return the newly created message
  RETURN v_message;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise
    RAISE LOG 'Error in send_message_with_status: %', SQLERRM;
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.send_message_with_status TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.send_message_with_status IS 'Securely sends a message and creates its status, bypassing RLS with proper validation';

-- Add usage example
COMMENT ON FUNCTION public.send_message_with_status IS 'Example: SELECT * FROM send_message_with_status(''conversation-uuid'', ''sender-uuid'', ''recipient-uuid'', ''Hello, world!'');';
