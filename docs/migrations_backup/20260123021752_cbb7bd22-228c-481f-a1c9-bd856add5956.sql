-- Create bookings table for tracking package reservations
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  departure_id UUID REFERENCES public.departures(id) ON DELETE SET NULL,
  travel_id UUID NOT NULL REFERENCES public.travels(id) ON DELETE CASCADE,
  
  -- Booking details
  booking_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'completed')),
  number_of_pilgrims INTEGER NOT NULL DEFAULT 1,
  
  -- Price info
  total_price BIGINT NOT NULL,
  paid_amount BIGINT NOT NULL DEFAULT 0,
  remaining_amount BIGINT GENERATED ALWAYS AS (total_price - paid_amount) STORED,
  
  -- Contact info
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  
  -- Notes
  notes TEXT,
  agent_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment schedules table
CREATE TABLE public.payment_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  
  -- Schedule details
  payment_type TEXT NOT NULL CHECK (payment_type IN ('dp', 'installment', 'final')),
  amount BIGINT NOT NULL,
  due_date DATE NOT NULL,
  
  -- Payment status
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_amount BIGINT DEFAULT 0,
  payment_proof_url TEXT,
  
  -- Notification tracking
  reminder_sent_h7 BOOLEAN DEFAULT false,
  reminder_sent_h3 BOOLEAN DEFAULT false,
  reminder_sent_h1 BOOLEAN DEFAULT false,
  reminder_sent_overdue BOOLEAN DEFAULT false,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification logs for tracking sent notifications
CREATE TABLE public.payment_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  payment_schedule_id UUID REFERENCES public.payment_schedules(id) ON DELETE CASCADE,
  
  notification_type TEXT NOT NULL, -- 'h7', 'h3', 'h1', 'overdue', 'payment_received'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agents can update bookings"
  ON public.bookings FOR UPDATE
  USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can delete bookings"
  ON public.bookings FOR DELETE
  USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for payment_schedules
CREATE POLICY "Users can view own payment schedules"
  ON public.payment_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = payment_schedules.booking_id 
      AND (b.user_id = auth.uid() OR owns_travel(auth.uid(), b.travel_id) OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Agents can manage payment schedules"
  ON public.payment_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = payment_schedules.booking_id 
      AND (owns_travel(auth.uid(), b.travel_id) OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- RLS Policies for notification logs
CREATE POLICY "Users can view own notification logs"
  ON public.payment_notification_logs FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create notification logs"
  ON public.payment_notification_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notification logs"
  ON public.payment_notification_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to generate booking code
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code: AU-YYYYMMDD-XXXX (AU = Arah Umroh)
    new_code := 'AU-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));
    
    -- Check if code exists
    SELECT EXISTS (SELECT 1 FROM public.bookings WHERE booking_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Trigger to auto-generate booking code
CREATE OR REPLACE FUNCTION public.set_booking_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_booking_code
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_code();

-- Trigger to update booking paid_amount when payment is made
CREATE OR REPLACE FUNCTION public.update_booking_paid_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.bookings
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(paid_amount), 0) 
      FROM public.payment_schedules 
      WHERE booking_id = COALESCE(NEW.booking_id, OLD.booking_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_booking_paid
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_paid_amount();

-- Add updated_at triggers
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_schedules_updated_at
  BEFORE UPDATE ON public.payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_travel_id ON public.bookings(travel_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_payment_schedules_booking_id ON public.payment_schedules(booking_id);
CREATE INDEX idx_payment_schedules_due_date ON public.payment_schedules(due_date);
CREATE INDEX idx_payment_notification_logs_user_id ON public.payment_notification_logs(user_id);