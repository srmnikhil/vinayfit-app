-- Drop the existing unique constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS unique_conversation_participants;

-- Create a new unique index that enforces the order of participants
CREATE UNIQUE INDEX conversations_participants_idx ON conversations (LEAST(participant1_id, participant2_id), GREATEST(participant1_id, participant2_id));
