
-- Set search path
SET search_path = public;

-- 1. Ensure shop_order_status enum exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shop_order_status') THEN
    CREATE TYPE public.shop_order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ensure shop_orders table exists (dependency for shop_order_items)
CREATE TABLE IF NOT EXISTS public.shop_orders (
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

-- 3. Ensure shop_order_items table exists
CREATE TABLE IF NOT EXISTS public.shop_order_items (
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
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

-- 4. Apply/Fix Policies for shop_orders
DO $$
BEGIN
    DROP POLICY IF EXISTS "Sellers can view orders for their products" ON public.shop_orders;
    CREATE POLICY "Sellers can view orders for their products"
    ON public.shop_orders FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.shop_order_items soi
        JOIN public.shop_products sp ON soi.product_id = sp.id
        JOIN public.seller_profiles selp ON sp.seller_id = selp.id
        WHERE soi.order_id = public.shop_orders.id
        AND selp.user_id = auth.uid()
      )
    );
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Could not create shop_orders policy: %', SQLERRM;
END $$;

-- 5. Apply/Fix Policies for shop_order_items
DO $$
BEGIN
    DROP POLICY IF EXISTS "Sellers can view own product order items" ON public.shop_order_items;
    CREATE POLICY "Sellers can view own product order items"
    ON public.shop_order_items FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.shop_products sp
        JOIN public.seller_profiles selp ON sp.seller_id = selp.id
        WHERE sp.id = public.shop_order_items.product_id
        AND selp.user_id = auth.uid()
      )
    );
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Could not create shop_order_items policy: %', SQLERRM;
END $$;

-- 6. Fix for Migration 20260224102530 (Order status history)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_status_history') THEN
        DROP POLICY IF EXISTS "Sellers can view order history for their products" ON public.order_status_history;
        CREATE POLICY "Sellers can view order history for their products"
        ON public.order_status_history FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.shop_order_items soi
            JOIN public.shop_products sp ON soi.product_id = sp.id
            JOIN public.seller_profiles selp ON sp.seller_id = selp.id
            WHERE soi.order_id = public.order_status_history.order_id
            AND selp.user_id = auth.uid()
          )
        );
    END IF;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Could not create order_status_history policy: %', SQLERRM;
END $$;
