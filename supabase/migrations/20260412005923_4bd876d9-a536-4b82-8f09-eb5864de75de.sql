
-- Fix security definer views: use SECURITY INVOKER instead
CREATE OR REPLACE VIEW public.public_profiles 
  WITH (security_invoker = true) AS 
  SELECT user_id, full_name, avatar_url FROM public.profiles;

CREATE OR REPLACE VIEW public.public_travels 
  WITH (security_invoker = true) AS 
  SELECT id, owner_id, name, description, logo_url, address, phone, whatsapp, email,
         rating, review_count, verified, verified_at, status, created_at, updated_at
  FROM public.travels;
