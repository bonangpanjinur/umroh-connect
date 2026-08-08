CREATE TABLE public.user_prayer_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  prayer_id TEXT NOT NULL,
  is_qadha BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date, prayer_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_prayer_logs TO authenticated;
GRANT ALL ON public.user_prayer_logs TO service_role;

ALTER TABLE public.user_prayer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prayer logs"
ON public.user_prayer_logs FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_user_prayer_logs_user_date ON public.user_prayer_logs (user_id, log_date DESC);

CREATE TRIGGER update_user_prayer_logs_updated_at
BEFORE UPDATE ON public.user_prayer_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();