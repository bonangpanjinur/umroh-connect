-- 1. Fix agent_website_settings RLS policies to allow authenticated users to insert/update their own settings
-- The previous policy might have issues if the user_id is not correctly handled during insert
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.agent_website_settings;
CREATE POLICY "Users can insert their own settings" 
ON public.agent_website_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.agent_website_settings;
CREATE POLICY "Users can update their own settings" 
ON public.agent_website_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Ensure platform_settings has the necessary keys for payment config
-- This avoids 404/400 errors when the Edge Function tries to fetch these keys
INSERT INTO public.platform_settings (key, value, description)
VALUES 
  ('payment_gateway', '{"provider": "manual", "isTestMode": true, "paymentMethods": []}', 'Konfigurasi gateway pembayaran otomatis'),
  ('qris_image_url', '""', 'URL gambar QRIS untuk pembayaran manual')
ON CONFLICT (key) DO NOTHING;

-- 3. Add index to agent_website_settings for performance
CREATE INDEX IF NOT EXISTS idx_agent_website_settings_user_id ON public.agent_website_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_website_settings_slug ON public.agent_website_settings(slug);

-- 4. Fix memberships table RLS to allow agents to see their own records more reliably
DROP POLICY IF EXISTS "Agents can view own membership" ON public.memberships;
CREATE POLICY "Agents can view own membership" ON public.memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.travels t
      JOIN public.profiles p ON t.owner_id = p.id
      WHERE t.id = memberships.travel_id AND p.user_id = auth.uid()
    )
  );

-- 5. Ensure travels table has correct RLS for agents
DROP POLICY IF EXISTS "Agents can create travel" ON public.travels;
CREATE POLICY "Agents can create travel"
ON public.travels FOR INSERT
WITH CHECK (
  owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
