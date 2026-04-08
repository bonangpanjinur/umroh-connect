
-- Track every order status change with timestamps
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id, created_at);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Buyers can see history for their own orders
DROP POLICY IF EXISTS "Buyers can view own order history" ON public.order_status_history;
CREATE POLICY "Buyers can view own order history"
ON public.order_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shop_orders so
    WHERE so.id = order_status_history.order_id
    AND so.user_id = auth.uid()
  )
);

-- Sellers can see history for orders containing their products
DROP POLICY IF EXISTS "Sellers can view order history for their products" ON public.order_status_history;
CREATE POLICY "Sellers can view order history for their products"
ON public.order_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shop_order_items soi
    JOIN public.shop_products sp ON soi.product_id = sp.id
    JOIN public.seller_profiles selp ON sp.seller_id = selp.id
    WHERE soi.order_id = order_status_history.order_id
    AND selp.user_id = auth.uid()
  )
);

-- Admin/shop_admin can see all
DROP POLICY IF EXISTS "Admin can view all order history" ON public.order_status_history;
CREATE POLICY "Admin can view all order history"
ON public.order_status_history FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'shop_admin')
);

-- Trigger to auto-record status changes
CREATE OR REPLACE FUNCTION public.record_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_order_status_change ON public.shop_orders;
CREATE TRIGGER trg_record_order_status_change
AFTER UPDATE ON public.shop_orders
FOR EACH ROW
EXECUTE FUNCTION public.record_order_status_change();

-- Enable realtime for order_status_history
-- Supabase handles duplicate table adds gracefully, but we can check if possible
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'order_status_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
  END IF;
END $$;
