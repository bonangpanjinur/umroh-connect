-- Add is_published column to agent_website_settings
ALTER TABLE public.agent_website_settings ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.agent_website_settings.is_published IS 'Whether the agent website is publicly accessible';
