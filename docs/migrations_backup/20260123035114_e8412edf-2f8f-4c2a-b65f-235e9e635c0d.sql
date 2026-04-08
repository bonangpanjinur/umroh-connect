-- Create departure notification logs table for tracking sent reminders
CREATE TABLE public.departure_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('h30', 'h14', 'h7', 'h3', 'h1', 'h0')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.departure_notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own departure notifications"
  ON public.departure_notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own departure notifications"
  ON public.departure_notification_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add reminder tracking columns to bookings
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS departure_reminder_h30 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS departure_reminder_h14 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS departure_reminder_h7 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS departure_reminder_h3 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS departure_reminder_h1 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS departure_reminder_h0 BOOLEAN DEFAULT false;

-- Create index for efficient querying
CREATE INDEX idx_departure_notifications_user ON public.departure_notification_logs(user_id, sent_at DESC);
CREATE INDEX idx_bookings_departure_reminders ON public.bookings(departure_id) WHERE departure_id IS NOT NULL;