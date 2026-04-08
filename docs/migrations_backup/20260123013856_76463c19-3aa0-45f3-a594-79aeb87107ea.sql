-- Add package_type enum
CREATE TYPE public.package_type AS ENUM ('umroh', 'haji_reguler', 'haji_plus', 'haji_furoda');

-- Add package_type column to packages
ALTER TABLE public.packages 
ADD COLUMN package_type public.package_type NOT NULL DEFAULT 'umroh';

-- Add haji-specific fields to packages
ALTER TABLE public.packages
ADD COLUMN haji_year INTEGER,
ADD COLUMN haji_season TEXT,
ADD COLUMN quota_type TEXT,
ADD COLUMN estimated_departure_year INTEGER,
ADD COLUMN min_dp BIGINT,
ADD COLUMN registration_deadline DATE,
ADD COLUMN age_requirement TEXT,
ADD COLUMN health_requirements TEXT[];

-- Create haji_registrations table for tracking pilgrim registration status
CREATE TABLE public.haji_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  travel_id UUID NOT NULL REFERENCES public.travels(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  nik TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  birth_date DATE NOT NULL,
  address TEXT,
  porsi_number TEXT,
  registration_year INTEGER,
  estimated_departure_year INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  documents JSONB DEFAULT '{}',
  dp_amount BIGINT DEFAULT 0,
  dp_paid_at TIMESTAMP WITH TIME ZONE,
  agent_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.haji_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view own haji registrations"
ON public.haji_registrations
FOR SELECT
USING (
  auth.uid() = user_id OR
  owns_travel(auth.uid(), travel_id) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Users can create registrations
CREATE POLICY "Users can create haji registrations"
ON public.haji_registrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Agents can update registrations for their travel
CREATE POLICY "Agents can update haji registrations"
ON public.haji_registrations
FOR UPDATE
USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Agents can delete registrations
CREATE POLICY "Agents can delete haji registrations"
ON public.haji_registrations
FOR DELETE
USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_haji_registrations_updated_at
BEFORE UPDATE ON public.haji_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create haji_checklists table for haji-specific document requirements
CREATE TABLE public.haji_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'dokumen',
  is_required BOOLEAN DEFAULT true,
  applies_to TEXT[] DEFAULT ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'],
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.haji_checklists ENABLE ROW LEVEL SECURITY;

-- Anyone can view active checklists
CREATE POLICY "Anyone can view haji checklists"
ON public.haji_checklists
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage checklists
CREATE POLICY "Admins can manage haji checklists"
ON public.haji_checklists
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default haji document checklist
INSERT INTO public.haji_checklists (title, description, category, is_required, priority) VALUES
('KTP Asli', 'Kartu Tanda Penduduk yang masih berlaku', 'dokumen', true, 1),
('Kartu Keluarga', 'Kartu Keluarga asli', 'dokumen', true, 2),
('Akta Kelahiran', 'Akta kelahiran asli', 'dokumen', true, 3),
('Paspor', 'Paspor dengan masa berlaku minimal 7 bulan', 'dokumen', true, 4),
('Pas Foto', 'Pas foto 4x6 background putih (10 lembar)', 'dokumen', true, 5),
('Surat Nikah/Cerai', 'Buku nikah asli atau akta cerai (jika ada)', 'dokumen', false, 6),
('Surat Mahram', 'Surat keterangan mahram untuk wanita < 45 tahun', 'dokumen', false, 7),
('Surat Kesehatan', 'Surat keterangan sehat dari dokter', 'kesehatan', true, 8),
('Vaksin Meningitis', 'Bukti vaksinasi meningitis', 'kesehatan', true, 9),
('Vaksin Influenza', 'Bukti vaksinasi influenza (direkomendasikan)', 'kesehatan', false, 10),
('Rekam Medis', 'Rekam medis untuk jamaah dengan kondisi khusus', 'kesehatan', false, 11),
('BPIH', 'Bukti setoran BPIH (Biaya Penyelenggaraan Ibadah Haji)', 'keuangan', true, 12),
('Bukti DP', 'Bukti pembayaran uang muka/DP', 'keuangan', true, 13);

-- Create indexes for better performance
CREATE INDEX idx_packages_type ON public.packages(package_type);
CREATE INDEX idx_haji_registrations_travel ON public.haji_registrations(travel_id);
CREATE INDEX idx_haji_registrations_status ON public.haji_registrations(status);
CREATE INDEX idx_haji_registrations_user ON public.haji_registrations(user_id);