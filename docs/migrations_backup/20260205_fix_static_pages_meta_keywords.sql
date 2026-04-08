-- Fix missing meta_keywords column in static_pages table
-- This column is required for SEO management in the admin dashboard

ALTER TABLE public.static_pages 
ADD COLUMN IF NOT EXISTS meta_keywords TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.static_pages.meta_keywords IS 'Keywords SEO untuk halaman statis, dipisahkan dengan koma';
