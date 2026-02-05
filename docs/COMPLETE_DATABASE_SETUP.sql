-- COMPLETE DATABASE SETUP v3.0
-- Tables: agent_website_settings, static_pages, page_versions, platform_settings
-- Run in Supabase SQL Editor

-- Agent Website Settings
CREATE TABLE IF NOT EXISTS public.agent_website_settings (
    user_id UUID PRIMARY KEY,
    slug TEXT UNIQUE,
    custom_slug TEXT,
    slug_status TEXT DEFAULT 'pending' CHECK (slug_status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    is_builder_active BOOLEAN DEFAULT false,
    is_pro_active BOOLEAN DEFAULT false,
    html_content TEXT,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.agent_website_settings ENABLE ROW LEVEL SECURITY;

-- Static Pages
CREATE TABLE IF NOT EXISTS public.static_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    meta_title TEXT,
    meta_description TEXT,
    is_active BOOLEAN DEFAULT true,
    page_type TEXT DEFAULT 'standard',
    layout_data JSONB DEFAULT '[]',
    design_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;

-- Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB DEFAULT '{}',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (see migration for full details)
