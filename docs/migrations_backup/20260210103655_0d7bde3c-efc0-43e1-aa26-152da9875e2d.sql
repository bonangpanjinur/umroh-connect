
-- Tabel shop_categories
CREATE TABLE public.shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabel shop_products
CREATE TABLE public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  compare_price NUMERIC,
  stock INT NOT NULL DEFAULT 0,
  weight_gram INT,
  thumbnail_url TEXT,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabel shop_carts
CREATE TABLE public.shop_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabel shop_cart_items
CREATE TABLE public.shop_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.shop_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(cart_id, product_id)
);

-- Tabel shop_orders
CREATE TABLE public.shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_code TEXT NOT NULL UNIQUE,
  status public.shop_order_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  notes TEXT,
  payment_proof_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabel shop_order_items
CREATE TABLE public.shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price NUMERIC NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

-- RLS: shop_categories
CREATE POLICY "Anyone can view active categories" ON public.shop_categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin/shop_admin manage categories" ON public.shop_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'shop_admin'));

-- RLS: shop_products
CREATE POLICY "Anyone can view active products" ON public.shop_products
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin/shop_admin manage products" ON public.shop_products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'shop_admin'));

-- RLS: shop_carts
CREATE POLICY "Users manage own cart" ON public.shop_carts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS: shop_cart_items
CREATE POLICY "Users manage own cart items" ON public.shop_cart_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shop_carts WHERE id = cart_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shop_carts WHERE id = cart_id AND user_id = auth.uid()));

-- RLS: shop_orders
CREATE POLICY "Users view own orders" ON public.shop_orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'shop_admin'));
CREATE POLICY "Users create own orders" ON public.shop_orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin/shop_admin update orders" ON public.shop_orders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'shop_admin'));

-- RLS: shop_order_items
CREATE POLICY "Users view own order items" ON public.shop_order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shop_orders WHERE id = order_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'shop_admin'))));
CREATE POLICY "Users create order items" ON public.shop_order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.shop_orders WHERE id = order_id AND user_id = auth.uid()));

-- Triggers updated_at
CREATE TRIGGER update_shop_categories_updated_at BEFORE UPDATE ON public.shop_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_products_updated_at BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_carts_updated_at BEFORE UPDATE ON public.shop_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_orders_updated_at BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function generate shop order code
CREATE OR REPLACE FUNCTION public.generate_shop_order_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE new_code TEXT; code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'SH-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));
    SELECT EXISTS (SELECT 1 FROM public.shop_orders WHERE order_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END; $$;

-- Trigger auto set order code
CREATE OR REPLACE FUNCTION public.set_shop_order_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
    NEW.order_code := generate_shop_order_code();
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER set_shop_order_code_trigger BEFORE INSERT ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_shop_order_code();

-- Trigger update stok
CREATE OR REPLACE FUNCTION public.update_shop_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status = 'pending' THEN
    UPDATE public.shop_products sp SET stock = stock - soi.quantity
    FROM public.shop_order_items soi WHERE soi.order_id = NEW.id AND sp.id = soi.product_id;
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status IN ('paid', 'processing') THEN
    UPDATE public.shop_products sp SET stock = stock + soi.quantity
    FROM public.shop_order_items soi WHERE soi.order_id = NEW.id AND sp.id = soi.product_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER update_shop_stock_trigger AFTER UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_shop_stock();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-images', 'shop-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read shop-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'shop-images');
CREATE POLICY "Admin upload shop-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'shop_admin')));
CREATE POLICY "Admin update shop-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'shop-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'shop_admin')));
CREATE POLICY "Admin delete shop-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'shop-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'shop_admin')));
