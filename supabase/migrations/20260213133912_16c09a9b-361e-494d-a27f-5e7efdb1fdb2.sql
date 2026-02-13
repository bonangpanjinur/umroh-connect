
ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS courier text;
