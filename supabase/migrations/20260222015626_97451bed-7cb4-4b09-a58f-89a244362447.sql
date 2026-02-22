-- Add shipping cost field to seller_profiles for simple flat-rate shipping
ALTER TABLE public.seller_profiles ADD COLUMN IF NOT EXISTS shipping_cost INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.seller_profiles.shipping_cost IS 'Flat shipping cost in IDR. 0 means free or not configured.';