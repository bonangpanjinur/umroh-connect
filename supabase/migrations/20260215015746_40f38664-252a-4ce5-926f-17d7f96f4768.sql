
-- Add 'seller' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';

-- Seller applications (like agent applications)
CREATE TABLE public.seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shop_name text NOT NULL,
  description text,
  phone text NOT NULL,
  whatsapp text,
  email text,
  address text,
  documents text[],
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own application" ON public.seller_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own application" ON public.seller_applications
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all applications" ON public.seller_applications
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seller profiles (store info)
CREATE TABLE public.seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  shop_name text NOT NULL,
  shop_description text,
  logo_url text,
  banner_url text,
  phone text,
  whatsapp text,
  address text,
  city text,
  is_verified boolean DEFAULT false,
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sellers" ON public.seller_profiles
  FOR SELECT USING (is_active = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own seller profile" ON public.seller_profiles
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all seller profiles" ON public.seller_profiles
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own seller profile" ON public.seller_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seller membership tiers
CREATE TABLE public.seller_membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  max_products integer NOT NULL DEFAULT 5,
  max_featured integer NOT NULL DEFAULT 0,
  price_monthly bigint NOT NULL DEFAULT 0,
  price_yearly bigint NOT NULL DEFAULT 0,
  features text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.seller_membership_plans
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage plans" ON public.seller_membership_plans
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seller memberships (active subscription)
CREATE TABLE public.seller_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.seller_membership_plans(id),
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  payment_proof_url text,
  amount bigint DEFAULT 0,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own membership" ON public.seller_memberships
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM seller_profiles sp WHERE sp.id = seller_id AND sp.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Sellers can create own membership" ON public.seller_memberships
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM seller_profiles sp WHERE sp.id = seller_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all memberships" ON public.seller_memberships
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seller credits
CREATE TABLE public.seller_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL UNIQUE REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  credits_remaining integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  last_purchase_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own credits" ON public.seller_credits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM seller_profiles sp WHERE sp.id = seller_id AND sp.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage all credits" ON public.seller_credits
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seller credit transactions
CREATE TABLE public.seller_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  transaction_type text NOT NULL,
  product_id uuid,
  price bigint,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own transactions" ON public.seller_credit_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM seller_profiles sp WHERE sp.id = seller_id AND sp.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage all transactions" ON public.seller_credit_transactions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add seller_id to shop_products
ALTER TABLE public.shop_products ADD COLUMN seller_id uuid REFERENCES public.seller_profiles(id);

-- Featured products table
CREATE TABLE public.seller_featured_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  position text DEFAULT 'homepage',
  priority integer DEFAULT 0,
  credits_used integer DEFAULT 1,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_featured_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active featured" ON public.seller_featured_products
  FOR SELECT USING (status = 'active' AND start_date <= now() AND end_date >= now());

CREATE POLICY "Sellers can manage own featured" ON public.seller_featured_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM seller_profiles sp WHERE sp.id = seller_id AND sp.user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all featured" ON public.seller_featured_products
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seller reviews
CREATE TABLE public.seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.shop_orders(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_published boolean DEFAULT true,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reviews" ON public.seller_reviews
  FOR SELECT USING (is_published = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create reviews" ON public.seller_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.seller_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.seller_reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.seller_reviews
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to update seller rating
CREATE OR REPLACE FUNCTION public.update_seller_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC;
  total_reviews INTEGER;
BEGIN
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO avg_rating, total_reviews
  FROM public.seller_reviews
  WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id)
    AND is_published = true;

  UPDATE public.seller_profiles
  SET rating = ROUND(avg_rating, 2),
      review_count = total_reviews
  WHERE id = COALESCE(NEW.seller_id, OLD.seller_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_seller_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.seller_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_seller_rating();

-- Update shop_products RLS: sellers can manage their own products
CREATE POLICY "Sellers can manage own products" ON public.shop_products
  FOR ALL USING (
    seller_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM seller_profiles sp WHERE sp.id = seller_id AND sp.user_id = auth.uid())
  );

-- Add seller_id to shop_orders for tracking
ALTER TABLE public.shop_orders ADD COLUMN seller_id uuid REFERENCES public.seller_profiles(id);

-- Seed default membership plans
INSERT INTO public.seller_membership_plans (name, description, max_products, max_featured, price_monthly, price_yearly, features, sort_order) VALUES
('Starter', 'Mulai jualan dengan fitur dasar', 5, 0, 0, 0, ARRAY['5 produk aktif', 'Dashboard dasar'], 1),
('Business', 'Untuk seller serius', 20, 3, 99000, 999000, ARRAY['20 produk aktif', '3 slot iklan/bulan', 'Badge Verified', 'Statistik penjualan'], 2),
('Enterprise', 'Untuk seller profesional', 100, 10, 249000, 2499000, ARRAY['100 produk aktif', '10 slot iklan/bulan', 'Badge Premium', 'Statistik lengkap', 'Prioritas support'], 3);

-- Triggers for updated_at
CREATE TRIGGER update_seller_profiles_updated_at BEFORE UPDATE ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seller_applications_updated_at BEFORE UPDATE ON public.seller_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seller_memberships_updated_at BEFORE UPDATE ON public.seller_memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seller_credits_updated_at BEFORE UPDATE ON public.seller_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seller_featured_updated_at BEFORE UPDATE ON public.seller_featured_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
