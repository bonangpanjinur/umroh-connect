-- Add configuration columns to agent_website_settings table
ALTER TABLE public.agent_website_settings 
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#0284c7',
ADD COLUMN IF NOT EXISTS hero_title text,
ADD COLUMN IF NOT EXISTS hero_description text,
ADD COLUMN IF NOT EXISTS hero_image_url text,
ADD COLUMN IF NOT EXISTS show_stats boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_features boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_contact_form boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS features_json jsonb DEFAULT '[
  {"title": "Resmi & Terpercaya", "description": "Terdaftar resmi di Kementrian Agama dengan track record keberangkatan 100%."},
  {"title": "Pembimbing Berpengalaman", "description": "Didampingi oleh Muthawif dan pembimbing ibadah yang kompeten dan sabar."},
  {"title": "Jadwal Pasti", "description": "Kepastian tanggal keberangkatan dan maskapai terbaik untuk kenyamanan Anda."}
]'::jsonb;

-- Add comments for clarity
COMMENT ON COLUMN public.agent_website_settings.primary_color IS 'Primary theme color for the agent website';
COMMENT ON COLUMN public.agent_website_settings.hero_title IS 'Custom hero title for the website';
COMMENT ON COLUMN public.agent_website_settings.hero_description IS 'Custom hero description for the website';
COMMENT ON COLUMN public.agent_website_settings.hero_image_url IS 'Custom hero background or featured image URL';
COMMENT ON COLUMN public.agent_website_settings.show_stats IS 'Toggle to show/hide statistics section';
COMMENT ON COLUMN public.agent_website_settings.show_features IS 'Toggle to show/hide features section';
COMMENT ON COLUMN public.agent_website_settings.show_contact_form IS 'Toggle to show/hide contact form section';
COMMENT ON COLUMN public.agent_website_settings.features_json IS 'Custom features list in JSON format';
