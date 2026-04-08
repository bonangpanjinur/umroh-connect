-- Table for agent/travel memberships (subscription)
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'basic', -- 'basic', 'premium', 'enterprise'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'expired', 'cancelled'
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  amount BIGINT NOT NULL DEFAULT 0,
  payment_proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for banner advertisements
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'home', -- 'home', 'paket', 'detail'
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  travel_id UUID REFERENCES public.travels(id) ON DELETE SET NULL, -- if banner is from a travel agency
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for package posting credits/fees
CREATE TABLE public.package_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(travel_id)
);

-- Table for credit purchase transactions
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL, -- 'purchase', 'usage', 'bonus', 'refund'
  amount INTEGER NOT NULL, -- positive for purchase/bonus, negative for usage
  price BIGINT, -- price paid (only for purchases)
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL, -- which package used the credit
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for platform settings (monetization config)
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('membership_prices', '{"basic": 500000, "premium": 1500000, "enterprise": 5000000}', 'Harga keanggotaan per bulan'),
  ('credit_prices', '{"1": 50000, "5": 200000, "10": 350000, "25": 750000}', 'Harga kredit posting paket'),
  ('free_credits_on_register', '{"enabled": true, "amount": 3}', 'Kredit gratis saat mendaftar');

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for memberships
CREATE POLICY "Admins can manage all memberships" ON public.memberships
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view own membership" ON public.memberships
  FOR SELECT USING (owns_travel(auth.uid(), travel_id));

CREATE POLICY "Agents can request membership" ON public.memberships
  FOR INSERT WITH CHECK (owns_travel(auth.uid(), travel_id) AND status = 'pending');

-- RLS Policies for banners
CREATE POLICY "Anyone can view active banners" ON public.banners
  FOR SELECT USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can manage all banners" ON public.banners
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for package_credits
CREATE POLICY "Admins can manage all credits" ON public.package_credits
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view own credits" ON public.package_credits
  FOR SELECT USING (owns_travel(auth.uid(), travel_id));

-- RLS Policies for credit_transactions
CREATE POLICY "Admins can manage all transactions" ON public.credit_transactions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view own transactions" ON public.credit_transactions
  FOR SELECT USING (owns_travel(auth.uid(), travel_id));

CREATE POLICY "Agents can create usage transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (owns_travel(auth.uid(), travel_id) AND transaction_type = 'usage');

-- RLS Policies for platform_settings
CREATE POLICY "Anyone can view settings" ON public.platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.platform_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_package_credits_updated_at BEFORE UPDATE ON public.package_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();