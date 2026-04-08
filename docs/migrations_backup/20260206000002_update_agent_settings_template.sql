-- Add active_template_id to agent_website_settings
ALTER TABLE public.agent_website_settings 
ADD COLUMN IF NOT EXISTS active_template_id UUID REFERENCES public.website_templates(id);
