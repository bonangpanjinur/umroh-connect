
-- This migration ensures that the shop_order_items table and its dependencies exist.
-- It is designed to be idempotent and safe to run multiple times.

SET search_path = public;

-- 1. Ensure shop_order_status enum exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shop_order_status') THEN
    CREATE TYPE public.shop_order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ensure shop_orders table exists
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

-- 4. Enable RLS
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

-- Note: Policies are now handled in their respective original migration files 
-- (20260224102226 and 20260224102530) which have been updated to be idempotent.
-- This file's primary job is ensuring the schema exists.
