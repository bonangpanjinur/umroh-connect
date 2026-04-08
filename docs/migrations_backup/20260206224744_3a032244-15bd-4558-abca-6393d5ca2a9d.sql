
-- Create website_templates table
CREATE TABLE IF NOT EXISTS public.website_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view active templates
CREATE POLICY "Anyone can view active templates"
  ON public.website_templates
  FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage templates
CREATE POLICY "Admins can manage templates"
  ON public.website_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed 2 default templates
INSERT INTO public.website_templates (name, slug, description, is_premium, is_active) VALUES
  ('Default Modern', 'default', 'Template website modern dan responsif dengan desain bersih. Cocok untuk semua jenis travel umroh.', false, true),
  ('Gold Luxury', 'gold-luxury', 'Template premium dengan nuansa emas mewah. Sempurna untuk travel premium dan eksklusif.', true, true);
