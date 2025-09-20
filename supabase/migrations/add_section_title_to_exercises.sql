-- Add section_title field to exercises table
-- This field will be used for grouping exercises in workout templates

ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS section_title text;

-- Add comment to explain the field
COMMENT ON COLUMN exercises.section_title IS 'Optional section title for grouping exercises in workout templates (e.g., Warm Up, Strength, Cool Down)';

-- Create index for better query performance when filtering by section_title
CREATE INDEX IF NOT EXISTS idx_exercises_section_title ON exercises(section_title); 