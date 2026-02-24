
-- BUG 1: Seller can view orders containing their products
DROP POLICY IF EXISTS "Sellers can view orders for their products" ON public.shop_orders;
CREATE POLICY "Sellers can view orders for their products"
ON public.shop_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shop_order_items soi
    JOIN public.shop_products sp ON soi.product_id = sp.id
    JOIN public.seller_profiles selp ON sp.seller_id = selp.id
    WHERE soi.order_id = shop_orders.id
    AND selp.user_id = auth.uid()
  )
);

-- Seller can view order items for their products
DROP POLICY IF EXISTS "Sellers can view own product order items" ON public.shop_order_items;
CREATE POLICY "Sellers can view own product order items"
ON public.shop_order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shop_products sp
    JOIN public.seller_profiles selp ON sp.seller_id = selp.id
    WHERE sp.id = shop_order_items.product_id
    AND selp.user_id = auth.uid()
  )
);

-- BUG 6: Remove redundant policy
DROP POLICY IF EXISTS "Buyers can update own orders" ON public.shop_orders;
