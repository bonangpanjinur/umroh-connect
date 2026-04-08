
-- Tambah 'shop_admin' ke enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'shop_admin';

-- Buat enum shop_order_status
DO $$ BEGIN
  CREATE TYPE public.shop_order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
