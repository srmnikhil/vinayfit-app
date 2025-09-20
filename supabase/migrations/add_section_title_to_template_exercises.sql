-- Add section_title field to template_exercises table
-- This field will be used for storing custom section titles when adding exercises to templates

ALTER TABLE template_exercises 
ADD COLUMN IF NOT EXISTS section_title text;

-- Add comment to explain the field
COMMENT ON COLUMN template_exercises.section_title IS 'Custom section title for grouping exercises in workout templates (e.g., Warm Up, Strength, Cool Down)';

-- Create index for better query performance when filtering by section_title
CREATE INDEX IF NOT EXISTS idx_template_exercises_section_title ON template_exercises(section_title); 