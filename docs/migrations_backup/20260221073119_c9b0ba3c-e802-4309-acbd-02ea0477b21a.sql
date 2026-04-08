
-- Table: product_wishlist
CREATE TABLE public.product_wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.product_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON public.product_wishlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to wishlist"
  ON public.product_wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from wishlist"
  ON public.product_wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- Table: order_notifications
CREATE TABLE public.order_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'status_change',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order notifications"
  ON public.order_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications read"
  ON public.order_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for order_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_notifications;

-- Trigger: notify on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  buyer_id UUID;
  seller_user_id UUID;
  status_label TEXT;
  order_code_val TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    buyer_id := NEW.user_id;
    order_code_val := NEW.order_code;

    -- Status labels
    CASE NEW.status
      WHEN 'paid' THEN status_label := 'Pembayaran dikonfirmasi';
      WHEN 'processing' THEN status_label := 'Sedang diproses';
      WHEN 'shipped' THEN status_label := 'Sedang dikirim';
      WHEN 'delivered' THEN status_label := 'Telah diterima';
      WHEN 'cancelled' THEN status_label := 'Dibatalkan';
      ELSE status_label := NEW.status;
    END CASE;

    -- Notify buyer
    INSERT INTO public.order_notifications (user_id, order_id, type, message)
    VALUES (buyer_id, NEW.id, 'status_change', 'Pesanan ' || order_code_val || ': ' || status_label);

    -- Notify seller for new paid orders
    IF NEW.status = 'paid' THEN
      SELECT sp.user_id INTO seller_user_id
      FROM public.shop_order_items soi
      JOIN public.shop_products p ON soi.product_id = p.id
      JOIN public.seller_profiles sp ON p.seller_id = sp.id
      WHERE soi.order_id = NEW.id
      LIMIT 1;

      IF seller_user_id IS NOT NULL THEN
        INSERT INTO public.order_notifications (user_id, order_id, type, message)
        VALUES (seller_user_id, NEW.id, 'new_order', 'Pesanan baru ' || order_code_val || ' telah dibayar');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_status_notify
  AFTER UPDATE ON public.shop_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();

-- Also notify seller on new order creation (pending)
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  seller_user_id UUID;
BEGIN
  -- Find the seller from order items
  SELECT sp.user_id INTO seller_user_id
  FROM public.shop_order_items soi
  JOIN public.shop_products p ON soi.product_id = p.id
  JOIN public.seller_profiles sp ON p.seller_id = sp.id
  WHERE soi.order_id = NEW.id
  LIMIT 1;

  IF seller_user_id IS NOT NULL THEN
    INSERT INTO public.order_notifications (user_id, order_id, type, message)
    VALUES (seller_user_id, NEW.id, 'new_order', 'Pesanan baru ' || NEW.order_code || ' menunggu pembayaran');
  END IF;

  RETURN NEW;
END;
$$;
