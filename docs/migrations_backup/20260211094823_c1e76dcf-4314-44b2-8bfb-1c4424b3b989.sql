-- Make order_code have a default so insert doesn't require it (trigger overwrites it)
ALTER TABLE public.shop_orders ALTER COLUMN order_code SET DEFAULT '';