CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user_id_1 uuid,
  user_id_2 uuid
)
RETURNS TABLE (
  id uuid,
  participant1_id uuid,
  participant2_id uuid,
  created_at timestamptz,
  last_message_at timestamptz
) AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Use LEAST and GREATEST to ensure consistent participant order
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  WHERE LEAST(c.participant1_id, c.participant2_id) = LEAST(user_id_1, user_id_2)
    AND GREATEST(c.participant1_id, c.participant2_id) = GREATEST(user_id_1, user_id_2);

  -- If no conversation exists, create a new one
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (participant1_id, participant2_id)
    VALUES (LEAST(user_id_1, user_id_2), GREATEST(user_id_1, user_id_2))
    RETURNING conversations.id INTO v_conversation_id;
  END IF;

  -- Return the conversation
  RETURN QUERY
  SELECT c.id, c.participant1_id, c.participant2_id, c.created_at, c.last_message_at
  FROM conversations c
  WHERE c.id = v_conversation_id;
END;
$$ LANGUAGE plpgsql;
