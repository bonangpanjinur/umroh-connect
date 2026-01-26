-- 1. Table for Manasik Guides (Admin-managed)
CREATE TABLE public.manasik_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_arabic TEXT,
  description TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'umroh', -- umroh, haji, both
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Table for Important Locations (Admin-managed)
CREATE TABLE public.important_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_arabic TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'masjid', -- masjid, hotel, hospital, embassy, restaurant, shopping, other
  city TEXT NOT NULL DEFAULT 'Makkah', -- Makkah, Madinah
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  opening_hours TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Table for Packing Templates (Admin-managed defaults)
CREATE TABLE public.packing_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'pakaian', -- pakaian, perlengkapan_ibadah, dokumen, kesehatan, elektronik, lainnya
  gender TEXT NOT NULL DEFAULT 'both', -- male, female, both
  is_essential BOOLEAN DEFAULT false,
  weather_related BOOLEAN DEFAULT false, -- only suggest if hot/cold weather
  description TEXT,
  quantity_suggestion INTEGER DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manasik_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_templates ENABLE ROW LEVEL SECURITY;

-- RLS for manasik_guides
CREATE POLICY "Anyone can view active guides" ON public.manasik_guides
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage guides" ON public.manasik_guides
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for important_locations
CREATE POLICY "Anyone can view active locations" ON public.important_locations
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage locations" ON public.important_locations
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for packing_templates
CREATE POLICY "Anyone can view active templates" ON public.packing_templates
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage templates" ON public.packing_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add indexes
CREATE INDEX idx_manasik_guides_order ON public.manasik_guides(order_index);
CREATE INDEX idx_important_locations_city ON public.important_locations(city);
CREATE INDEX idx_important_locations_category ON public.important_locations(category);
CREATE INDEX idx_packing_templates_category ON public.packing_templates(category);
CREATE INDEX idx_packing_templates_gender ON public.packing_templates(gender);

