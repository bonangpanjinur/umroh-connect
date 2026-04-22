
-- 1. Make uploads bucket private
UPDATE storage.buckets SET public = false WHERE id = 'uploads';

-- 2. Tighten travel-logos UPDATE/DELETE with ownership check (folder = user_id)
DROP POLICY IF EXISTS "Owners can update travel logos" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete travel logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own travel logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own travel logos" ON storage.objects;

CREATE POLICY "Users can update own travel logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'travel-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own travel logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'travel-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Tighten package-images UPDATE/DELETE
DROP POLICY IF EXISTS "Users can update own package images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own package images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update package images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete package images" ON storage.objects;

CREATE POLICY "Users can update own package images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'package-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own package images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'package-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Restrict uploads bucket SELECT to owner only (no public)
DROP POLICY IF EXISTS "Public can view uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own uploads" ON storage.objects;

CREATE POLICY "Users can view own uploads"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'uploads' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- 5. Tighten haji-documents SELECT: owner, assigned travel agent, or admin
DROP POLICY IF EXISTS "haji_documents_view" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own haji documents" ON storage.objects;

CREATE POLICY "Owner agent or admin can view haji documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'haji-documents' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.haji_registrations hr
      JOIN public.profiles p ON hr.user_id = p.id
      WHERE p.user_id::text = (storage.foldername(name))[1]
        AND public.owns_travel(auth.uid(), hr.travel_id)
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);
