-- Checklist categories enum
CREATE TYPE public.checklist_category AS ENUM ('dokumen', 'perlengkapan', 'kesehatan', 'mental');

-- Master checklist items table
CREATE TABLE public.checklists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category checklist_category NOT NULL,
  phase text NOT NULL DEFAULT 'H-30',
  priority integer NOT NULL DEFAULT 0,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User progress on checklists
CREATE TABLE public.user_checklists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  is_checked boolean NOT NULL DEFAULT false,
  checked_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, checklist_id)
);

-- Enable RLS
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_checklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checklists (master data)
CREATE POLICY "Anyone can view active checklists"
ON public.checklists FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage checklists"
ON public.checklists FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_checklists
CREATE POLICY "Users can view own checklist progress"
ON public.user_checklists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own checklist progress"
ON public.user_checklists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklist progress"
ON public.user_checklists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checklist progress"
ON public.user_checklists FOR DELETE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_checklists_updated_at
  BEFORE UPDATE ON public.user_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default checklist items
INSERT INTO public.checklists (title, description, category, phase, priority, icon) VALUES
-- Dokumen (H-30)
('Paspor', 'Pastikan paspor masih berlaku minimal 6 bulan dari tanggal keberangkatan', 'dokumen', 'H-30', 100, 'passport'),
('Visa Umroh', 'Urus visa umroh melalui travel agent terdaftar', 'dokumen', 'H-30', 95, 'stamp'),
('KTP', 'Siapkan fotokopi KTP untuk dokumen pendukung', 'dokumen', 'H-30', 90, 'id-card'),
('Kartu Keluarga', 'Siapkan fotokopi Kartu Keluarga', 'dokumen', 'H-30', 85, 'users'),
('Buku Nikah', 'Bagi yang sudah menikah, siapkan fotokopi buku nikah', 'dokumen', 'H-30', 80, 'book'),
('Pas Foto', 'Siapkan pas foto ukuran 4x6 latar belakang putih (minimal 10 lembar)', 'dokumen', 'H-30', 75, 'camera'),
('Surat Mahram', 'Bagi wanita, siapkan surat keterangan mahram', 'dokumen', 'H-30', 70, 'file-text'),
('Tiket Pesawat', 'Pastikan sudah menerima e-ticket dari travel', 'dokumen', 'H-7', 65, 'plane'),

-- Perlengkapan (H-30 dan H-7)
('Koper', 'Siapkan koper yang kuat dan mudah diidentifikasi', 'perlengkapan', 'H-30', 60, 'briefcase'),
('Ihram (Pria)', 'Siapkan 2 set kain ihram untuk pria', 'perlengkapan', 'H-30', 58, 'shirt'),
('Mukena (Wanita)', 'Siapkan mukena yang nyaman dan mudah dilipat', 'perlengkapan', 'H-30', 57, 'shirt'),
('Sajadah Travel', 'Sajadah lipat yang ringan dan mudah dibawa', 'perlengkapan', 'H-30', 55, 'layout'),
('Sandal/Selop', 'Sandal yang nyaman untuk thawaf dan sai', 'perlengkapan', 'H-30', 50, 'footprints'),
('Tas Kecil', 'Tas selempang untuk menyimpan barang berharga', 'perlengkapan', 'H-30', 48, 'shopping-bag'),
('Obat Pribadi', 'Bawa obat-obatan pribadi yang rutin dikonsumsi', 'perlengkapan', 'H-7', 45, 'pill'),
('Perlengkapan Mandi', 'Sabun, shampoo, sikat gigi, dll dalam kemasan travel', 'perlengkapan', 'H-7', 40, 'droplet'),
('Power Bank', 'Untuk mengisi daya handphone selama perjalanan', 'perlengkapan', 'H-7', 38, 'battery-charging'),
('Adaptor Universal', 'Adaptor listrik untuk Arab Saudi', 'perlengkapan', 'H-7', 35, 'plug'),

-- Kesehatan (H-30)
('Vaksinasi Meningitis', 'Wajib vaksinasi meningitis minimal 2 minggu sebelum berangkat', 'kesehatan', 'H-30', 100, 'syringe'),
('Cek Kesehatan', 'Lakukan medical check-up terutama untuk lansia', 'kesehatan', 'H-30', 95, 'activity'),
('Surat Keterangan Sehat', 'Minta surat keterangan sehat dari dokter', 'kesehatan', 'H-30', 90, 'file-check'),
('Obat-obatan Rutin', 'Pastikan stok obat rutin cukup untuk selama perjalanan', 'kesehatan', 'H-7', 85, 'pill'),
('Vitamin & Suplemen', 'Siapkan vitamin untuk menjaga stamina', 'kesehatan', 'H-7', 80, 'heart-pulse'),
('Masker', 'Siapkan masker untuk kesehatan selama perjalanan', 'kesehatan', 'H-7', 75, 'mask'),
('Hand Sanitizer', 'Handsanitizer ukuran travel', 'kesehatan', 'H-7', 70, 'hand'),

-- Mental & Niat (H-30 dan ongoing)
('Niatkan Ibadah', 'Luruskan niat semata-mata karena Allah SWT', 'mental', 'H-30', 100, 'heart'),
('Pelajari Manasik', 'Ikuti kegiatan manasik dari travel atau masjid', 'mental', 'H-30', 95, 'book-open'),
('Hafal Doa Umroh', 'Hafalkan doa-doa umroh (talbiyah, thawaf, sai)', 'mental', 'H-30', 90, 'message-circle'),
('Mohon Maaf', 'Minta maaf kepada keluarga dan orang terdekat', 'mental', 'H-7', 85, 'handshake'),
('Lunasi Hutang', 'Selesaikan hutang piutang sebelum berangkat', 'mental', 'H-30', 80, 'wallet'),
('Tulis Wasiat', 'Tulis wasiat sebagai persiapan, karena perjalanan jauh', 'mental', 'H-30', 75, 'file-pen'),
('Siapkan Doa', 'Siapkan daftar doa dan hajat yang ingin dipanjatkan', 'mental', 'H-7', 70, 'scroll'),
('Belajar Bahasa Arab', 'Pelajari kosakata dasar bahasa Arab', 'mental', 'H-30', 65, 'languages');