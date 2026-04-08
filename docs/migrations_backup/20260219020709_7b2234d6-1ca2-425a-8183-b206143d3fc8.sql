
-- Update chat_messages RLS policies to allow jamaah to chat directly with travel (without booking)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.chat_messages;

-- SELECT: Users can view messages they sent, messages in their bookings, or messages in their travel (agent), or if they are part of a direct chat thread
CREATE POLICY "Users can view their own chats" ON public.chat_messages
FOR SELECT USING (
  auth.uid() = sender_id
  OR EXISTS (SELECT 1 FROM bookings b WHERE b.id = chat_messages.booking_id AND b.user_id = auth.uid())
  OR owns_travel(auth.uid(), travel_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (booking_id IS NULL AND auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM chat_messages cm2 
    WHERE cm2.travel_id = chat_messages.travel_id 
    AND cm2.booking_id IS NULL 
    AND cm2.sender_id = auth.uid()
  ))
);

-- INSERT: Users can send messages if they own the travel, have a booking, or are starting/continuing a direct chat (no booking_id)
CREATE POLICY "Users can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = chat_messages.booking_id AND b.user_id = auth.uid())
    OR owns_travel(auth.uid(), travel_id)
    OR (booking_id IS NULL AND auth.uid() IS NOT NULL)
  )
);

-- UPDATE: Users can mark messages as read in their conversations
CREATE POLICY "Users can mark messages as read" ON public.chat_messages
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM bookings b WHERE b.id = chat_messages.booking_id AND b.user_id = auth.uid())
  OR owns_travel(auth.uid(), travel_id)
  OR (booking_id IS NULL AND auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM chat_messages cm2 
    WHERE cm2.travel_id = chat_messages.travel_id 
    AND cm2.booking_id IS NULL 
    AND cm2.sender_id = auth.uid()
  ))
);
