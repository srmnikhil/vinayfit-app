/*
  # Fix Training Sessions Type Column Issue
  
  This migration fixes the issue where the training_sessions table
  has a NOT NULL constraint on the type column but the application
  is trying to insert records without providing this value.
*/

-- First, let's check if the session_type column exists and add it if needed
DO $$
BEGIN
  -- Add session_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'session_type'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN session_type text;
  END IF;
END $$;

-- Update existing records to have a default type if they don't have one
UPDATE training_sessions 
SET type = 'personal_training' 
WHERE type IS NULL;

-- Make the type column nullable to prevent future issues
ALTER TABLE training_sessions ALTER COLUMN type DROP NOT NULL;

-- Add a default value for the type column
ALTER TABLE training_sessions ALTER COLUMN type SET DEFAULT 'personal_training';

-- Add a check constraint to ensure valid session types
ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS training_sessions_type_check;
ALTER TABLE training_sessions ADD CONSTRAINT training_sessions_type_check 
  CHECK (type IN ('personal_training', 'group_training', 'assessment', 'consultation', 'strength_training', 'cardio', 'hiit', 'flexibility', 'rehabilitation'));

-- Add a comment to document the fix
COMMENT ON COLUMN training_sessions.type IS 'Session type with default personal_training. Can be null for backward compatibility.'; 