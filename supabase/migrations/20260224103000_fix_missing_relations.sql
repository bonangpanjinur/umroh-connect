
-- This migration ensures that any missing policies or relations are handled.
-- The error "relation public.shop_order_items does not exist" usually happens 
-- if the table was not created in the expected order or schema.
-- Based on the repository, public.shop_order_items is created in 20260210103655.

-- Ensure the search_path is set correctly
SET search_path = public;

-- Re-verify that shop_order_items exists and if not, we might need to recreate it 
-- (though it should exist if previous migrations ran).
-- The most common cause for 42P01 in Supabase migrations is a mismatch in search_path
-- or a failed previous migration that didn't roll back properly.

-- If the table truly doesn't exist, this script will fail here, which is better than 
-- having inconsistent RLS policies.

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shop_order_items') THEN
        RAISE EXCEPTION 'Table public.shop_order_items does not exist. Please ensure migration 20260210103655 ran successfully.';
    END IF;
END $$;

-- Fix for Migration 20260224102226 (Sellers viewing orders)
-- We use DO blocks to make these idempotent and safer

DO $$
BEGIN
    -- Drop if exists to avoid "already exists" errors if partially run
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
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'One of the tables (shop_orders, shop_order_items, shop_products, seller_profiles) does not exist.';
END $$;

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
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'One of the tables (shop_order_items, shop_products, seller_profiles) does not exist.';
END $$;

-- Fix for Migration 20260224102530 (Order status history)

DO $$
BEGIN
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
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'One of the tables (order_status_history, shop_order_items, shop_products, seller_profiles) does not exist.';
END $$;
