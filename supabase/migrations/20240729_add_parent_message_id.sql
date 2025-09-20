ALTER TABLE messages
ADD COLUMN parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Optional: Add an index for faster lookups of replies
CREATE INDEX idx_parent_message_id ON messages(parent_message_id);
