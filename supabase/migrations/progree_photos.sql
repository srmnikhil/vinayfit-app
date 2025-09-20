/*
  # Progress Photos Schema

  1. New Tables
    - `progress_photos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `image_url` (text, URL to stored image)
      - `weight` (decimal, optional)
      - `body_fat` (decimal, optional)
      - `muscle_percentage` (decimal, optional)
      - `measurements` (jsonb, for chest, waist, hips, arms, thighs)
      - `date` (date, when photo was taken)
      - `time` (time, when photo was taken)
      - `tags` (text array, for categorization)
      - `pose` (text, front/side/back/custom)
      - `notes` (text, optional)
      - `mood` (text, motivated/confident/determined/proud/focused)
      - `is_favorite` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create storage bucket for progress photos
    - Set up RLS policies for secure access

  3. Security
    - Enable RLS on progress_photos table
    - Add policies for authenticated users to manage their own photos
    - Set up storage policies for image uploads
*/

-- Create the progress_photos table
CREATE TABLE IF NOT EXISTS progress_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  weight decimal(5,2),
  body_fat decimal(4,2),
  muscle_percentage decimal(4,2),
  measurements jsonb DEFAULT '{}',
  date date NOT NULL DEFAULT CURRENT_DATE,
  time time NOT NULL DEFAULT CURRENT_TIME,
  tags text[] DEFAULT '{}',
  pose text NOT NULL DEFAULT 'front' CHECK (pose IN ('front', 'side', 'back', 'custom')),
  notes text,
  mood text DEFAULT 'motivated' CHECK (mood IN ('motivated', 'confident', 'determined', 'proud', 'focused')),
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own progress photos"
  ON progress_photos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress photos"
  ON progress_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress photos"
  ON progress_photos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress photos"
  ON progress_photos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for progress photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('progress-photos', 'progress-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can view their own progress photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own progress photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own progress photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own progress photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_progress_photos_updated_at
  BEFORE UPDATE ON progress_photos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS progress_photos_user_id_idx ON progress_photos(user_id);
CREATE INDEX IF NOT EXISTS progress_photos_date_idx ON progress_photos(date DESC);
CREATE INDEX IF NOT EXISTS progress_photos_created_at_idx ON progress_photos(created_at DESC);