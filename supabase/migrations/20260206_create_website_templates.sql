-- Create website_templates table
CREATE TABLE IF NOT EXISTS public.website_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- cth: 'gold-luxury', 'modern-minimal'
    description TEXT,
    thumbnail_url TEXT, -- URL gambar preview template
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.website_templates ENABLE ROW LEVEL SECURITY;

-- Public read access
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'website_templates' AND policyname = 'Public read access'
    ) THEN
        CREATE POLICY "Public read access" ON public.website_templates FOR SELECT USING (true);
    END IF;
END $$;

-- Admin full access (Assuming admin_users table exists or check via metadata)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'website_templates' AND policyname = 'Admin full access'
    ) THEN
        CREATE POLICY "Admin full access" ON public.website_templates FOR ALL USING (
            auth.uid() IN (SELECT user_id FROM admin_users)
        );
    END IF;
END $$;
