-- Add thumbnail_url column to workout_templates table
-- This migration adds support for thumbnail images in workout templates

-- Add thumbnail_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workout_templates' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE workout_templates ADD COLUMN thumbnail_url text;
  END IF;
END $$;

-- Add image_url column if it doesn't exist (for consistency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workout_templates' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE workout_templates ADD COLUMN image_url text;
  END IF;
END $$;

-- Add comment to document the new columns
COMMENT ON COLUMN workout_templates.thumbnail_url IS 'URL to the thumbnail image for the workout template';
COMMENT ON COLUMN workout_templates.image_url IS 'URL to the main image for the workout template'; 