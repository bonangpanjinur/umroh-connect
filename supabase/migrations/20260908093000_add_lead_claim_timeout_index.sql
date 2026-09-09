CREATE INDEX IF NOT EXISTS idx_lead_deliveries_claim_timeout
  ON public.central_lead_deliveries(installation_id, claimed_at)
  WHERE status = 'claimed';
