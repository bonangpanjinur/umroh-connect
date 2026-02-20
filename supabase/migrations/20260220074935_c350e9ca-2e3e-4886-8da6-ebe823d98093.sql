
-- Create shop_chat_messages table for buyer-seller messaging
CREATE TABLE public.shop_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('buyer', 'seller')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_chat_messages ENABLE ROW LEVEL SECURITY;

-- Buyers can read messages where they are the buyer (sender or receiver)
CREATE POLICY "Users can read own chat messages"
  ON public.shop_chat_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR (
      -- buyer can see messages in their orders
      order_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.shop_orders WHERE id = order_id AND user_id = auth.uid()
      )
    )
    OR (
      -- seller can see messages for their store
      EXISTS (
        SELECT 1 FROM public.seller_profiles WHERE id = seller_id AND user_id = auth.uid()
      )
    )
  );

-- Users can insert messages they send
CREATE POLICY "Users can send chat messages"
  ON public.shop_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Users can update messages (mark as read)
CREATE POLICY "Users can update own received messages"
  ON public.shop_chat_messages FOR UPDATE
  TO authenticated
  USING (
    sender_id != auth.uid()
    AND (
      (order_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.shop_orders WHERE id = order_id AND user_id = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.seller_profiles WHERE id = seller_id AND user_id = auth.uid())
    )
  );

-- Enable realtime for shop_chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_chat_messages;

-- Enable realtime for shop_orders (for live tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_orders;
