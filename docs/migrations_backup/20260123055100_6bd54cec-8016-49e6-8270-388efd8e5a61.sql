-- Create agent notifications table
CREATE TABLE public.agent_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  travel_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'new_inquiry', 'overdue_payment', 'new_booking', 'new_haji_registration'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  reference_id UUID, -- ID of the related entity (inquiry_id, booking_id, etc.)
  reference_type TEXT, -- 'inquiry', 'booking', 'payment', 'haji'
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agents can view own notifications"
ON public.agent_notifications
FOR SELECT
USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can update own notifications"
ON public.agent_notifications
FOR UPDATE
USING (owns_travel(auth.uid(), travel_id));

CREATE POLICY "System can create notifications"
ON public.agent_notifications
FOR INSERT
WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_agent_notifications_travel ON public.agent_notifications(travel_id);
CREATE INDEX idx_agent_notifications_unread ON public.agent_notifications(travel_id, is_read) WHERE is_read = false;

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_notifications;