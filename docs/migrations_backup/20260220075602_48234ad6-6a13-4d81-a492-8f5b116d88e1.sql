
-- Add attachment columns to shop_chat_messages
ALTER TABLE public.shop_chat_messages
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT; -- 'image' or 'file'

-- Create chat_notification_logs table for in-app notifications
CREATE TABLE IF NOT EXISTS public.chat_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_message_id UUID REFERENCES public.shop_chat_messages(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  sender_name TEXT,
  message_preview TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat notifications"
  ON public.chat_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat notifications"
  ON public.chat_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert chat notifications"
  ON public.chat_notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Function to create notification when new chat message is inserted
CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recipient_id UUID;
  sender_name_val TEXT;
BEGIN
  -- Determine recipient: if sender is buyer, notify seller; if seller, notify buyer
  IF NEW.sender_role = 'buyer' THEN
    -- Find seller's user_id from seller_profiles
    SELECT user_id INTO recipient_id
    FROM public.seller_profiles
    WHERE id = NEW.seller_id;
  ELSE
    -- For seller messages, we need to find the buyer
    -- Get the most recent buyer in this conversation
    SELECT DISTINCT sender_id INTO recipient_id
    FROM public.shop_chat_messages
    WHERE seller_id = NEW.seller_id
      AND sender_role = 'buyer'
      AND (NEW.order_id IS NULL OR order_id = NEW.order_id)
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Get sender name
  SELECT full_name INTO sender_name_val
  FROM public.profiles
  WHERE user_id = NEW.sender_id
  LIMIT 1;

  -- Don't notify yourself
  IF recipient_id IS NOT NULL AND recipient_id != NEW.sender_id THEN
    INSERT INTO public.chat_notifications (user_id, chat_message_id, seller_id, sender_name, message_preview)
    VALUES (recipient_id, NEW.id, NEW.seller_id, COALESCE(sender_name_val, 'Pengguna'), LEFT(NEW.message, 100));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON public.shop_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_chat_message();

-- Enable realtime for chat_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_notifications;
