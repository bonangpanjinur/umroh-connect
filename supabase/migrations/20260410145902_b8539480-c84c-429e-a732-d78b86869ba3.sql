-- FIX 1: Hapus privilege escalation - user tidak boleh self-assign role
DROP POLICY IF EXISTS "Users can request agent role" ON public.user_roles;

-- FIX 2: Profiles - restrict SELECT, block anonymous access
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can view basic profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- FIX 3: group_locations - fix self-reference bug (gl.group_id = gl.group_id was always true)
DROP POLICY IF EXISTS "Group members can view all locations in their group" ON public.group_locations;
CREATE POLICY "Group members can view locations in their group" ON public.group_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_locations gl
      WHERE gl.group_id = group_locations.group_id
        AND gl.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.tracking_groups tg
      WHERE tg.id = group_locations.group_id
        AND tg.created_by = auth.uid()
    )
  );

-- FIX 5: Journal photos - restrict to owner only
DROP POLICY IF EXISTS "Anyone can view journal photos" ON storage.objects;
CREATE POLICY "Users can view own journal photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'journal-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- FIX 6: Uploads bucket - add path ownership
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
DROP POLICY IF EXISTS "Public can view uploads" ON storage.objects;
CREATE POLICY "Authenticated can view own uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );