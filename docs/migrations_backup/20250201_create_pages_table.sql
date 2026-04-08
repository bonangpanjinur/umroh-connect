-- Create Pages Table
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    image_url TEXT,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active pages" ON public.pages 
    FOR SELECT USING (is_active = true OR (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )));

CREATE POLICY "Admins can manage pages" ON public.pages 
    FOR ALL USING (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Create storage bucket for page images if it doesn't exist
-- Note: This might need to be done via Supabase dashboard or API in a real environment,
-- but we'll include it in the migration logic for completeness.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('page-images', 'page-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for page-images
CREATE POLICY "Public read page-images" ON storage.objects 
    FOR SELECT USING (bucket_id = 'page-images');

CREATE POLICY "Admins can upload page-images" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'page-images' AND (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )));

-- Add trigger for updated_at
CREATE TRIGGER update_pages_updated_at
    BEFORE UPDATE ON public.pages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
