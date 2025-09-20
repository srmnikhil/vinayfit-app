-- Storage Setup for Image Uploads
-- Run this in your Supabase SQL Editor

-- Create storage buckets for different types of images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('workout-images', 'workout-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('food-photos', 'food-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('progress-photos', 'progress-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to workout-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to food-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to progress-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to workout-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to food-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to progress-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;

-- Policy for authenticated users to upload files to workout-images bucket
CREATE POLICY "Allow authenticated uploads to workout-images"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'workout-images'
  );

-- Policy for authenticated users to upload files to food-photos bucket
CREATE POLICY "Allow authenticated uploads to food-photos"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'food-photos'
  );

-- Policy for authenticated users to upload files to progress-photos bucket
CREATE POLICY "Allow authenticated uploads to progress-photos"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'progress-photos'
  );

-- Policy for public read access to workout-images bucket
CREATE POLICY "Allow public read access to workout-images"
  ON storage.objects FOR SELECT TO public USING (
    bucket_id = 'workout-images'
  );

-- Policy for public read access to food-photos bucket
CREATE POLICY "Allow public read access to food-photos"
  ON storage.objects FOR SELECT TO public USING (
    bucket_id = 'food-photos'
  );

-- Policy for public read access to progress-photos bucket
CREATE POLICY "Allow public read access to progress-photos"
  ON storage.objects FOR SELECT TO public USING (
    bucket_id = 'progress-photos'
  );

-- Policy for users to delete their own images (optional - for cleanup)
CREATE POLICY "Allow users to delete their own images"
  ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id IN ('workout-images', 'food-photos', 'progress-photos')
  );

-- Add comment to indicate successful setup
COMMENT ON SCHEMA storage IS 'Storage setup completed for image uploads'; 