-- Create storage bucket for travel logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('travel-logos', 'travel-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload travel logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'travel-logos');

-- Allow anyone to view travel logos (public bucket)
CREATE POLICY "Anyone can view travel logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'travel-logos');

-- Allow owners and admins to update/delete their logos
CREATE POLICY "Owners can update travel logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'travel-logos');

CREATE POLICY "Owners can delete travel logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'travel-logos');