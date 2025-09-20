-- Fix sets_config null/undefined values in template_exercises
-- This migration ensures all template exercises have valid sets_config data

-- Update any template_exercises with null or undefined sets_config
UPDATE template_exercises 
SET sets_config = '[
  {"reps": 10, "weight": 0, "rest_time": 60},
  {"reps": 10, "weight": 0, "rest_time": 60},
  {"reps": 10, "weight": 0, "rest_time": 60}
]'::jsonb
WHERE sets_config IS NULL OR sets_config = 'null'::jsonb OR sets_config = '[]'::jsonb;

-- Add a check constraint to prevent future null sets_config
ALTER TABLE template_exercises 
ADD CONSTRAINT template_exercises_sets_config_not_null 
CHECK (sets_config IS NOT NULL AND sets_config != 'null'::jsonb AND sets_config != '[]'::jsonb);

-- Add a comment to document the constraint
COMMENT ON CONSTRAINT template_exercises_sets_config_not_null ON template_exercises 
IS 'Ensures template exercises always have valid sets configuration data'; 