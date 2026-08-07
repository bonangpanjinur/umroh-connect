-- 1. Restrict direct execution of internal trigger functions
REVOKE EXECUTE ON FUNCTION public.enforce_active_package_on_booking() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_package_status_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_departure_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_manifest_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_departure_low_seats() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_chat_message() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_order() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_order_status_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_seller_rating() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_shop_stock() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_travel_rating() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_profile_id(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_package_departures(uuid) FROM anon, PUBLIC;

-- 2. chat_notifications: only the SECURITY DEFINER trigger / service role may insert
DROP POLICY IF EXISTS "Authenticated users can insert chat notifications" ON public.chat_notifications;
REVOKE INSERT ON public.chat_notifications FROM anon, authenticated;
GRANT ALL ON public.chat_notifications TO service_role;

-- 3. Ownership helper for geofences
CREATE OR REPLACE FUNCTION public.can_manage_geofence(_user_id uuid, _geofence_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.geofences g
    WHERE g.id = _geofence_id
      AND (
        g.created_by = _user_id
        OR (g.travel_id IS NOT NULL AND public.owns_travel(_user_id, g.travel_id))
        OR EXISTS (
          SELECT 1 FROM public.tracking_groups tg
          WHERE tg.id = g.group_id AND tg.created_by = _user_id
        )
      )
  )
$$;
REVOKE EXECUTE ON FUNCTION public.can_manage_geofence(uuid, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_geofence(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_geofence_group_member(_user_id uuid, _geofence_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.geofences g
    JOIN public.group_locations gl ON gl.group_id = g.group_id
    WHERE g.id = _geofence_id AND gl.user_id = _user_id
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_geofence_group_member(uuid, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_geofence_group_member(uuid, uuid) TO authenticated, service_role;

-- 4. geofences: remove blanket agent role grants
DROP POLICY IF EXISTS "Creators can update their geofences" ON public.geofences;
CREATE POLICY "Owners can update their geofences"
ON public.geofences FOR UPDATE TO authenticated
USING (public.can_manage_geofence(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.can_manage_geofence(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Group creators and agents can create geofences" ON public.geofences;
CREATE POLICY "Group owners can create geofences"
ON public.geofences FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin')
    OR group_id IS NULL
    OR EXISTS (SELECT 1 FROM public.tracking_groups tg WHERE tg.id = group_id AND tg.created_by = auth.uid())
    OR (travel_id IS NOT NULL AND public.owns_travel(auth.uid(), travel_id))
  )
);

-- 5. geofence_alerts: scope inserts, reads and updates to owners/members
DROP POLICY IF EXISTS "Authenticated users can create alerts" ON public.geofence_alerts;
CREATE POLICY "Users can create their own alerts"
ON public.geofence_alerts FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    public.is_geofence_group_member(auth.uid(), geofence_id)
    OR public.can_manage_geofence(auth.uid(), geofence_id)
  )
);

DROP POLICY IF EXISTS "Users can view alerts for their groups" ON public.geofence_alerts;
CREATE POLICY "Members and owners can view alerts"
ON public.geofence_alerts FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.can_manage_geofence(auth.uid(), geofence_id)
  OR public.is_geofence_group_member(auth.uid(), geofence_id)
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Agents can acknowledge alerts" ON public.geofence_alerts;
CREATE POLICY "Owners can acknowledge alerts"
ON public.geofence_alerts FOR UPDATE TO authenticated
USING (public.can_manage_geofence(auth.uid(), geofence_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.can_manage_geofence(auth.uid(), geofence_id) OR public.has_role(auth.uid(), 'admin'));