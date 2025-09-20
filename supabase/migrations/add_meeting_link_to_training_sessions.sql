-- Add meeting_link column to training_sessions table
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS meeting_link text;

-- Update the status check constraint to include 'confirmed' status
-- First drop the existing constraint
ALTER TABLE training_sessions 
DROP CONSTRAINT IF EXISTS training_sessions_status_check;

-- Add the new constraint with 'confirmed' status
ALTER TABLE training_sessions 
ADD CONSTRAINT training_sessions_status_check 
CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- Add comment for the meeting_link column
COMMENT ON COLUMN training_sessions.meeting_link IS 'Meeting link for virtual or hybrid training sessions';
