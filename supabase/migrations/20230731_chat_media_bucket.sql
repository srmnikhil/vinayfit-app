-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('chat-media', 'chat-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'application/octet-stream'])
ON CONFLICT (id) DO NOTHING;

-- Policy for authenticated users to upload files to chat-media bucket
CREATE POLICY "Allow authenticated uploads to chat-media"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'chat-media' AND
    (auth.role() = 'authenticated')
  );

-- Policy for public read access to chat-media bucket
CREATE POLICY "Allow public read access to chat-media"
  ON storage.objects FOR SELECT TO public USING (
    bucket_id = 'chat-media'
  );

-- Policy for users to delete their own chat media
CREATE POLICY "Allow users to delete their own chat media"
  ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'chat-media' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

-- Add comment to indicate successful setup
COMMENT ON SCHEMA storage IS 'Storage setup completed for chat media';
