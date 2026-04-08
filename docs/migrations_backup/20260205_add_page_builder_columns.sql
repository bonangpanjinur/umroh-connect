-- Menambahkan kolom untuk mendukung fitur Page Builder pada tabel static_pages
-- Menggunakan static_pages karena sesuai dengan kode implementasi di PagesManagement.tsx dan usePages.ts

ALTER TABLE public.static_pages 
ADD COLUMN IF NOT EXISTS layout_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS page_type VARCHAR(50) DEFAULT 'standard';

-- Menambahkan constraint check untuk memastikan tipe halaman valid
-- Menggunakan landing_page sebagai sinonim untuk builder jika diperlukan, 
-- namun 'builder' lebih deskriptif untuk fungsionalitas editor.
ALTER TABLE public.static_pages 
DROP CONSTRAINT IF EXISTS check_page_type;

ALTER TABLE public.static_pages 
ADD CONSTRAINT check_page_type CHECK (page_type IN ('standard', 'builder', 'landing'));

-- Memberikan komentar pada kolom untuk dokumentasi
COMMENT ON COLUMN public.static_pages.layout_data IS 'Menyimpan struktur komponen JSON untuk visual builder';
COMMENT ON COLUMN public.static_pages.page_type IS 'Menentukan jenis editor: standard (rich text), builder (visual blocks), atau landing';

-- Update halaman yang sudah ada agar memiliki tipe 'standard' secara eksplisit
UPDATE public.static_pages SET page_type = 'standard' WHERE page_type IS NULL;
