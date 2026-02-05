-- ==========================================
-- AGENT WEBSITE SETTINGS & STATIC PAGES SETUP
-- ==========================================

-- 1. Create agent_website_settings table
CREATE TABLE IF NOT EXISTS public.agent_website_settings (
    user_id UUID PRIMARY KEY,
    slug TEXT UNIQUE,
    custom_slug TEXT,
    slug_status TEXT DEFAULT 'pending' CHECK (slug_status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    is_builder_active BOOLEAN DEFAULT false,
    is_pro_active BOOLEAN DEFAULT false,
    html_content TEXT,
    css_content TEXT,
    js_content TEXT,
    meta_title TEXT,
    meta_description TEXT,
    fb_pixel_id TEXT,
    google_analytics_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create static_pages table
CREATE TABLE IF NOT EXISTS public.static_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    is_active BOOLEAN DEFAULT true,
    page_type TEXT DEFAULT 'standard' CHECK (page_type IN ('standard', 'builder', 'landing')),
    layout_data JSONB DEFAULT '[]'::jsonb,
    design_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create page_versions table for versioning
CREATE TABLE IF NOT EXISTS public.page_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES public.static_pages(id) ON DELETE CASCADE,
    content TEXT,
    layout_data JSONB,
    design_data JSONB,
    version_name TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Create platform_settings table for navigation and other settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Enable RLS
ALTER TABLE public.agent_website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for agent_website_settings
CREATE POLICY "Users can view own website settings"
    ON public.agent_website_settings FOR SELECT
    USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own website settings"
    ON public.agent_website_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own website settings"
    ON public.agent_website_settings FOR UPDATE
    USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all website settings"
    ON public.agent_website_settings FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- 7. RLS Policies for static_pages
CREATE POLICY "Anyone can view active pages"
    ON public.static_pages FOR SELECT
    USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage pages"
    ON public.static_pages FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- 8. RLS Policies for page_versions
CREATE POLICY "Admins can manage page versions"
    ON public.page_versions FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- 9. RLS Policies for platform_settings
CREATE POLICY "Anyone can view platform settings"
    ON public.platform_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage platform settings"
    ON public.platform_settings FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_agent_website_settings_slug ON public.agent_website_settings(slug);
CREATE INDEX IF NOT EXISTS idx_agent_website_settings_custom_slug ON public.agent_website_settings(custom_slug);
CREATE INDEX IF NOT EXISTS idx_static_pages_slug ON public.static_pages(slug);
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(key);

-- 11. Triggers for updated_at
CREATE OR REPLACE TRIGGER update_agent_website_settings_updated_at
    BEFORE UPDATE ON public.agent_website_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_static_pages_updated_at
    BEFORE UPDATE ON public.static_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_platform_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Insert default platform settings
INSERT INTO public.platform_settings (key, value, description)
VALUES ('main_navigation', '{"main_navigation": []}', 'Main navigation menu items')
ON CONFLICT (key) DO NOTHING;