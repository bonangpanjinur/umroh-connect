
-- 1. PROFILES: Remove overly permissive policy, create public view
DROP POLICY IF EXISTS "Authenticated can view basic profiles" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles AS 
  SELECT user_id, full_name, avatar_url FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- 2. TRAVELS: Create public view hiding internal fields
CREATE OR REPLACE VIEW public.public_travels AS 
  SELECT id, owner_id, name, description, logo_url, address, phone, whatsapp, email,
         rating, review_count, verified, verified_at, status, created_at, updated_at
  FROM public.travels;

GRANT SELECT ON public.public_travels TO authenticated;
GRANT SELECT ON public.public_travels TO anon;

-- 3. STORAGE: travel-logos ownership for UPDATE/DELETE
DROP POLICY IF EXISTS "Owners can update travel logos" ON storage.objects;
CREATE POLICY "Owners can update travel logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'travel-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owners can delete travel logos" ON storage.objects;
CREATE POLICY "Owners can delete travel logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'travel-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 4. STORAGE: package-images ownership for UPDATE/DELETE
DROP POLICY IF EXISTS "Users can update own package images" ON storage.objects;
CREATE POLICY "Users can update own package images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'package-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own package images" ON storage.objects;
CREATE POLICY "Users can delete own package images" ON storage.objects
  FOR DELETE USING (bucket_id = 'package-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 5. PLATFORM SETTINGS: Remove duplicate policies
DROP POLICY IF EXISTS "Anyone can view settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.platform_settings;

-- 6. QURAN SYNC LOGS: Restrict to admin only
DROP POLICY IF EXISTS "Anyone can read sync logs" ON public.quran_sync_logs;
CREATE POLICY "Admins can read sync logs" ON public.quran_sync_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 7. DEPARTURE NOTIFICATION LOGS: Add INSERT policy
DROP POLICY IF EXISTS "Service can insert notification logs" ON public.departure_notification_logs;
CREATE POLICY "Authenticated can insert notification logs" ON public.departure_notification_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
