
-- Make owner_id nullable for sample data (this allows demo travels without real users)
ALTER TABLE public.travels ALTER COLUMN owner_id DROP NOT NULL;

-- Temporarily disable RLS for inserting sample data
ALTER TABLE public.travels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departures DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;

-- Create sample travel agencies
INSERT INTO public.travels (id, owner_id, name, description, phone, whatsapp, email, address, logo_url, verified, rating, review_count) VALUES
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', NULL, 
   'Al-Madinah Travel', 'Travel umroh terpercaya dengan pengalaman lebih dari 15 tahun melayani jamaah Indonesia. Izin resmi Kemenag.', 
   '+6221-5551234', '+6281234567891', 'info@almadinahtravel.com', 
   'Jl. Sudirman No. 123, Jakarta Pusat', 'https://images.unsplash.com/photo-1564769625392-651b89c75a77?w=200', 
   true, 4.8, 156),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', NULL, 
   'Berkah Umroh Tour', 'Spesialis paket umroh hemat dan premium. Berangkat setiap bulan dengan bimbingan ustadz berpengalaman.', 
   '+6221-5559876', '+6281234567892', 'cs@berkahumroh.co.id', 
   'Jl. Gatot Subroto No. 45, Jakarta Selatan', 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=200', 
   true, 4.6, 89)
ON CONFLICT (id) DO NOTHING;

-- Create sample packages
INSERT INTO public.packages (id, travel_id, name, description, duration_days, hotel_makkah, hotel_madinah, hotel_star, airline, flight_type, meal_type, facilities, images, is_active) VALUES
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
   'Paket Umroh Hemat 9 Hari', 'Paket umroh ekonomis dengan fasilitas lengkap. Cocok untuk jamaah yang ingin ibadah dengan budget terjangkau.',
   9, 'Elaf Ajyad Hotel', 'Dallah Taibah Hotel', 3, 'Saudi Airlines', 'direct', 'fullboard',
   ARRAY['Visa Umroh', 'Tiket Pesawat PP', 'Hotel Bintang 3', 'Makan 3x Sehari', 'Bus AC', 'Muthawif', 'Perlengkapan Umroh', 'Asuransi'],
   ARRAY['https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800', 'https://images.unsplash.com/photo-1564769625392-651b89c75a77?w=800'],
   true),
  ('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
   'Paket Umroh Premium 12 Hari', 'Paket umroh premium dengan hotel bintang 5 dekat Masjidil Haram. Nyaman dan eksklusif.',
   12, 'Fairmont Makkah Clock Tower', 'Oberoi Madinah', 5, 'Garuda Indonesia', 'direct', 'fullboard',
   ARRAY['Visa Umroh', 'Tiket Pesawat PP', 'Hotel Bintang 5', 'Makan 3x Sehari', 'Bus VIP', 'Muthawif Khusus', 'Perlengkapan Premium', 'Asuransi Premium', 'City Tour', 'Ziarah Lengkap'],
   ARRAY['https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?w=800', 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800'],
   true),
  ('e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
   'Paket Umroh Reguler 9 Hari', 'Paket umroh reguler dengan harga terjangkau dan pelayanan prima.',
   9, 'Pullman ZamZam Makkah', 'Movenpick Madinah', 4, 'Emirates', 'transit', 'fullboard',
   ARRAY['Visa Umroh', 'Tiket Pesawat PP', 'Hotel Bintang 4', 'Makan 3x Sehari', 'Bus AC', 'Muthawif', 'Perlengkapan Umroh', 'Asuransi', 'Handling'],
   ARRAY['https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800'],
   true),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
   'Paket Umroh Plus Turki 14 Hari', 'Paket umroh plus wisata religi ke Istanbul, Turki. Kunjungi masjid-masjid bersejarah.',
   14, 'Swissotel Al Maqam', 'Dar Al Taqwa Hotel', 5, 'Turkish Airlines', 'transit', 'fullboard',
   ARRAY['Visa Umroh', 'Visa Turki', 'Tiket Pesawat PP', 'Hotel Bintang 5', 'Makan 3x Sehari', 'Bus VIP', 'Muthawif', 'Tour Guide Istanbul', 'City Tour Istanbul', 'Asuransi Premium'],
   ARRAY['https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800'],
   true)
ON CONFLICT (id) DO NOTHING;

-- Create sample departures
INSERT INTO public.departures (id, package_id, departure_date, return_date, price, original_price, available_seats, total_seats, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '2026-03-15', '2026-03-24', 25500000, 28000000, 35, 45, 'available'),
  ('22222222-2222-2222-2222-222222222222', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '2026-04-10', '2026-04-19', 26000000, NULL, 45, 45, 'available'),
  ('33333333-3333-3333-3333-333333333333', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '2026-05-20', '2026-05-29', 27500000, 30000000, 20, 45, 'available'),
  ('44444444-4444-4444-4444-444444444444', 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', '2026-03-20', '2026-04-01', 55000000, 60000000, 15, 30, 'available'),
  ('55555555-5555-5555-5555-555555555555', 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', '2026-04-25', '2026-05-07', 58000000, NULL, 30, 30, 'available'),
  ('66666666-6666-6666-6666-666666666666', 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', '2026-03-18', '2026-03-27', 32000000, 35000000, 40, 45, 'available'),
  ('77777777-7777-7777-7777-777777777777', 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', '2026-04-15', '2026-04-24', 33500000, NULL, 45, 45, 'available'),
  ('88888888-8888-8888-8888-888888888888', 'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', '2026-04-01', '2026-04-15', 75000000, 80000000, 10, 25, 'available'),
  ('99999999-9999-9999-9999-999999999999', 'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', '2026-05-10', '2026-05-24', 78000000, NULL, 25, 25, 'available')
ON CONFLICT (id) DO NOTHING;

-- Add sample platform settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('membership_pricing', '{"basic": 500000, "premium": 1500000, "enterprise": 5000000}', 'Harga keanggotaan per bulan'),
  ('credit_pricing', '{"price_per_credit": 50000, "bulk_10": 450000, "bulk_50": 2000000}', 'Harga kredit posting paket'),
  ('free_credits', '{"new_agent": 3, "monthly_bonus": 1}', 'Kredit gratis untuk agent baru dan bonus bulanan')
ON CONFLICT (key) DO NOTHING;

-- Add sample banners
INSERT INTO public.banners (id, title, image_url, link_url, position, priority, is_active, start_date, end_date) VALUES
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'Promo Ramadhan 2026', 'https://images.unsplash.com/photo-1564769625392-651b89c75a77?w=1200', '/paket', 'home', 1, true, '2026-01-01', '2026-04-30'),
  ('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0', 'Diskon Early Bird', 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200', '/paket', 'home', 2, true, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.travels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
