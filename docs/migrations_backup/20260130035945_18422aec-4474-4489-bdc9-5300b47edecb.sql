-- Premium subscription pricing (admin-managed)
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_yearly bigint NOT NULL DEFAULT 0,
  features text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User subscriptions
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'pending', -- pending, active, expired, cancelled
  payment_proof_url text,
  payment_amount bigint,
  payment_date timestamptz,
  verified_by uuid,
  verified_at timestamptz,
  start_date timestamptz,
  end_date timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage plans"
ON public.subscription_plans FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own subscription"
ON public.user_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can update own pending subscription"
ON public.user_subscriptions FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all subscriptions"
ON public.user_subscriptions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default premium plan
INSERT INTO public.subscription_plans (name, description, price_yearly, features)
VALUES (
  'Premium Ibadah Tracker',
  'Sinkronisasi data ibadah ke cloud, akses dari semua perangkat',
  99000,
  ARRAY['Sync data ke cloud', 'Backup otomatis', 'Akses multi-device', 'Statistik lengkap', 'Export data']
);

-- Add subscription price to platform_settings for easy admin access
INSERT INTO public.platform_settings (key, value, description)
VALUES ('subscription_price_yearly', '99000', 'Harga langganan tahunan fitur premium (dalam Rupiah)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;