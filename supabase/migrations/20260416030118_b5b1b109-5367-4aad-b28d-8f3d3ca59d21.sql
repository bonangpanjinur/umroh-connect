-- Make journal-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'journal-photos';

-- Remove old public SELECT policy
DROP POLICY IF EXISTS "Anyone can view journal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own journal photos" ON storage.objects;

-- New: only owner can view their journal photos
CREATE POLICY "Users can view own journal photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'journal-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Update upload policy to enforce path ownership
DROP POLICY IF EXISTS "Authenticated users can upload journal photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload journal photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'journal-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );