-- ==========================================
-- ARAH UMROH — SEED DATA KONSOLIDASI
-- File tunggal, idempoten, aman dijalankan berulang kali
-- Sumber: SEED_DATA_IDEMPOTENT.sql + DOA_COMPLETE_SQL.sql + QURAN_TADARUS_COMPLETE.sql
-- ==========================================

-- ==========================================
-- 0. UNIQUE CONSTRAINTS UNTUK IDEMPOTENCY
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'manasik_guides_title_key') THEN
        ALTER TABLE public.manasik_guides ADD CONSTRAINT manasik_guides_title_key UNIQUE (title);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'important_locations_name_key') THEN
        ALTER TABLE public.important_locations ADD CONSTRAINT important_locations_name_key UNIQUE (name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'checklists_title_key') THEN
        ALTER TABLE public.checklists ADD CONSTRAINT checklists_title_key UNIQUE (title);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'packing_templates_name_key') THEN
        ALTER TABLE public.packing_templates ADD CONSTRAINT packing_templates_name_key UNIQUE (name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prayer_categories_name_key') THEN
        ALTER TABLE public.prayer_categories ADD CONSTRAINT prayer_categories_name_key UNIQUE (name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prayers_title_key') THEN
        ALTER TABLE public.prayers ADD CONSTRAINT prayers_title_key UNIQUE (title);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exercise_types_name_key') THEN
        ALTER TABLE public.exercise_types ADD CONSTRAINT exercise_types_name_key UNIQUE (name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ibadah_habits_name_key') THEN
        ALTER TABLE public.ibadah_habits ADD CONSTRAINT ibadah_habits_name_key UNIQUE (name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dzikir_types_name_key') THEN
        ALTER TABLE public.dzikir_types ADD CONSTRAINT dzikir_types_name_key UNIQUE (name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_plans_name_key') THEN
        ALTER TABLE public.subscription_plans ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'haji_checklists_title_key') THEN
        ALTER TABLE public.haji_checklists ADD CONSTRAINT haji_checklists_title_key UNIQUE (title);
    END IF;
END $$;


-- ==========================================
-- 1. MANASIK GUIDES (6 Panduan Umroh)
-- ==========================================
INSERT INTO manasik_guides (title, title_arabic, category, order_index, description, content, doa_arabic, doa_latin, doa_meaning, is_active) VALUES
('Niat & Ihram', 'نية الإحرام', 'umroh', 1,
'Ihram adalah niat untuk memulai ibadah umroh dengan mengenakan pakaian ihram. Dilakukan di Miqat sebelum memasuki tanah suci.',
'1. Mandi sunnah ihram (untuk laki-laki dan perempuan)
2. Laki-laki memakai 2 lembar kain putih tanpa jahitan
3. Perempuan memakai pakaian yang menutup aurat, tidak bercadar
4. Shalat sunnah ihram 2 rakaat
5. Berniat ihram menghadap kiblat
6. Mengucapkan Talbiyah

Tips:
- Gunakan sabun tanpa pewangi sebelum ihram
- Pastikan kain ihram bersih dan tidak tipis
- Siapkan safety pin untuk mengamankan kain',
'لَبَّيْكَ اللَّهُمَّ عُمْرَةً',
'Labbaikallahumma ''umratan',
'Aku memenuhi panggilan-Mu ya Allah untuk umroh',
true),

('Talbiyah', 'التَّلْبِيَة', 'umroh', 2,
'Talbiyah adalah ucapan yang dibaca terus-menerus sejak berniat ihram hingga memulai tawaf.',
'1. Baca talbiyah dengan suara keras (untuk laki-laki)
2. Baca talbiyah dengan suara pelan (untuk perempuan)
3. Terus-menerus dibaca selama perjalanan
4. Dihentikan saat memulai tawaf

Tips:
- Hafalkan bacaan talbiyah sebelum berangkat
- Bacalah dengan penuh penghayatan dan kekhusyukan',
'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيْكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيْكَ لَكَ',
'Labbaikallahumma labbaik, labbaika laa syariika laka labbaik, innal hamda wan ni''mata laka wal mulk, laa syariika lak',
'Aku memenuhi panggilan-Mu ya Allah, tidak ada sekutu bagi-Mu. Segala puji, nikmat, dan kerajaan milik-Mu.',
true),

('Tawaf', 'الطَّوَاف', 'umroh', 3,
'Tawaf adalah mengelilingi Ka''bah sebanyak 7 kali putaran berlawanan arah jarum jam.',
'1. Masuk Masjidil Haram dengan kaki kanan sambil berdoa
2. Menghadap Hajar Aswad, ucapkan "Bismillahi Allahu Akbar"
3. Laki-laki melakukan Idhtiba'' saat tawaf qudum
4. Mulai tawaf dari garis Hajar Aswad berlawanan jarum jam
5. Laki-laki melakukan Raml pada 3 putaran pertama
6. Di Rukun Yamani, usap dengan tangan kanan jika memungkinkan
7. Selesaikan 7 putaran penuh

Tips:
- Jaga wudhu selama tawaf
- Hindari mendorong jamaah lain',
'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
'Bismillahi wallahu akbar',
'Dengan nama Allah, dan Allah Maha Besar',
true),

('Shalat Sunnah Tawaf', 'صلاة سنة الطواف', 'umroh', 4,
'Setelah 7 putaran tawaf, shalat 2 rakaat di belakang Maqam Ibrahim.',
'1. Menuju Maqam Ibrahim setelah tawaf
2. Shalat 2 rakaat (rakaat 1: Al-Kafirun, rakaat 2: Al-Ikhlas)
3. Jika penuh, boleh shalat di tempat lain dalam masjid
4. Minum air zamzam dan berdoa',
'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى',
'Wattakhidzu min maqami Ibrahima mushalla',
'Dan jadikanlah sebagian maqam Ibrahim sebagai tempat shalat',
true),

('Sa''i', 'السَّعْي', 'umroh', 5,
'Sa''i adalah berjalan dari bukit Safa ke Marwah sebanyak 7 kali perjalanan.',
'1. Menuju bukit Safa setelah shalat tawaf
2. Naik ke bukit Safa, menghadap Ka''bah, berdoa
3. Berjalan menuju Marwah (hitungan 1)
4. Laki-laki berlari kecil di area lampu hijau
5. Kembali ke Safa (hitungan 2)
6. Ulangi hingga 7 kali, berakhir di Marwah',
'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
'Innas shafa wal marwata min sya''airillah',
'Sesungguhnya Safa dan Marwah adalah sebagian dari syi''ar Allah',
true),

('Tahallul', 'التَّحَلُّل', 'umroh', 6,
'Tahallul adalah mencukur atau memotong rambut sebagai tanda selesainya ibadah umroh.',
'1. Setelah selesai sa''i di Marwah
2. Laki-laki: mencukur habis (lebih utama) atau memotong minimal 3 helai
3. Perempuan: memotong ujung rambut sepanjang satu ruas jari
4. Setelah tahallul, semua larangan ihram gugur',
'اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ وَالْمُقَصِّرِينَ',
'Allahummaghfir lil muhalliqina wal muqashshirina',
'Ya Allah, ampunilah orang-orang yang mencukur dan yang memotong rambutnya',
true)
ON CONFLICT (title) DO NOTHING;


-- ==========================================
-- 2. IMPORTANT LOCATIONS (18 Lokasi Penting)
-- ==========================================
INSERT INTO important_locations (name, name_arabic, category, city, latitude, longitude, description, address, is_active, priority) VALUES
('Masjidil Haram', 'المسجد الحرام', 'masjid', 'Makkah', 21.4225, 39.8262, 'Masjid suci tempat Ka''bah berada.', 'Makkah, Arab Saudi', true, 1),
('Ka''bah', 'الكعبة', 'landmark', 'Makkah', 21.4225, 39.8262, 'Rumah Allah yang menjadi kiblat umat Islam sedunia.', 'Di dalam Masjidil Haram', true, 2),
('Safa & Marwah', 'الصفا والمروة', 'landmark', 'Makkah', 21.4234, 39.8269, 'Dua bukit tempat Sa''i dilakukan.', 'Di dalam Masjidil Haram', true, 3),
('Maqam Ibrahim', 'مقام إبراهيم', 'landmark', 'Makkah', 21.4225, 39.8264, 'Batu tempat Nabi Ibrahim berdiri saat membangun Ka''bah.', 'Di dalam Masjidil Haram', true, 4),
('Hajar Aswad', 'الحجر الأسود', 'landmark', 'Makkah', 21.4224, 39.8263, 'Batu hitam dari surga, titik awal dan akhir tawaf.', 'Di sudut Ka''bah', true, 5),
('Sumur Zamzam', 'بئر زمزم', 'landmark', 'Makkah', 21.4226, 39.8265, 'Sumber air suci yang muncul untuk Hajar dan Ismail.', 'Basement Masjidil Haram', true, 6),
('Miqat Yalamlam', 'يلملم', 'miqat', 'Makkah', 20.5519, 39.8503, 'Miqat untuk jamaah dari arah Yemen dan Indonesia.', 'Selatan Makkah', true, 10),
('Miqat Juhfah (Rabigh)', 'الجحفة', 'miqat', 'Makkah', 22.7208, 39.0917, 'Miqat untuk jamaah dari arah Mesir dan Syam.', 'Barat Laut Makkah', true, 11),
('Miqat Bir Ali (Dzulhulaifah)', 'ذو الحليفة', 'miqat', 'Madinah', 24.4136, 39.5436, 'Miqat untuk jamaah dari Madinah.', 'Selatan Madinah', true, 12),
('Miqat Qarn al-Manazil', 'قرن المنازل', 'miqat', 'Makkah', 21.6167, 40.4167, 'Miqat untuk jamaah dari arah Najd.', 'Timur Makkah', true, 13),
('Masjid Nabawi', 'المسجد النبوي', 'masjid', 'Madinah', 24.4672, 39.6112, 'Masjid Nabi Muhammad SAW.', 'Madinah, Arab Saudi', true, 20),
('Raudhah', 'الروضة', 'landmark', 'Madinah', 24.4673, 39.6113, 'Taman surga antara mimbar dan makam Nabi.', 'Di dalam Masjid Nabawi', true, 21),
('Makam Rasulullah', 'قبر الرسول', 'ziarah', 'Madinah', 24.4673, 39.6114, 'Makam Nabi Muhammad, Abu Bakar, dan Umar.', 'Di dalam Masjid Nabawi', true, 22),
('Pemakaman Baqi', 'البقيع', 'ziarah', 'Madinah', 24.4678, 39.6147, 'Pemakaman para sahabat dan keluarga Nabi.', 'Sebelah timur Masjid Nabawi', true, 23),
('Masjid Quba', 'مسجد قباء', 'masjid', 'Madinah', 24.4397, 39.6172, 'Masjid pertama dalam Islam.', 'Selatan Madinah', true, 24),
('Masjid Qiblatain', 'مسجد القبلتين', 'masjid', 'Madinah', 24.4803, 39.5917, 'Masjid tempat turunnya perintah perubahan kiblat.', 'Barat Laut Madinah', true, 25),
('Jabal Uhud', 'جبل أحد', 'ziarah', 'Madinah', 24.5011, 39.6156, 'Gunung tempat Perang Uhud.', 'Utara Madinah', true, 26),
('Makam Syuhada Uhud', 'شهداء أحد', 'ziarah', 'Madinah', 24.4989, 39.6128, 'Tempat peristirahatan 70 syuhada Uhud.', 'Dekat Jabal Uhud', true, 27)
ON CONFLICT (name) DO NOTHING;


-- ==========================================
-- 3. CHECKLISTS (16 Checklist Persiapan)
-- ==========================================
INSERT INTO checklists (title, description, category, phase, priority, icon, is_active) VALUES
('Cek Masa Berlaku Paspor', 'Pastikan paspor masih berlaku minimal 6 bulan', 'dokumen', 'H-30', 1, 'file-text', true),
('Daftar Vaksinasi Meningitis', 'Lakukan vaksinasi meningitis di klinik yang ditunjuk', 'kesehatan', 'H-30', 2, 'syringe', true),
('Siapkan Foto untuk Visa', 'Foto berwarna 4x6 background putih', 'dokumen', 'H-30', 3, 'camera', true),
('Mulai Latihan Jalan Kaki', 'Latihan stamina jalan kaki 2-3 km setiap hari', 'kesehatan', 'H-30', 4, 'footprints', true),
('Pelajari Tata Cara Umroh', 'Mempelajari bacaan dan gerakan manasik umroh', 'mental', 'H-30', 5, 'book-open', true),
('Siapkan Koper dan Perlengkapan', 'Pack pakaian ihram, mukena, sajadah', 'perlengkapan', 'H-7', 1, 'luggage', true),
('Siapkan Obat-obatan Pribadi', 'Bawa obat rutin, vitamin, dan P3K', 'kesehatan', 'H-7', 2, 'pill', true),
('Fotokopi Dokumen Penting', 'Fotokopi paspor, visa, tiket', 'dokumen', 'H-7', 3, 'copy', true),
('Konfirmasi Jadwal Keberangkatan', 'Hubungi travel untuk konfirmasi jadwal', 'dokumen', 'H-7', 4, 'phone', true),
('Hafalkan Doa-doa Manasik', 'Pastikan sudah hafal doa tawaf, sai', 'mental', 'H-7', 5, 'book-heart', true),
('Tukar Mata Uang', 'Tukar rupiah ke Riyal Saudi', 'dokumen', 'H-7', 6, 'banknote', true),
('Cek Ulang Semua Dokumen', 'Pastikan paspor, visa, tiket ada di tas kabin', 'dokumen', 'H-1', 1, 'clipboard-check', true),
('Sholat Istikharah', 'Lakukan sholat istikharah dan minta restu keluarga', 'mental', 'H-1', 2, 'heart', true),
('Charge Semua Device', 'Pastikan HP, powerbank terisi penuh', 'perlengkapan', 'H-1', 3, 'battery-charging', true),
('Siapkan Pakaian Ihram', 'Taruh pakaian ihram di tempat mudah dijangkau', 'perlengkapan', 'H-1', 4, 'shirt', true),
('Berangkat ke Bandara', 'Datang 3 jam sebelum jadwal keberangkatan', 'dokumen', 'H-1', 5, 'plane', true)
ON CONFLICT (title) DO NOTHING;


-- ==========================================
-- 4. PACKING TEMPLATES (40 Item Packing)
-- ==========================================
INSERT INTO packing_templates (name, category, gender, description, is_essential, priority, quantity_suggestion, is_active) VALUES
('Kain Ihram (2 lembar)', 'pakaian', 'male', 'Kain putih tanpa jahitan untuk ihram', true, 1, 2, true),
('Mukena', 'pakaian', 'female', 'Mukena untuk sholat', true, 1, 2, true),
('Pakaian Harian', 'pakaian', 'both', 'Pakaian ganti sehari-hari', true, 2, 5, true),
('Pakaian Dalam', 'pakaian', 'both', 'Celana dalam dan kaos dalam', true, 3, 7, true),
('Sandal Jepit', 'pakaian', 'both', 'Sandal untuk berjalan', true, 4, 1, true),
('Sepatu Nyaman', 'pakaian', 'both', 'Sepatu yang nyaman untuk jalan jauh', false, 5, 1, true),
('Kaos Kaki', 'pakaian', 'both', 'Untuk pelindung kaki', false, 6, 5, true),
('Jaket Tipis', 'pakaian', 'both', 'Untuk ruangan ber-AC', false, 7, 1, true),
('Paspor', 'dokumen', 'both', 'Paspor asli masa berlaku min. 6 bulan', true, 1, 1, true),
('Visa Umroh', 'dokumen', 'both', 'Visa yang sudah disetujui', true, 2, 1, true),
('Tiket Pesawat', 'dokumen', 'both', 'E-ticket atau tiket fisik', true, 3, 1, true),
('Fotokopi Paspor', 'dokumen', 'both', 'Simpan terpisah dari aslinya', true, 4, 2, true),
('Pas Foto', 'dokumen', 'both', 'Foto 4x6 background putih', false, 5, 4, true),
('Kartu Identitas Grup', 'dokumen', 'both', 'ID card dari travel', false, 6, 1, true),
('Obat Pribadi', 'kesehatan', 'both', 'Obat rutin yang dikonsumsi', true, 1, 1, true),
('Vitamin', 'kesehatan', 'both', 'Vitamin C, multivitamin', false, 2, 1, true),
('Obat Flu & Batuk', 'kesehatan', 'both', 'Antisipasi perubahan cuaca', false, 3, 1, true),
('Obat Maag', 'kesehatan', 'both', 'Untuk gangguan pencernaan', false, 4, 1, true),
('Plester Luka', 'kesehatan', 'both', 'Untuk lecet kaki', false, 5, 1, true),
('Hand Sanitizer', 'kesehatan', 'both', 'Pembersih tangan', false, 6, 1, true),
('Masker', 'kesehatan', 'both', 'Masker kesehatan', false, 7, 10, true),
('Al-Quran Mini', 'ibadah', 'both', 'Mushaf kecil untuk dibawa', true, 1, 1, true),
('Buku Doa Umroh', 'ibadah', 'both', 'Panduan doa-doa manasik', true, 2, 1, true),
('Sajadah Lipat', 'ibadah', 'both', 'Sajadah travel', false, 3, 1, true),
('Tasbih', 'ibadah', 'both', 'Untuk dzikir', false, 4, 1, true),
('Tas Kabin', 'perlengkapan', 'both', 'Tas kecil untuk dokumen dan barang penting', true, 1, 1, true),
('Koper', 'perlengkapan', 'both', 'Koper utama untuk pakaian', true, 2, 1, true),
('Tas Sandang', 'perlengkapan', 'both', 'Tas kecil untuk saat ibadah', false, 3, 1, true),
('Powerbank', 'perlengkapan', 'both', 'Untuk charge HP', false, 4, 1, true),
('Charger HP', 'perlengkapan', 'both', 'Charger dan kabel', true, 5, 1, true),
('Adaptor Listrik', 'perlengkapan', 'both', 'Adaptor colokan Saudi type G', false, 6, 1, true),
('Botol Minum', 'perlengkapan', 'both', 'Untuk air zamzam', false, 7, 1, true),
('Payung Lipat', 'perlengkapan', 'both', 'Pelindung panas matahari', false, 8, 1, true),
('Sabun Mandi', 'toiletries', 'both', 'Sabun tanpa pewangi (untuk ihram)', true, 1, 1, true),
('Shampoo', 'toiletries', 'both', 'Shampoo tanpa pewangi', true, 2, 1, true),
('Sikat Gigi & Pasta', 'toiletries', 'both', 'Perlengkapan sikat gigi', true, 3, 1, true),
('Handuk Kecil', 'toiletries', 'both', 'Handuk travel', false, 4, 1, true),
('Sunblock', 'toiletries', 'both', 'Pelindung kulit dari matahari', false, 5, 1, true),
('Lip Balm', 'toiletries', 'both', 'Pelembab bibir', false, 6, 1, true)
ON CONFLICT (name) DO NOTHING;


-- ==========================================
-- 5. PRAYER CATEGORIES (14 Kategori Doa — UUID tetap)
-- ==========================================
INSERT INTO public.prayer_categories (id, name, name_arabic, description, icon, priority, is_active) VALUES
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Umroh', 'أدعية العمرة', 'Doa khusus saat melaksanakan ibadah umroh', 'kaaba', 1, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Harian', 'أدعية يومية', 'Doa-doa sehari-hari yang sering dibaca', 'sun', 2, true),
('afbf6510-9033-4b7b-b3cd-560f95d954bd', 'Doa Perjalanan', 'أدعية السفر', 'Doa saat bepergian dan dalam perjalanan', 'plane', 3, true),
('ac22f67c-bfe7-47dd-87c3-7f96574b7692', 'Dzikir', 'الأذكار', 'Dzikir harian dan setelah sholat', 'sparkles', 4, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000001', 'Doa Shalat', 'أدعية الصلاة', 'Doa-doa dalam shalat', 'book-open', 5, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000002', 'Doa Makan & Minum', 'أدعية الطعام والشراب', 'Doa sebelum dan sesudah makan minum', 'utensils', 6, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000003', 'Doa Tidur & Bangun', 'أدعية النوم والاستيقاظ', 'Doa sebelum dan sesudah tidur', 'moon', 7, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000004', 'Doa Perlindungan', 'أدعية الحماية', 'Doa memohon perlindungan Allah', 'shield', 8, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000005', 'Doa Kesehatan', 'أدعية الصحة', 'Doa untuk kesehatan dan kesembuhan', 'heart', 9, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000006', 'Doa Rezeki & Keluarga', 'أدعية الرزق والأسرة', 'Doa untuk rezeki dan keluarga', 'home', 10, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000007', 'Doa Haji', 'أدعية الحج', 'Doa khusus saat ibadah haji', 'flag', 11, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000008', 'Doa Cuaca & Alam', 'أدعية الطقس', 'Doa saat hujan, petir, angin', 'cloud', 12, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000009', 'Doa Berpakaian & Bercermin', 'أدعية اللباس', 'Doa saat berpakaian dan bercermin', 'shirt', 13, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000010', 'Doa Masjid', 'أدعية المسجد', 'Doa masuk dan keluar masjid', 'landmark', 14, true)
ON CONFLICT (id) DO NOTHING;


-- ==========================================
-- 6. PRAYERS (Doa-Doa Lengkap — 92+ doa)
-- ==========================================

-- === DOA UMROH (10 doa) ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Niat Ihram Umroh', 'نية الإحرام للعمرة', 'لَبَّيْكَ اللَّهُمَّ عُمْرَةً', 'Labbaika Allahumma ''umratan', 'Aku penuhi panggilan-Mu ya Allah untuk melaksanakan umroh', 'HR. Bukhari & Muslim', 'Niat awal ibadah umroh, menandai dimulainya ihram', 1, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Talbiyah', 'التلبية', 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لاَ شَرِيْكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لاَ شَرِيْكَ لَكَ', 'Labbaika Allahumma labbaik, labbaika laa syarika laka labbaik, innal hamda wan ni''mata laka wal mulk, laa syarika lak', 'Aku penuhi panggilan-Mu ya Allah. Tidak ada sekutu bagi-Mu. Segala puji, nikmat, dan kerajaan milik-Mu.', 'HR. Bukhari & Muslim', 'Dzikir utama saat berihram', 2, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Melihat Ka''bah', 'دعاء رؤية الكعبة', 'اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيْفًا وَتَعْظِيْمًا وَتَكْرِيْمًا وَمَهَابَةً', 'Allahumma zid hadal baita tasyrifan wa ta''zhiman wa takriman wa mahabah', 'Ya Allah, tambahkanlah kemuliaan dan keagungan rumah ini', 'HR. Baihaqi', 'Doa saat pertama kali melihat Ka''bah', 3, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa di Hajar Aswad', 'دعاء عند الحجر الأسود', 'بِسْمِ اللهِ وَاللهُ أَكْبَرُ، اللَّهُمَّ إِيْمَانًا بِكَ وَتَصْدِيْقًا بِكِتَابِكَ وَوَفَاءً بِعَهْدِكَ وَاتِّبَاعًا لِسُنَّةِ نَبِيِّكَ مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ', 'Bismillahi wallahu akbar. Allahumma imanan bika wa tashdiqan bikitabika wa wafa-an bi''ahdika wattiba''an lisunnati nabiyyika', 'Dengan nama Allah, Allah Maha Besar. Ya Allah, dengan iman kepada-Mu, membenarkan kitab-Mu, memenuhi janji-Mu', 'Riwayat Ibnu Umar', 'Dibaca saat memulai tawaf dari Hajar Aswad', 4, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Tawaf (Antara Rukun Yamani & Hajar Aswad)', 'دعاء بين الركن اليماني والحجر الأسود', 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', 'Rabbana atina fid dunya hasanatan wa fil akhirati hasanatan wa qina ''adzaban nar', 'Ya Tuhan kami, berilah kami kebaikan di dunia dan akhirat, dan lindungilah kami dari azab neraka', 'QS. Al-Baqarah: 201', 'Doa antara Rukun Yamani dan Hajar Aswad saat tawaf', 5, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Setelah Shalat di Maqam Ibrahim', 'دعاء بعد صلاة المقام', 'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى', 'Wattakhidzu min maqami ibrahima mushalla', 'Dan jadikanlah Maqam Ibrahim sebagai tempat shalat', 'QS. Al-Baqarah: 125', 'Shalat 2 rakaat setelah tawaf di belakang Maqam Ibrahim', 6, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa di Bukit Shafa', 'دعاء على الصفا', 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللهِ، أَبْدَأُ بِمَا بَدَأَ اللهُ بِهِ', 'Innash shafa wal marwata min sya''airillah, abda-u bima bada-allahu bih', 'Sesungguhnya Shafa dan Marwah termasuk syiar-syiar Allah', 'HR. Muslim', 'Dibaca saat memulai sa''i di Bukit Shafa', 7, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Sa''i', 'دعاء السعي', 'رَبِّ اغْفِرْ وَارْحَمْ وَاهْدِنِي السَّبِيلَ الْأَقْوَمَ', 'Rabbighfir warham wahdinissabilal aqwam', 'Ya Tuhanku, ampunilah aku, rahmatilah aku, dan tunjukkanlah jalan yang paling lurus', 'HR. Tirmidzi', 'Dibaca selama perjalanan sa''i', 8, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Minum Air Zamzam', 'دعاء شرب زمزم', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ', 'Allahumma inni as-aluka ''ilman nafi''an wa rizqan wasi''an wa syifa-an min kulli da''in', 'Ya Allah, aku memohon ilmu yang bermanfaat, rezeki yang luas, dan kesembuhan', 'HR. Daruquthni', 'Air zamzam sesuai niat peminumnya', 9, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Multazam', 'دعاء الملتزم', 'اللَّهُمَّ يَا رَبَّ الْبَيْتِ الْعَتِيْقِ أَعْتِقْ رِقَابَنَا وَرِقَابَ آبَائِنَا وَأُمَّهَاتِنَا وَإِخْوَانِنَا وَأَوْلاَدِنَا مِنَ النَّارِ', 'Allahumma ya rabbal baytil ''atiqi, a''tiq riqabana wa riqaba aba-ina wa ummahatina wa ikhwanina wa awladina minan nar', 'Ya Allah, Tuhan pemilik Baitullah, bebaskanlah kami dan keluarga kami dari api neraka', 'Riwayat Ibnu Abbas', 'Berdoa di Multazam sangat mustajab', 10, true)
ON CONFLICT (title) DO NOTHING;

-- === DOA HARIAN (10 doa) ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Bangun Tidur', 'دعاء الاستيقاظ', 'الْحَمْدُ لِلَّهِ الَّذِيْ أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُوْرُ', 'Alhamdulillahilladzi ahyana ba''da ma amatana wa ilaihin nusyur', 'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami', 'HR. Bukhari', 'Bersyukur atas nikmat hidup setiap pagi', 1, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Sebelum Makan', 'دعاء قبل الأكل', 'بِسْمِ اللهِ وَعَلَى بَرَكَةِ اللهِ', 'Bismillahi wa ''ala barakatillah', 'Dengan nama Allah dan atas berkah Allah', 'HR. Abu Dawud', 'Mendapat berkah dalam makanan', 2, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Sesudah Makan', 'دعاء بعد الأكل', 'الْحَمْدُ لِلَّهِ الَّذِيْ أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِيْنَ', 'Alhamdulillahilladzi ath''amana wa saqana wa ja''alana muslimin', 'Segala puji bagi Allah yang telah memberi kami makan dan minum', 'HR. Abu Dawud & Tirmidzi', 'Bersyukur atas rezeki makanan', 3, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Keluar Rumah', 'دعاء الخروج من المنزل', 'بِسْمِ اللهِ تَوَكَّلْتُ عَلَى اللهِ وَلاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللهِ', 'Bismillahi tawakkaltu ''alallahi wa laa haula wa laa quwwata illa billah', 'Dengan nama Allah, aku bertawakal kepada Allah', 'HR. Abu Dawud & Tirmidzi', 'Dilindungi dan dijauhi setan', 4, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Masuk Rumah', 'دعاء دخول المنزل', 'بِسْمِ اللهِ وَلَجْنَا وَبِسْمِ اللهِ خَرَجْنَا وَعَلَى رَبِّنَا تَوَكَّلْنَا', 'Bismillahi walajna wa bismillahi kharajna wa ''ala rabbina tawakkalna', 'Dengan nama Allah kami masuk, dengan nama Allah kami keluar', 'HR. Abu Dawud', 'Rumah diberkahi', 5, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Masuk Kamar Mandi', 'دعاء دخول الخلاء', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ', 'Allahumma inni a''udzu bika minal khubutsi wal khaba-its', 'Ya Allah, aku berlindung kepada-Mu dari setan laki-laki dan perempuan', 'HR. Bukhari & Muslim', 'Perlindungan dari gangguan jin', 6, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Keluar Kamar Mandi', 'دعاء الخروج من الخلاء', 'غُفْرَانَكَ', 'Ghufranaka', 'Aku mohon ampunan-Mu', 'HR. Abu Dawud & Tirmidzi', 'Memohon ampunan', 7, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Sebelum Wudhu', 'دعاء قبل الوضوء', 'بِسْمِ اللهِ', 'Bismillah', 'Dengan nama Allah', 'HR. Abu Dawud', 'Memberkahi wudhu', 8, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Berpakaian', 'دعاء لبس الثوب', 'اَلْحَمْدُ لِلّٰهِ الَّذِيْ كَسَانِيْ هٰذَا وَرَزَقَنِيْهِ مِنْ غَيْرِ حَوْلٍ مِنِّيْ وَلَا قُوَّةٍ', 'Alhamdulillahil ladzi kasaanii haadza wa razaqaniihi min ghairi haulin minnii wa laa quwwah', 'Segala puji bagi Allah yang telah memberiku pakaian ini', 'HR. Abu Dawud & Tirmidzi', 'Bersyukur atas nikmat pakaian', 9, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Bercermin', 'دعاء النظر في المرآة', 'اللّٰهُمَّ أَنْتَ حَسَّنْتَ خَلْقِيْ فَحَسِّنْ خُلُقِيْ', 'Allaahumma anta hassanta khalqii fahassin khuluqii', 'Ya Allah, Engkau telah membaguskan ciptaanku maka baguskanlah akhlakku', 'HR. Ahmad', 'Memohon akhlak yang baik', 10, true)
ON CONFLICT (title) DO NOTHING;

-- === DOA PERJALANAN (4 doa) ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('afbf6510-9033-4b7b-b3cd-560f95d954bd', 'Doa Naik Kendaraan', 'دعاء ركوب الدابة', 'سُبْحَانَ الَّذِيْ سَخَّرَ لَنَا هٰذَا وَمَا كُنَّا لَهُ مُقْرِنِيْنَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُوْنَ', 'Subhaanal ladzi sakhkhara lana haadza wa ma kunna lahu muqriniin', 'Maha Suci Allah yang telah menundukkan ini untuk kami', 'QS. Az-Zukhruf: 13-14', 'Keselamatan dalam perjalanan', 1, true),
('afbf6510-9033-4b7b-b3cd-560f95d954bd', 'Doa Berangkat Bepergian', 'دعاء السفر', 'اللّٰهُمَّ إِنَّا نَسْأَلُكَ فِيْ سَفَرِنَا هٰذَا الْبِرَّ وَالتَّقْوَى', 'Allaahumma inna nas''aluka fii safarinaa haadzal birra wat taqwa', 'Ya Allah, kami memohon kebaikan dan ketakwaan dalam perjalanan ini', 'HR. Muslim', 'Perjalanan diberkahi', 2, true),
('afbf6510-9033-4b7b-b3cd-560f95d954bd', 'Doa Sampai di Tujuan', 'دعاء الوصول', 'اللّٰهُمَّ رَبَّ السَّمٰوَاتِ السَّبْعِ وَمَا أَظَلَّتْ، أَسْأَلُكَ خَيْرَ هٰذِهِ الْقَرْيَةِ', 'Allaahumma rabbas samaawaatis sab''i wa maa adhallat, as''aluka khaira haadzihil qaryah', 'Ya Allah, Tuhan langit yang tujuh, aku memohon kebaikan negeri ini', 'HR. Ibnu Hibban', 'Mendapat kebaikan di tempat tujuan', 3, true),
('afbf6510-9033-4b7b-b3cd-560f95d954bd', 'Doa Pulang dari Perjalanan', 'دعاء العودة من السفر', 'آيِبُوْنَ تَائِبُوْنَ عَابِدُوْنَ لِرَبِّنَا حَامِدُوْنَ', 'Aayibuuna taa''ibuuna ''aabiduuna lirabbinaa haamiduun', 'Kami kembali, bertaubat, beribadah, dan memuji Tuhan kami', 'HR. Bukhari & Muslim', 'Kepulangan yang diberkahi', 4, true)
ON CONFLICT (title) DO NOTHING;

-- === DOA MASJID (3 doa) ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000010', 'Doa Masuk Masjid', 'دعاء دخول المسجد', 'اللّٰهُمَّ افْتَحْ لِيْ أَبْوَابَ رَحْمَتِكَ', 'Allaahummaf tahlii abwaaba rahmatik', 'Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu', 'HR. Muslim', 'Dibukakan pintu rahmat', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000010', 'Doa Keluar Masjid', 'دعاء الخروج من المسجد', 'اللّٰهُمَّ إِنِّيْ أَسْأَلُكَ مِنْ فَضْلِكَ', 'Allaahumma innii as''aluka min fadhlika', 'Ya Allah, sesungguhnya aku memohon karunia-Mu', 'HR. Muslim', 'Memohon karunia Allah', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000010', 'Doa Masuk Masjid Nabawi', 'دعاء دخول المسجد النبوي', 'بِسْمِ اللّٰهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُوْلِ اللّٰهِ، اللّٰهُمَّ اغْفِرْ لِيْ ذُنُوْبِيْ وَافْتَحْ لِيْ أَبْوَابَ رَحْمَتِكَ', 'Bismillahi was shalaatu was salaamu ''alaa rasuulillah, allaahummagh firlii dzunuubii waftah lii abwaaba rahmatik', 'Dengan nama Allah, shalawat dan salam atas Rasulullah', 'HR. Muslim', 'Doa khusus memasuki Masjid Nabawi', 3, true)
ON CONFLICT (title) DO NOTHING;

-- === DOA PERLINDUNGAN (3 doa) ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000004', 'Doa Mohon Perlindungan', 'دعاء الاستعاذة', 'أَعُوْذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', 'A''uudzu bikalimaatillaahit taammaati min syarri maa khalaq', 'Aku berlindung dengan kalimat-kalimat Allah dari kejahatan makhluk-Nya', 'HR. Muslim', 'Perlindungan dari segala kejahatan', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000004', 'Doa Pagi Hari', 'دعاء الصباح', 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلّٰهِ، وَالْحَمْدُ لِلّٰهِ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ', 'Ashbahnaa wa ashbahal mulku lillah, wal hamdu lillah, laa ilaaha illallaahu wahdahu laa syariikalah', 'Kami memasuki pagi dan kerajaan menjadi milik Allah', 'HR. Abu Dawud', 'Perlindungan di pagi hari', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000004', 'Doa Sore Hari', 'دعاء المساء', 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلّٰهِ، وَالْحَمْدُ لِلّٰهِ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ', 'Amsainaa wa amsal mulku lillah, wal hamdu lillah, laa ilaaha illallaahu wahdahu laa syariikalah', 'Kami memasuki sore dan kerajaan menjadi milik Allah', 'HR. Abu Dawud', 'Perlindungan di sore hari', 3, true)
ON CONFLICT (title) DO NOTHING;

-- === DOA KESEHATAN (2 doa) ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000005', 'Doa Mohon Kesehatan', 'دعاء طلب الصحة', 'اللّٰهُمَّ عَافِنِيْ فِيْ بَدَنِيْ، اللّٰهُمَّ عَافِنِيْ فِيْ سَمْعِيْ، اللّٰهُمَّ عَافِنِيْ فِيْ بَصَرِيْ', 'Allaahumma ''aafini fii badanii, allaahumma ''aafini fii sam''ii, allaahumma ''aafini fii bashari', 'Ya Allah, sehatkanlah badanku, pendengaranku, dan penglihatanku', 'HR. Abu Dawud', 'Memohon kesehatan jasmani', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000005', 'Doa untuk Orang Sakit', 'دعاء للمريض', 'اللّٰهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اِشْفِ أَنْتَ الشَّافِيْ، لَا شِفَاءَ إِلَّا شِفَاؤُكَ', 'Allaahumma rabban naas, adzhibil ba''s, isyfi antas syaafii, laa syifaa''a illa syifaa''uka', 'Ya Allah, hilangkanlah penyakit, sembuhkanlah karena Engkau Maha Penyembuh', 'HR. Bukhari & Muslim', 'Doa menjenguk orang sakit', 2, true)
ON CONFLICT (title) DO NOTHING;

-- === DOA MAKAN & MINUM (4 doa) ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000002', 'Doa Sebelum Minum', 'دعاء قبل الشرب', 'بِسْمِ اللّٰهِ', 'Bismillah', 'Dengan nama Allah', 'HR. Bukhari', 'Memberkahi minuman', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000002', 'Doa Sesudah Minum', 'دعاء بعد الشرب', 'اَلْحَمْدُ لِلّٰهِ', 'Alhamdulillah', 'Segala puji bagi Allah', 'HR. Tirmidzi', 'Bersyukur atas nikmat minum', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000002', 'Doa Lupa Bismillah Saat Makan', 'دعاء نسيان البسملة', 'بِسْمِ اللّٰهِ أَوَّلَهُ وَآخِرَهُ', 'Bismillahi awwalahu wa aakhirahu', 'Dengan nama Allah pada awalnya dan akhirnya', 'HR. Abu Dawud & Tirmidzi', 'Memperbaiki makan tanpa bismillah', 3, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000002', 'Doa Makan di Rumah Orang', 'دعاء الأكل عند الغير', 'اللّٰهُمَّ بَارِكْ لَهُمْ فِيْمَا رَزَقْتَهُمْ وَاغْفِرْ لَهُمْ وَارْحَمْهُمْ', 'Allaahumma baarik lahum fiima razaqtahum waghfir lahum warhamhum', 'Ya Allah, berkahilah mereka dalam rezeki yang Engkau berikan', 'HR. Muslim', 'Mendoakan tuan rumah', 4, true)
ON CONFLICT (title) DO NOTHING;

-- === DOA TIDUR (4 doa) ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000003', 'Doa Hendak Tidur', 'دعاء النوم', 'بِاسْمِكَ اللّٰهُمَّ أَمُوْتُ وَأَحْيَا', 'Bismikallaahumma amuutu wa ahyaa', 'Dengan nama-Mu ya Allah aku mati dan aku hidup', 'HR. Bukhari', 'Menyerahkan diri kepada Allah saat tidur', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000003', 'Doa Bangun Tidur (Lengkap)', 'دعاء الاستيقاظ الكامل', 'اَلْحَمْدُ لِلّٰهِ الَّذِيْ أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُوْرُ', 'Alhamdulillahil ladzi ahyana ba''da ma amaatana wa ilaihin nusyuur', 'Segala puji bagi Allah yang telah menghidupkan kami', 'HR. Bukhari', 'Bersyukur atas kehidupan', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000003', 'Doa Susah Tidur', 'دعاء عند الأرق', 'اللّٰهُمَّ غَارَتِ النُّجُوْمُ وَهَدَأَتِ الْعُيُوْنُ وَأَنْتَ حَيٌّ قَيُّوْمٌ', 'Allaahumma ghaaratinnujuum wa hada''atil ''uyuun wa anta hayyun qayyuum', 'Ya Allah, bintang-bintang telah tenggelam dan mata-mata telah tenang', 'Hadits', 'Membantu menenangkan diri saat insomnia', 3, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000003', 'Doa Mimpi Buruk', 'دعاء الكابوس', 'أَعُوْذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ غَضَبِهِ وَعِقَابِهِ وَشَرِّ عِبَادِهِ', 'A''uudzu bikalimaatillaahit taammaati min ghadhabihi wa ''iqaabihi wa syarri ''ibaadihi', 'Aku berlindung dengan kalimat-kalimat Allah dari kemarahan-Nya', 'HR. Abu Dawud', 'Perlindungan dari mimpi buruk', 4, true)
ON CONFLICT (title) DO NOTHING;


-- ==========================================
-- 7. HAJI CHECKLISTS (9 item)
-- ==========================================
INSERT INTO haji_checklists (title, description, category, is_required, priority, applies_to, is_active) VALUES
('NIK dan KK', 'Nomor Induk Kependudukan dan Kartu Keluarga asli', 'dokumen', true, 1, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Akta Kelahiran', 'Akta kelahiran asli atau surat kenal lahir', 'dokumen', true, 2, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Buku Nikah/Akta Cerai', 'Untuk yang sudah menikah/bercerai', 'dokumen', false, 3, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Paspor', 'Paspor masa berlaku minimal 6 bulan', 'dokumen', true, 4, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Pas Foto', 'Foto 4x6 background putih, 80% wajah', 'dokumen', true, 5, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Surat Keterangan Sehat', 'Dari dokter/Puskesmas', 'kesehatan', true, 6, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Vaksinasi Meningitis', 'Kartu bukti vaksinasi', 'kesehatan', true, 7, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Setoran Awal BPIH', 'Bukti setoran awal Rp 25 juta', 'pembayaran', true, 8, ARRAY['haji_reguler'], true),
('Pelunasan BPIH', 'Bukti pelunasan biaya haji', 'pembayaran', true, 9, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true)
ON CONFLICT (title) DO NOTHING;


-- ==========================================
-- 8. EXERCISE TYPES (8 Jenis Olahraga)
-- ==========================================
INSERT INTO exercise_types (name, icon, description, intensity, recommended_time, duration_minutes, is_ramadan_friendly, is_active, priority) VALUES
('Jalan Kaki', 'footprints', 'Jalan kaki santai 15-30 menit', 'ringan', 'sebelum_berbuka', 15, true, true, 1),
('Stretching', 'move', 'Peregangan untuk fleksibilitas', 'ringan', 'setelah_sahur', 10, true, true, 2),
('Yoga Ringan', 'activity', 'Yoga dasar untuk relaksasi', 'ringan', 'setelah_tarawih', 20, true, true, 3),
('Jogging', 'activity', 'Lari ringan', 'sedang', 'setelah_tarawih', 20, true, true, 4),
('Bersepeda', 'bike', 'Bersepeda santai', 'sedang', 'sebelum_berbuka', 30, true, true, 5),
('Berenang', 'waves', 'Berenang santai', 'sedang', 'kapan_saja', 30, true, true, 6),
('Angkat Beban', 'dumbbell', 'Latihan beban ringan', 'berat', 'setelah_tarawih', 30, false, true, 7),
('HIIT Ringan', 'activity', 'High Intensity Interval Training ringan', 'berat', 'setelah_tarawih', 15, false, true, 8)
ON CONFLICT (name) DO NOTHING;


-- ==========================================
-- 9. IBADAH HABITS (13 Habit Ibadah)
-- ==========================================
INSERT INTO ibadah_habits (name, name_arabic, category, description, icon, target_count, is_ramadan_specific, is_active, priority) VALUES
('Sholat Subuh', 'صلاة الفجر', 'sholat', 'Sholat Subuh tepat waktu', 'sun', 1, false, true, 1),
('Sholat Dhuha', 'صلاة الضحى', 'sholat', 'Sholat Dhuha 2-4 rakaat', 'sunrise', 1, false, true, 2),
('Sholat Tahajud', 'صلاة التهجد', 'sholat', 'Sholat Tahajud malam hari', 'moon', 1, false, true, 3),
('Tilawah Al-Quran', 'تلاوة القرآن', 'quran', 'Membaca Al-Quran minimal 1 halaman', 'book-open', 1, false, true, 4),
('Dzikir Pagi', 'أذكار الصباح', 'dzikir', 'Membaca dzikir pagi', 'sun', 1, false, true, 5),
('Dzikir Sore', 'أذكار المساء', 'dzikir', 'Membaca dzikir sore', 'sunset', 1, false, true, 6),
('Istighfar 100x', 'الاستغفار', 'dzikir', 'Membaca istighfar 100 kali', 'sparkles', 100, false, true, 7),
('Sholawat Nabi', 'الصلاة على النبي', 'dzikir', 'Membaca sholawat Nabi', 'heart', 100, false, true, 8),
('Sedekah', 'الصدقة', 'amal', 'Bersedekah minimal Rp 1.000', 'hand-heart', 1, false, true, 9),
('Puasa Sunnah', 'صيام السنة', 'puasa', 'Puasa sunnah Senin/Kamis', 'moon', 1, false, true, 10),
('Sholat Tarawih', 'صلاة التراويح', 'sholat', 'Sholat Tarawih di bulan Ramadan', 'moon-star', 1, true, true, 11),
('Tadarus Al-Quran', 'تدارس القرآن', 'quran', 'Tadarus 1 juz per hari di Ramadan', 'book-open', 1, true, true, 12),
('I''tikaf', 'الاعتكاف', 'ibadah', 'I''tikaf di masjid', 'home', 1, true, true, 13)
ON CONFLICT (name) DO NOTHING;


-- ==========================================
-- 10. DZIKIR TYPES (8 Jenis Dzikir)
-- ==========================================
INSERT INTO dzikir_types (name, name_arabic, category, description, icon, default_target, is_active, priority) VALUES
('Subhanallah', 'سبحان الله', 'tasbih', 'Maha Suci Allah', 'sparkles', 33, true, 1),
('Alhamdulillah', 'الحمد لله', 'tasbih', 'Segala puji bagi Allah', 'heart', 33, true, 2),
('Allahu Akbar', 'الله أكبر', 'tasbih', 'Allah Maha Besar', 'star', 33, true, 3),
('La ilaha illallah', 'لا إله إلا الله', 'tahlil', 'Tiada Tuhan selain Allah', 'moon', 100, true, 4),
('Istighfar', 'أستغفر الله', 'istighfar', 'Aku memohon ampun kepada Allah', 'droplets', 100, true, 5),
('Sholawat', 'اللهم صل على محمد', 'sholawat', 'Sholawat kepada Nabi Muhammad', 'sun', 100, true, 6),
('Hasbunallah', 'حسبنا الله ونعم الوكيل', 'dzikir_lain', 'Cukuplah Allah sebagai penolong kami', 'shield', 7, true, 7),
('La haula wa la quwwata', 'لا حول ولا قوة إلا بالله', 'dzikir_lain', 'Tiada daya dan kekuatan kecuali dengan Allah', 'zap', 33, true, 8)
ON CONFLICT (name) DO NOTHING;


-- ==========================================
-- 11. QURAN SURAHS (114 Surat Al-Quran)
-- ==========================================
INSERT INTO public.quran_surahs (number, name, name_arabic, total_verses, juz_start) VALUES
(1, 'Al-Fatihah', 'الفاتحة', 7, 1),
(2, 'Al-Baqarah', 'البقرة', 286, 1),
(3, 'Ali ''Imran', 'آل عمران', 200, 3),
(4, 'An-Nisa''', 'النساء', 176, 4),
(5, 'Al-Ma''idah', 'المائدة', 120, 6),
(6, 'Al-An''am', 'الأنعام', 165, 7),
(7, 'Al-A''raf', 'الأعراف', 206, 8),
(8, 'Al-Anfal', 'الأنفال', 75, 9),
(9, 'At-Taubah', 'التوبة', 129, 10),
(10, 'Yunus', 'يونس', 109, 11),
(11, 'Hud', 'هود', 123, 11),
(12, 'Yusuf', 'يوسف', 111, 12),
(13, 'Ar-Ra''d', 'الرعد', 43, 13),
(14, 'Ibrahim', 'إبراهيم', 52, 13),
(15, 'Al-Hijr', 'الحجر', 99, 14),
(16, 'An-Nahl', 'النحل', 128, 14),
(17, 'Al-Isra''', 'الإسراء', 111, 15),
(18, 'Al-Kahf', 'الكهف', 110, 15),
(19, 'Maryam', 'مريم', 98, 16),
(20, 'Taha', 'طه', 135, 16),
(21, 'Al-Anbiya''', 'الأنبياء', 112, 17),
(22, 'Al-Hajj', 'الحج', 78, 17),
(23, 'Al-Mu''minun', 'المؤمنون', 118, 18),
(24, 'An-Nur', 'النور', 64, 18),
(25, 'Al-Furqan', 'الفرقان', 77, 18),
(26, 'Ash-Shu''ara''', 'الشعراء', 227, 19),
(27, 'An-Naml', 'النمل', 93, 19),
(28, 'Al-Qasas', 'القصص', 88, 20),
(29, 'Al-''Ankabut', 'العنكبوت', 69, 20),
(30, 'Ar-Rum', 'الروم', 60, 21),
(31, 'Luqman', 'لقمان', 34, 21),
(32, 'As-Sajdah', 'السجدة', 30, 21),
(33, 'Al-Ahzab', 'الأحزاب', 73, 21),
(34, 'Saba''', 'سبأ', 54, 22),
(35, 'Fatir', 'فاطر', 45, 22),
(36, 'Ya-Sin', 'يس', 83, 22),
(37, 'As-Saffat', 'الصافات', 182, 23),
(38, 'Sad', 'ص', 88, 23),
(39, 'Az-Zumar', 'الزمر', 75, 23),
(40, 'Ghafir', 'غافر', 85, 24),
(41, 'Fussilat', 'فصلت', 54, 24),
(42, 'Ash-Shura', 'الشورى', 53, 25),
(43, 'Az-Zukhruf', 'الزخرف', 89, 25),
(44, 'Ad-Dukhan', 'الدخان', 59, 25),
(45, 'Al-Jathiyah', 'الجاثية', 37, 25),
(46, 'Al-Ahqaf', 'الأحقاف', 35, 26),
(47, 'Muhammad', 'محمد', 38, 26),
(48, 'Al-Fath', 'الفتح', 29, 26),
(49, 'Al-Hujurat', 'الحجرات', 18, 26),
(50, 'Qaf', 'ق', 45, 26),
(51, 'Adh-Dhariyat', 'الذاريات', 60, 26),
(52, 'At-Tur', 'الطور', 49, 27),
(53, 'An-Najm', 'النجم', 62, 27),
(54, 'Al-Qamar', 'القمر', 55, 27),
(55, 'Ar-Rahman', 'الرحمن', 78, 27),
(56, 'Al-Waqi''ah', 'الواقعة', 96, 27),
(57, 'Al-Hadid', 'الحديد', 29, 27),
(58, 'Al-Mujadila', 'المجادلة', 22, 28),
(59, 'Al-Hashr', 'الحشر', 24, 28),
(60, 'Al-Mumtahanah', 'الممتحنة', 13, 28),
(61, 'As-Saff', 'الصف', 14, 28),
(62, 'Al-Jumu''ah', 'الجمعة', 11, 28),
(63, 'Al-Munafiqun', 'المنافقون', 11, 28),
(64, 'At-Taghabun', 'التغابن', 18, 28),
(65, 'At-Talaq', 'الطلاق', 12, 28),
(66, 'At-Tahrim', 'التحريم', 12, 28),
(67, 'Al-Mulk', 'الملك', 30, 29),
(68, 'Al-Qalam', 'القلم', 52, 29),
(69, 'Al-Haqqah', 'الحاقة', 52, 29),
(70, 'Al-Ma''arij', 'المعارج', 44, 29),
(71, 'Nuh', 'نوح', 28, 29),
(72, 'Al-Jinn', 'الجن', 28, 29),
(73, 'Al-Muzzammil', 'المزمل', 20, 29),
(74, 'Al-Muddaththir', 'المدثر', 56, 29),
(75, 'Al-Qiyamah', 'القيامة', 40, 29),
(76, 'Al-Insan', 'الإنسان', 31, 29),
(77, 'Al-Mursalat', 'المرسلات', 50, 29),
(78, 'An-Naba''', 'النبأ', 40, 30),
(79, 'An-Nazi''at', 'النازعات', 46, 30),
(80, '''Abasa', 'عبس', 42, 30),
(81, 'At-Takwir', 'التكوير', 29, 30),
(82, 'Al-Infitar', 'الانفطار', 19, 30),
(83, 'Al-Mutaffifin', 'المطففين', 36, 30),
(84, 'Al-Inshiqaq', 'الانشقاق', 25, 30),
(85, 'Al-Buruj', 'البروج', 22, 30),
(86, 'At-Tariq', 'الطارق', 17, 30),
(87, 'Al-A''la', 'الأعلى', 19, 30),
(88, 'Al-Ghashiyah', 'الغاشية', 26, 30),
(89, 'Al-Fajr', 'الفجر', 30, 30),
(90, 'Al-Balad', 'البلد', 20, 30),
(91, 'Ash-Shams', 'الشمس', 15, 30),
(92, 'Al-Layl', 'الليل', 21, 30),
(93, 'Ad-Duhaa', 'الضحى', 11, 30),
(94, 'Ash-Sharh', 'الشرح', 8, 30),
(95, 'At-Tin', 'التين', 8, 30),
(96, 'Al-''Alaq', 'العلق', 19, 30),
(97, 'Al-Qadr', 'القدر', 5, 30),
(98, 'Al-Bayyinah', 'البينة', 8, 30),
(99, 'Az-Zalzalah', 'الزلزلة', 8, 30),
(100, 'Al-''Adiyat', 'العاديات', 11, 30),
(101, 'Al-Qari''ah', 'القارعة', 11, 30),
(102, 'At-Takathur', 'التكاثر', 8, 30),
(103, 'Al-''Asr', 'العصر', 3, 30),
(104, 'Al-Humazah', 'الهمزة', 9, 30),
(105, 'Al-Fil', 'الفيل', 5, 30),
(106, 'Quraysh', 'قريش', 4, 30),
(107, 'Al-Ma''un', 'الماعون', 7, 30),
(108, 'Al-Kawthar', 'الكوثر', 3, 30),
(109, 'Al-Kafirun', 'الكافرون', 6, 30),
(110, 'An-Nasr', 'النصر', 3, 30),
(111, 'Al-Masad', 'المسد', 5, 30),
(112, 'Al-Ikhlas', 'الإخلاص', 4, 30),
(113, 'Al-Falaq', 'الفلق', 5, 30),
(114, 'An-Nas', 'الناس', 6, 30)
ON CONFLICT (number) DO NOTHING;


-- ==========================================
-- 12. STATIC PAGES (4 Halaman Statis)
-- ==========================================
INSERT INTO public.static_pages (slug, title, content, is_active) VALUES
('privacy-policy', 'Kebijakan Privasi', '# Kebijakan Privasi

Kami menghargai privasi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.

## Informasi yang Kami Kumpulkan
- Data profil pengguna
- Riwayat aktivitas ibadah
- Preferensi aplikasi

## Penggunaan Informasi
Informasi Anda digunakan untuk:
- Menyediakan layanan aplikasi
- Meningkatkan pengalaman pengguna
- Mengirim notifikasi penting

## Keamanan Data
Kami menggunakan enkripsi dan praktik keamanan terbaik untuk melindungi data Anda.', true),

('terms-conditions', 'Syarat & Ketentuan', '# Syarat & Ketentuan

Dengan menggunakan aplikasi ini, Anda menyetujui syarat dan ketentuan berikut.

## Penggunaan Layanan
- Gunakan aplikasi untuk tujuan yang sah
- Jangan menyalahgunakan fitur aplikasi
- Hormati pengguna lain

## Hak Kekayaan Intelektual
Semua konten dalam aplikasi ini dilindungi hak cipta.

## Batasan Tanggung Jawab
Kami tidak bertanggung jawab atas kerugian yang timbul dari penggunaan aplikasi.', true),

('about', 'Tentang Kami', '# Tentang Arah Umroh

Arah Umroh adalah aplikasi super untuk perjalanan ibadah Umroh dan Haji Anda.

## Visi
Memudahkan setiap muslim dalam mempersiapkan dan menjalani ibadah umroh/haji.

## Fitur Unggulan
- Pencarian paket umroh & haji
- Panduan manasik lengkap
- Tracker ibadah harian
- Al-Quran digital
- Peta lokasi penting
- Dan masih banyak lagi!

## Kontak
Email: support@arahumroh.com', true),

('faq', 'FAQ', '# Pertanyaan Umum (FAQ)

## Bagaimana cara booking paket?
Pilih paket yang Anda inginkan, lalu klik tombol "Booking" dan ikuti instruksi selanjutnya.

## Apakah ada biaya untuk menggunakan aplikasi?
Aplikasi dasar gratis. Fitur premium tersedia dengan langganan berbayar.

## Bagaimana cara menghubungi travel agent?
Setelah booking, Anda dapat menghubungi travel agent melalui fitur chat di aplikasi.

## Apakah data saya aman?
Ya, kami menggunakan enkripsi standar industri untuk melindungi data Anda.', true)
ON CONFLICT (slug) DO NOTHING;


-- ==========================================
-- 13. PLATFORM SETTINGS
-- ==========================================
INSERT INTO platform_settings (key, value, description) VALUES
('featured_price_per_day', '{"amount": 50000}', 'Harga kredit per hari untuk featured package'),
('min_featured_duration', '{"days": 7}', 'Minimal durasi featured package'),
('max_featured_duration', '{"days": 30}', 'Maksimal durasi featured package'),
('platform_fee_percentage', '{"percentage": 5}', 'Persentase fee platform dari setiap booking'),
('currency_rates', '{"SAR_to_IDR": 4200}', 'Kurs mata uang Saudi Riyal ke Rupiah'),
('premium_trial_config', '{"enabled": true, "durationDays": 30}', 'Konfigurasi free trial premium 30 hari'),
('premium_plan_config', '{"name": "Premium Ibadah Tracker", "description": "Akses penuh fitur cloud & statistik", "priceYearly": 29000, "features": ["Sync data ke cloud", "Backup otomatis", "Akses multi-device", "Statistik lengkap", "Export data"]}', 'Konfigurasi paket premium')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- ==========================================
-- 14. WEBSITE TEMPLATES
-- ==========================================
INSERT INTO website_templates (name, slug, description, thumbnail_url, is_premium, is_active) VALUES
('Default Theme', 'default', 'Tampilan standar yang bersih dan profesional.', '/placeholder.svg', false, true),
('Gold Luxury', 'gold-luxury', 'Desain mewah dengan nuansa emas.', '/placeholder.svg', true, true)
ON CONFLICT (slug) DO NOTHING;


-- ==========================================
-- 15. SUBSCRIPTION PLANS
-- ==========================================
INSERT INTO subscription_plans (name, description, price_yearly, features, is_active) VALUES
('Premium Ibadah Tracker', 'Akses penuh fitur cloud & statistik', 29000, ARRAY['Sync data ke cloud', 'Backup otomatis', 'Akses multi-device', 'Statistik lengkap', 'Export data'], true)
ON CONFLICT (name) DO NOTHING;


-- ==========================================
-- SELESAI!
-- Total data:
--   1. Manasik Guides: 6 panduan umroh
--   2. Important Locations: 18 lokasi (Makkah & Madinah)
--   3. Checklists: 16 checklist persiapan
--   4. Packing Templates: 39 item packing
--   5. Prayer Categories: 14 kategori doa
--   6. Prayers: 40+ doa lengkap (Arab, latin, terjemahan)
--   7. Haji Checklists: 9 dokumen haji
--   8. Exercise Types: 8 jenis olahraga
--   9. Ibadah Habits: 13 habit ibadah
--  10. Dzikir Types: 8 jenis dzikir
--  11. Quran Surahs: 114 surat Al-Quran
--  12. Static Pages: 4 halaman (Privacy, Terms, About, FAQ)
--  13. Platform Settings: 7 konfigurasi
--  14. Website Templates: 2 template
--  15. Subscription Plans: 1 paket premium
--
-- Script ini aman dijalankan berulang kali.
-- Data yang sudah ada tidak akan duplikat.
-- ==========================================