-- Insert default manasik guides
INSERT INTO public.manasik_guides (title, title_arabic, description, content, order_index, category) VALUES
('Ihram', 'الإحرام', 'Niat dan berpakaian ihram untuk memulai ibadah umroh', 'Ihram adalah niat untuk memulai ibadah umroh atau haji dengan memakai pakaian ihram. Untuk laki-laki berupa 2 lembar kain putih tanpa jahitan, sedangkan wanita memakai pakaian yang menutup aurat.

**Tata Cara Ihram:**
1. Mandi sunnah dan berwudhu
2. Memakai pakaian ihram
3. Shalat sunnah ihram 2 rakaat
4. Membaca niat dan talbiyah', 1, 'both'),
('Tawaf', 'الطواف', 'Mengelilingi Ka''bah sebanyak 7 putaran', 'Tawaf adalah mengelilingi Ka''bah sebanyak 7 putaran dimulai dari Hajar Aswad dengan Ka''bah berada di sebelah kiri.

**Rukun Tawaf:**
1. Niat tawaf
2. Suci dari hadats dan najis
3. Menutup aurat
4. Ka''bah di sebelah kiri
5. 7 putaran penuh
6. Dimulai dari Hajar Aswad', 2, 'both'),
('Shalat Sunnah Tawaf', 'صلاة سنة الطواف', 'Shalat 2 rakaat setelah tawaf di belakang Maqam Ibrahim', 'Setelah selesai tawaf, disunnahkan untuk shalat 2 rakaat di belakang Maqam Ibrahim jika memungkinkan, atau di tempat lain di Masjidil Haram.

**Surat yang Dibaca:**
- Rakaat 1: Al-Kafirun
- Rakaat 2: Al-Ikhlas', 3, 'both'),
('Sa''i', 'السعي', 'Berjalan antara Bukit Shafa dan Marwah 7 kali', 'Sa''i adalah berjalan dari Bukit Shafa ke Bukit Marwah dan sebaliknya sebanyak 7 kali perjalanan.

**Ketentuan Sa''i:**
- Dimulai dari Shafa, berakhir di Marwah
- Shafa ke Marwah = 1 kali
- Marwah ke Shafa = 1 kali
- Total 7 kali perjalanan', 4, 'both'),
('Tahallul', 'التحلل', 'Mencukur atau memotong rambut untuk mengakhiri ihram', 'Tahallul adalah mencukur atau memotong rambut untuk mengakhiri ihram.

**Ketentuan:**
- Laki-laki: mencukur habis (lebih utama) atau memotong minimal 3 helai
- Perempuan: memotong ujung rambut sepanjang 1 ruas jari

Setelah tahallul, jamaah sudah halal dari ihram dan boleh melakukan hal-hal yang sebelumnya dilarang.', 5, 'both');

-- Insert default important locations
INSERT INTO public.important_locations (name, name_arabic, category, city, latitude, longitude, description, priority) VALUES
('Masjidil Haram', 'المسجد الحرام', 'masjid', 'Makkah', 21.4225, 39.8262, 'Masjid suci tempat Ka''bah berada', 100),
('Masjid Nabawi', 'المسجد النبوي', 'masjid', 'Madinah', 24.4672, 39.6112, 'Masjid Nabi Muhammad SAW', 99),
('Ka''bah', 'الكعبة', 'masjid', 'Makkah', 21.4225, 39.8262, 'Kiblat umat Islam', 98),
('Jabal Rahmah', 'جبل الرحمة', 'landmark', 'Makkah', 21.3549, 39.9842, 'Bukit tempat wukuf saat haji', 90),
('Mina', 'منى', 'landmark', 'Makkah', 21.4133, 39.8933, 'Tempat melempar jumrah', 89),
('Muzdalifah', 'مزدلفة', 'landmark', 'Makkah', 21.3833, 39.9333, 'Tempat mabit setelah wukuf', 88),
('KBRI Jeddah', NULL, 'embassy', 'Jeddah', 21.5433, 39.1728, 'Kedutaan Besar RI untuk urusan konsuler', 80),
('King Faisal Hospital', NULL, 'hospital', 'Makkah', 21.4267, 39.8119, 'Rumah sakit rujukan di Makkah', 70),
('Al Noor Hospital', NULL, 'hospital', 'Makkah', 21.4156, 39.8267, 'Rumah sakit dekat Masjidil Haram', 69);

-- Insert default packing templates
INSERT INTO public.packing_templates (name, category, gender, is_essential, description, quantity_suggestion, priority) VALUES
-- Dokumen
('Paspor', 'dokumen', 'both', true, 'Pastikan masih berlaku minimal 6 bulan', 1, 100),
('Visa Umroh/Haji', 'dokumen', 'both', true, 'Visa yang sudah diurus travel', 1, 99),
('KTP', 'dokumen', 'both', true, 'Kartu identitas', 1, 98),
('Foto 4x6', 'dokumen', 'both', true, 'Background putih', 10, 97),
('Kartu Vaksin', 'dokumen', 'both', true, 'Vaksin meningitis wajib', 1, 96),
-- Pakaian Pria
('Kain Ihram', 'pakaian', 'male', true, '2 lembar kain ihram putih', 2, 95),
('Sabuk Ihram', 'pakaian', 'male', false, 'Untuk menyimpan uang/dokumen', 1, 80),
-- Pakaian Wanita  
('Mukena', 'pakaian', 'female', true, 'Untuk shalat', 2, 95),
('Jilbab/Kerudung', 'pakaian', 'female', true, 'Berbagai warna', 5, 94),
-- Perlengkapan Ibadah
('Al-Quran Mini', 'perlengkapan_ibadah', 'both', false, 'Ukuran saku', 1, 85),
('Buku Doa Umroh', 'perlengkapan_ibadah', 'both', false, 'Panduan doa manasik', 1, 84),
('Tasbih', 'perlengkapan_ibadah', 'both', false, 'Digital atau manual', 1, 83),
('Sajadah Travel', 'perlengkapan_ibadah', 'both', false, 'Ukuran lipat', 1, 82),
-- Kesehatan
('Obat Pribadi', 'kesehatan', 'both', true, 'Obat rutin yang dikonsumsi', 1, 90),
('Masker', 'kesehatan', 'both', true, 'Untuk mencegah debu/polusi', 20, 89),
('Hand Sanitizer', 'kesehatan', 'both', false, 'Ukuran travel', 2, 88),
('Vitamin', 'kesehatan', 'both', false, 'Untuk menjaga stamina', 1, 87),
-- Elektronik
('Charger HP', 'elektronik', 'both', true, 'Jangan lupa adapter', 1, 75),
('Power Bank', 'elektronik', 'both', false, 'Kapasitas besar', 1, 74),
('Adapter Universal', 'elektronik', 'both', true, 'Untuk colokan Saudi', 1, 73);