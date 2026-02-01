-- ==========================================
-- SETUP MANAGEMENT HALAMAN (PAGES) - FIXED
-- Jalankan skrip ini di SQL Editor Supabase
-- ==========================================

-- 1. Buat Fungsi handle_updated_at jika belum ada
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Buat Tabel Pages
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

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan RLS untuk Tabel Pages
DROP POLICY IF EXISTS "Anyone can view active pages" ON public.pages;
CREATE POLICY "Anyone can view active pages" ON public.pages 
    FOR SELECT USING (is_active = true OR (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )));

DROP POLICY IF EXISTS "Admins can manage pages" ON public.pages;
CREATE POLICY "Admins can manage pages" ON public.pages 
    FOR ALL USING (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- 5. Setup Storage Bucket untuk Gambar Halaman
INSERT INTO storage.buckets (id, name, public) 
VALUES ('page-images', 'page-images', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Kebijakan Storage untuk Bucket page-images
DROP POLICY IF EXISTS "Public read page-images" ON storage.objects;
CREATE POLICY "Public read page-images" ON storage.objects 
    FOR SELECT USING (bucket_id = 'page-images');

DROP POLICY IF EXISTS "Admins can upload page-images" ON storage.objects;
CREATE POLICY "Admins can upload page-images" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'page-images' AND (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )));

-- 7. Trigger untuk updated_at
DROP TRIGGER IF EXISTS update_pages_updated_at ON public.pages;
CREATE TRIGGER update_pages_updated_at
    BEFORE UPDATE ON public.pages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
