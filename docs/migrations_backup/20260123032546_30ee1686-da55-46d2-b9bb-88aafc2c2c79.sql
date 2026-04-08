-- Create chat_messages table for real-time communication
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  travel_id UUID NOT NULL REFERENCES public.travels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('jamaah', 'agent')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_chat_messages_booking ON public.chat_messages(booking_id);
CREATE INDEX idx_chat_messages_travel ON public.chat_messages(travel_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- RLS Policies
CREATE POLICY "Users can view their own chats"
ON public.chat_messages
FOR SELECT
USING (
  auth.uid() = sender_id OR
  EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()) OR
  owns_travel(auth.uid(), travel_id) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()) OR
    owns_travel(auth.uid(), travel_id)
  )
);

CREATE POLICY "Users can mark messages as read"
ON public.chat_messages
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()) OR
  owns_travel(auth.uid(), travel_id)
);

-- Enable realtime for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;