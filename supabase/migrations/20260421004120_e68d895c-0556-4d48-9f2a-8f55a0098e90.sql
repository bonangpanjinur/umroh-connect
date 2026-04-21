-- ============================================================
-- Phase 5: Storage Lockdown
-- ============================================================

-- 1) Create new private bucket for sensitive uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('private-uploads', 'private-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- 2) RLS for private-uploads (path = {user_id}/...)
DROP POLICY IF EXISTS "private_uploads_owner_insert" ON storage.objects;
CREATE POLICY "private_uploads_owner_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'private-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "private_uploads_owner_select" ON storage.objects;
CREATE POLICY "private_uploads_owner_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'private-uploads'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

DROP POLICY IF EXISTS "private_uploads_owner_update" ON storage.objects;
CREATE POLICY "private_uploads_owner_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'private-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "private_uploads_owner_delete" ON storage.objects;
CREATE POLICY "private_uploads_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'private-uploads'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- 3) travel-logos: ownership-based update/delete (path = {user_id}/...)
DROP POLICY IF EXISTS "travel_logos_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update travel logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete travel logos" ON storage.objects;
DROP POLICY IF EXISTS "travel_logos_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "travel_logos_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "travel_logos_owner_delete" ON storage.objects;

CREATE POLICY "travel_logos_owner_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'travel-logos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "travel_logos_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'travel-logos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- 4) package-images: ownership-based update/delete
DROP POLICY IF EXISTS "Authenticated users can update package images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete package images" ON storage.objects;
DROP POLICY IF EXISTS "package_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "package_images_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "package_images_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "package_images_owner_delete" ON storage.objects;

CREATE POLICY "package_images_owner_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'package-images'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "package_images_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'package-images'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- 5) haji-documents: tighten SELECT — only owner, agency owner, or admin
DROP POLICY IF EXISTS "Users can view own haji documents" ON storage.objects;
DROP POLICY IF EXISTS "haji_documents_view" ON storage.objects;

CREATE POLICY "haji_documents_view"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'haji-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.haji_registrations hr
      WHERE hr.user_id::text = (storage.foldername(storage.objects.name))[1]
        AND public.owns_travel(auth.uid(), hr.travel_id)
    )
  )
);