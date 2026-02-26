-- ==========================================
-- ARAH UMROH - SEED DATA IDEMPOTENT
-- Aman dijalankan berulang kali tanpa error
-- Menggunakan ON CONFLICT DO NOTHING
-- ==========================================

-- ========================================
-- 1. MANASIK GUIDES (Panduan Umroh)
-- Unique key: title + category
-- ========================================
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
'Aku memenuhi panggilan-Mu ya Allah, aku memenuhi panggilan-Mu. Tidak ada sekutu bagi-Mu. Segala puji, nikmat, dan kerajaan milik-Mu.',
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


-- ========================================
-- 2. IMPORTANT LOCATIONS (Lokasi Penting)
-- ========================================
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


-- ========================================
-- 3. CHECKLISTS (Checklist Persiapan)
-- ========================================
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


-- ========================================
-- 4. PACKING TEMPLATES (Template Packing List)
-- ========================================
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


-- ========================================
-- 5. PRAYER CATEGORIES (Kategori Doa)
-- ========================================
INSERT INTO prayer_categories (name, name_arabic, description, icon, priority, is_active) VALUES
('Doa Harian', 'أدعية يومية', 'Doa-doa sehari-hari yang sering dibaca', 'sun', 1, true),
('Doa Perjalanan', 'أدعية السفر', 'Doa saat bepergian dan dalam perjalanan', 'plane', 2, true),
('Doa Umroh', 'أدعية العمرة', 'Doa khusus saat melaksanakan ibadah umroh', 'kaaba', 3, true),
('Doa di Masjid', 'أدعية المسجد', 'Doa saat masuk dan keluar masjid', 'mosque', 4, true),
('Doa Perlindungan', 'أدعية الحماية', 'Doa memohon perlindungan Allah', 'shield', 5, true),
('Doa Kesehatan', 'أدعية الصحة', 'Doa untuk kesehatan dan kesembuhan', 'heart-pulse', 6, true),
('Doa Makan & Minum', 'أدعية الطعام والشراب', 'Doa sebelum dan sesudah makan minum', 'utensils', 7, true),
('Doa Tidur', 'أدعية النوم', 'Doa sebelum dan sesudah tidur', 'moon', 8, true)
ON CONFLICT (name) DO NOTHING;


-- ========================================
-- 6. PRAYERS (Doa-Doa) - Idempotent
-- ========================================
DO $$
DECLARE
    cat_harian UUID;
    cat_perjalanan UUID;
    cat_umroh UUID;
    cat_masjid UUID;
    cat_perlindungan UUID;
    cat_kesehatan UUID;
    cat_makan UUID;
    cat_tidur UUID;
BEGIN
    SELECT id INTO cat_harian FROM prayer_categories WHERE name = 'Doa Harian';
    SELECT id INTO cat_perjalanan FROM prayer_categories WHERE name = 'Doa Perjalanan';
    SELECT id INTO cat_umroh FROM prayer_categories WHERE name = 'Doa Umroh';
    SELECT id INTO cat_masjid FROM prayer_categories WHERE name = 'Doa di Masjid';
    SELECT id INTO cat_perlindungan FROM prayer_categories WHERE name = 'Doa Perlindungan';
    SELECT id INTO cat_kesehatan FROM prayer_categories WHERE name = 'Doa Kesehatan';
    SELECT id INTO cat_makan FROM prayer_categories WHERE name = 'Doa Makan & Minum';
    SELECT id INTO cat_tidur FROM prayer_categories WHERE name = 'Doa Tidur';

    -- Doa Harian
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Bangun Tidur', 'دعاء الاستيقاظ من النوم', 
    'اَلْحَمْدُ لِلّٰهِ الَّذِيْ أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُوْرُ',
    'Alhamdulillahil ladzi ahyana ba''da ma amaatana wa ilaihin nusyuur',
    'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami',
    cat_harian, 'HR. Bukhari', 1, true),
    
    ('Doa Sebelum Tidur', 'دعاء النوم',
    'بِاسْمِكَ اللّٰهُمَّ أَمُوْتُ وَأَحْيَا',
    'Bismikallaahumma amuutu wa ahyaa',
    'Dengan nama-Mu ya Allah, aku mati dan aku hidup',
    cat_harian, 'HR. Bukhari', 2, true),
    
    ('Doa Masuk Kamar Mandi', 'دعاء دخول الخلاء',
    'اللّٰهُمَّ إِنِّيْ أَعُوْذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
    'Allaahumma innii a''uudzubika minal khubutsi wal khabaa''its',
    'Ya Allah, aku berlindung kepada-Mu dari setan laki-laki dan setan perempuan',
    cat_harian, 'HR. Bukhari & Muslim', 3, true),
    
    ('Doa Keluar Kamar Mandi', 'دعاء الخروج من الخلاء',
    'غُفْرَانَكَ',
    'Ghufraanak',
    'Aku mohon ampunan-Mu',
    cat_harian, 'HR. Abu Dawud & Tirmidzi', 4, true),
    
    ('Doa Sebelum Makan', 'دعاء قبل الأكل',
    'بِسْمِ اللّٰهِ',
    'Bismillah',
    'Dengan nama Allah',
    cat_harian, 'HR. Abu Dawud', 5, true),
    
    ('Doa Sesudah Makan', 'دعاء بعد الأكل',
    'اَلْحَمْدُ لِلّٰهِ الَّذِيْ أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِيْنَ',
    'Alhamdulillahil ladzi ath''amana wa saqaana wa ja''alana muslimiin',
    'Segala puji bagi Allah yang telah memberi kami makan dan minum',
    cat_harian, 'HR. Abu Dawud & Tirmidzi', 6, true),

    ('Doa Berpakaian', 'دعاء لبس الثوب',
    'اَلْحَمْدُ لِلّٰهِ الَّذِيْ كَسَانِيْ هٰذَا وَرَزَقَنِيْهِ مِنْ غَيْرِ حَوْلٍ مِنِّيْ وَلَا قُوَّةٍ',
    'Alhamdulillahil ladzi kasaanii haadza wa razaqaniihi min ghairi haulin minnii wa laa quwwah',
    'Segala puji bagi Allah yang telah memberiku pakaian ini tanpa daya dan kekuatan dariku',
    cat_harian, 'HR. Abu Dawud & Tirmidzi', 7, true),

    ('Doa Keluar Rumah', 'دعاء الخروج من المنزل',
    'بِسْمِ اللّٰهِ تَوَكَّلْتُ عَلَى اللّٰهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ',
    'Bismillahi tawakkaltu ''alallahi wa laa haula wa laa quwwata illa billah',
    'Dengan nama Allah aku bertawakkal kepada Allah, tidak ada daya dan kekuatan kecuali dengan Allah',
    cat_harian, 'HR. Abu Dawud & Tirmidzi', 8, true),

    ('Doa Masuk Rumah', 'دعاء دخول المنزل',
    'بِسْمِ اللّٰهِ وَلَجْنَا، وَبِسْمِ اللّٰهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا',
    'Bismillahi walajnaa, wa bismillahi kharajnaa, wa ''alaa rabbinaa tawakkalnaa',
    'Dengan nama Allah kami masuk, dengan nama Allah kami keluar, kepada Allah kami bertawakkal',
    cat_harian, 'HR. Abu Dawud', 9, true),

    ('Doa Bercermin', 'دعاء النظر في المرآة',
    'اللّٰهُمَّ أَنْتَ حَسَّنْتَ خَلْقِيْ فَحَسِّنْ خُلُقِيْ',
    'Allaahumma anta hassanta khalqii fahassin khuluqii',
    'Ya Allah, Engkau telah membaguskan ciptaanku maka baguskanlah akhlakku',
    cat_harian, 'HR. Ahmad', 10, true)

    ON CONFLICT (title) DO NOTHING;

    -- Doa Perjalanan
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Naik Kendaraan', 'دعاء ركوب الدابة',
    'سُبْحَانَ الَّذِيْ سَخَّرَ لَنَا هٰذَا وَمَا كُنَّا لَهُ مُقْرِنِيْنَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُوْنَ',
    'Subhaanal ladzi sakhkhara lana haadza wa ma kunna lahu muqriniin, wa inna ilaa rabbina lamunqalibuun',
    'Maha Suci Allah yang telah menundukkan ini untuk kami',
    cat_perjalanan, 'QS. Az-Zukhruf: 13-14', 1, true),
    
    ('Doa Berangkat Bepergian', 'دعاء السفر',
    'اللّٰهُمَّ إِنَّا نَسْأَلُكَ فِيْ سَفَرِنَا هٰذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى',
    'Allaahumma inna nas''aluka fii safarinaa haadzal birra wat taqwa, wa minal ''amali maa tardhaa',
    'Ya Allah, kami memohon kebaikan dan ketakwaan dalam perjalanan ini',
    cat_perjalanan, 'HR. Muslim', 2, true),
    
    ('Doa Sampai di Tujuan', 'دعاء الوصول',
    'اللّٰهُمَّ رَبَّ السَّمٰوَاتِ السَّبْعِ وَمَا أَظَلَّتْ، وَرَبَّ الْأَرَضِيْنَ وَمَا أَقَلَّتْ، أَسْأَلُكَ خَيْرَ هٰذِهِ الْقَرْيَةِ وَخَيْرَ أَهْلِهَا',
    'Allaahumma rabbas samaawaatis sab''i wa maa adhallat, wa rabbal aradhiina wa maa aqallat, as''aluka khaira haadzihil qaryati wa khaira ahlihaa',
    'Ya Allah, Tuhan langit yang tujuh, aku memohon kebaikan negeri ini',
    cat_perjalanan, 'HR. Ibnu Hibban', 3, true),

    ('Doa Pulang dari Perjalanan', 'دعاء العودة من السفر',
    'آيِبُوْنَ تَائِبُوْنَ عَابِدُوْنَ لِرَبِّنَا حَامِدُوْنَ',
    'Aayibuuna taa''ibuuna ''aabiduuna lirabbinaa haamiduun',
    'Kami kembali, bertaubat, beribadah, dan memuji Tuhan kami',
    cat_perjalanan, 'HR. Bukhari & Muslim', 4, true)

    ON CONFLICT (title) DO NOTHING;

    -- Doa Umroh
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Niat Umroh', 'نية العمرة',
    'لَبَّيْكَ اللّٰهُمَّ عُمْرَةً',
    'Labbaikallahumma ''umratan',
    'Aku memenuhi panggilan-Mu ya Allah untuk umroh',
    cat_umroh, 'Hadits Shahih', 1, true),
    
    ('Talbiyah', 'التلبية',
    'لَبَّيْكَ اللّٰهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيْكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيْكَ لَكَ',
    'Labbaikallahumma labbaik, labbaika laa syariika laka labbaik, innal hamda wan ni''mata laka wal mulk, laa syariika lak',
    'Aku memenuhi panggilan-Mu ya Allah, tidak ada sekutu bagi-Mu',
    cat_umroh, 'HR. Bukhari & Muslim', 2, true),
    
    ('Doa Melihat Ka''bah', 'دعاء رؤية الكعبة',
    'اللّٰهُمَّ زِدْ هٰذَا الْبَيْتَ تَشْرِيْفًا وَتَعْظِيْمًا وَتَكْرِيْمًا وَمَهَابَةً',
    'Allaahumma zid haadzal baita tasyriifan wa ta''dhiiman wa takriiman wa mahaabatan',
    'Ya Allah, tambahkanlah kemuliaan dan keagungan rumah ini',
    cat_umroh, 'HR. Baihaqi', 3, true),
    
    ('Doa Tawaf', 'دعاء الطواف',
    'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    'Rabbana aatina fid dunya hasanatan wa fil aakhirati hasanatan wa qinaa ''adzaaban naar',
    'Ya Tuhan kami, berikanlah kami kebaikan di dunia dan akhirat',
    cat_umroh, 'QS. Al-Baqarah: 201', 4, true),
    
    ('Doa Sa''i di Safa', 'دعاء الصفا',
    'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللّٰهِ، أَبْدَأُ بِمَا بَدَأَ اللّٰهُ بِهِ',
    'Innas shafa wal marwata min sya''aa''irillah, abda''u bima bada''allahu bih',
    'Sesungguhnya Safa dan Marwah adalah sebagian syi''ar Allah',
    cat_umroh, 'HR. Muslim', 5, true),
    
    ('Doa Minum Air Zamzam', 'دعاء شرب ماء زمزم',
    'اللّٰهُمَّ إِنِّيْ أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ',
    'Allaahumma innii as''aluka ''ilman naafi''an wa rizqan waasi''an wa syifaa''an min kulli daa''',
    'Ya Allah, aku memohon ilmu yang bermanfaat, rezeki yang luas, dan kesembuhan',
    cat_umroh, 'HR. Daruquthni', 6, true)

    ON CONFLICT (title) DO NOTHING;

    -- Doa di Masjid
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Masuk Masjid', 'دعاء دخول المسجد',
    'اللّٰهُمَّ افْتَحْ لِيْ أَبْوَابَ رَحْمَتِكَ',
    'Allaahummaf tahlii abwaaba rahmatik',
    'Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu',
    cat_masjid, 'HR. Muslim', 1, true),
    
    ('Doa Keluar Masjid', 'دعاء الخروج من المسجد',
    'اللّٰهُمَّ إِنِّيْ أَسْأَلُكَ مِنْ فَضْلِكَ',
    'Allaahumma innii as''aluka min fadhlika',
    'Ya Allah, sesungguhnya aku memohon karunia-Mu',
    cat_masjid, 'HR. Muslim', 2, true),
    
    ('Doa Masuk Masjid Nabawi', 'دعاء دخول المسجد النبوي',
    'بِسْمِ اللّٰهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُوْلِ اللّٰهِ، اللّٰهُمَّ اغْفِرْ لِيْ ذُنُوْبِيْ وَافْتَحْ لِيْ أَبْوَابَ رَحْمَتِكَ',
    'Bismillahi was shalaatu was salaamu ''alaa rasuulillah, allaahummagh firlii dzunuubii waftah lii abwaaba rahmatik',
    'Dengan nama Allah, shalawat dan salam atas Rasulullah',
    cat_masjid, 'HR. Muslim', 3, true)

    ON CONFLICT (title) DO NOTHING;

    -- Doa Perlindungan
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Mohon Perlindungan', 'دعاء الاستعاذة',
    'أَعُوْذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    'A''uudzu bikalimaatillaahit taammaati min syarri maa khalaq',
    'Aku berlindung dengan kalimat-kalimat Allah dari kejahatan makhluk-Nya',
    cat_perlindungan, 'HR. Muslim', 1, true),
    
    ('Doa Pagi Hari', 'دعاء الصباح',
    'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلّٰهِ، وَالْحَمْدُ لِلّٰهِ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ',
    'Ashbahnaa wa ashbahal mulku lillah, wal hamdu lillah, laa ilaaha illallaahu wahdahu laa syariikalah',
    'Kami memasuki pagi dan kerajaan menjadi milik Allah',
    cat_perlindungan, 'HR. Abu Dawud', 2, true),
    
    ('Doa Sore Hari', 'دعاء المساء',
    'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلّٰهِ، وَالْحَمْدُ لِلّٰهِ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ',
    'Amsainaa wa amsal mulku lillah, wal hamdu lillah, laa ilaaha illallaahu wahdahu laa syariikalah',
    'Kami memasuki sore dan kerajaan menjadi milik Allah',
    cat_perlindungan, 'HR. Abu Dawud', 3, true)

    ON CONFLICT (title) DO NOTHING;

    -- Doa Kesehatan
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Mohon Kesehatan', 'دعاء طلب الصحة',
    'اللّٰهُمَّ عَافِنِيْ فِيْ بَدَنِيْ، اللّٰهُمَّ عَافِنِيْ فِيْ سَمْعِيْ، اللّٰهُمَّ عَافِنِيْ فِيْ بَصَرِيْ',
    'Allaahumma ''aafini fii badanii, allaahumma ''aafini fii sam''ii, allaahumma ''aafini fii bashari',
    'Ya Allah, sehatkanlah badanku, pendengaranku, dan penglihatanku',
    cat_kesehatan, 'HR. Abu Dawud', 1, true),
    
    ('Doa untuk Orang Sakit', 'دعاء للمريض',
    'اللّٰهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اِشْفِ أَنْتَ الشَّافِيْ، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا',
    'Allaahumma rabban naas, adzhibil ba''s, isyfi antas syaafii, laa syifaa''a illa syifaa''uka, syifaa''an laa yughaadiru saqaman',
    'Ya Allah, hilangkanlah penyakit, sembuhkanlah karena Engkau Maha Penyembuh',
    cat_kesehatan, 'HR. Bukhari & Muslim', 2, true)

    ON CONFLICT (title) DO NOTHING;

    -- Doa Makan & Minum (tambahan baru)
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Sebelum Minum', 'دعاء قبل الشرب',
    'بِسْمِ اللّٰهِ',
    'Bismillah',
    'Dengan nama Allah',
    cat_makan, 'HR. Bukhari', 1, true),
    
    ('Doa Sesudah Minum', 'دعاء بعد الشرب',
    'اَلْحَمْدُ لِلّٰهِ',
    'Alhamdulillah',
    'Segala puji bagi Allah',
    cat_makan, 'HR. Tirmidzi', 2, true),

    ('Doa Lupa Membaca Bismillah Saat Makan', 'دعاء نسيان البسملة',
    'بِسْمِ اللّٰهِ أَوَّلَهُ وَآخِرَهُ',
    'Bismillahi awwalahu wa aakhirahu',
    'Dengan nama Allah pada awalnya dan akhirnya',
    cat_makan, 'HR. Abu Dawud & Tirmidzi', 3, true),

    ('Doa Makan di Rumah Orang', 'دعاء الأكل عند الغير',
    'اللّٰهُمَّ بَارِكْ لَهُمْ فِيْمَا رَزَقْتَهُمْ وَاغْفِرْ لَهُمْ وَارْحَمْهُمْ',
    'Allaahumma baarik lahum fiima razaqtahum waghfir lahum warhamhum',
    'Ya Allah, berkahilah mereka dalam rezeki yang Engkau berikan, ampunilah dan rahmatilah mereka',
    cat_makan, 'HR. Muslim', 4, true)

    ON CONFLICT (title) DO NOTHING;

    -- Doa Tidur (tambahan baru)
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Hendak Tidur (lengkap)', 'دعاء النوم الكامل',
    'بِاسْمِكَ اللّٰهُمَّ أَمُوْتُ وَأَحْيَا',
    'Bismikallaahumma amuutu wa ahyaa',
    'Dengan nama-Mu ya Allah aku mati dan aku hidup',
    cat_tidur, 'HR. Bukhari', 1, true),

    ('Doa Bangun Tidur (lengkap)', 'دعاء الاستيقاظ الكامل',
    'اَلْحَمْدُ لِلّٰهِ الَّذِيْ أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُوْرُ',
    'Alhamdulillahil ladzi ahyana ba''da ma amaatana wa ilaihin nusyuur',
    'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami',
    cat_tidur, 'HR. Bukhari', 2, true),

    ('Doa Susah Tidur', 'دعاء عند الأرق',
    'اللّٰهُمَّ غَارَتِ النُّجُوْمُ وَهَدَأَتِ الْعُيُوْنُ وَأَنْتَ حَيٌّ قَيُّوْمٌ، يَا حَيُّ يَا قَيُّوْمُ أَنِمْ عَيْنِيْ وَأَهْدِئْ لَيْلِيْ',
    'Allaahumma ghaaratinnujuum wa hada''atil ''uyuun wa anta hayyun qayyuum, yaa hayyu yaa qayyuum anim ''ainii wa ahdi'' lailii',
    'Ya Allah, bintang-bintang telah tenggelam dan mata-mata telah tenang, dan Engkau Maha Hidup lagi Maha Berdiri, tenangilah mataku dan tentramkan malamku',
    cat_tidur, 'Hadits', 3, true),

    ('Doa Mimpi Buruk', 'دعاء الكابوس',
    'أَعُوْذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ غَضَبِهِ وَعِقَابِهِ وَشَرِّ عِبَادِهِ',
    'A''uudzu bikalimaatillaahit taammaati min ghadhabihi wa ''iqaabihi wa syarri ''ibaadihi',
    'Aku berlindung dengan kalimat-kalimat Allah dari kemarahan-Nya, siksa-Nya, dan kejahatan hamba-Nya',
    cat_tidur, 'HR. Abu Dawud', 4, true)

    ON CONFLICT (title) DO NOTHING;

END $$;


-- ========================================
-- 7. HAJI CHECKLISTS
-- ========================================
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


-- ========================================
-- 8. EXERCISE TYPES (Jenis Olahraga)
-- ========================================
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


-- ========================================
-- 9. IBADAH HABITS (Habit Ibadah)
-- ========================================
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


-- ========================================
-- 10. DZIKIR TYPES (Jenis Dzikir)
-- ========================================
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


-- ========================================
-- 11. PLATFORM SETTINGS
-- ========================================
INSERT INTO platform_settings (key, value, description) VALUES
('featured_price_per_day', '{"amount": 50000}', 'Harga kredit per hari untuk featured package'),
('min_featured_duration', '{"days": 7}', 'Minimal durasi featured package'),
('max_featured_duration', '{"days": 30}', 'Maksimal durasi featured package'),
('platform_fee_percentage', '{"percentage": 5}', 'Persentase fee platform dari setiap booking'),
('currency_rates', '{"SAR_to_IDR": 4200}', 'Kurs mata uang Saudi Riyal ke Rupiah'),
('premium_trial_config', '{"enabled": true, "durationDays": 30}', 'Konfigurasi free trial premium 30 hari'),
('premium_plan_config', '{"name": "Premium Ibadah Tracker", "description": "Akses penuh fitur cloud & statistik", "priceYearly": 29000, "features": ["Sync data ke cloud", "Backup otomatis", "Akses multi-device", "Statistik lengkap", "Export data"]}', 'Konfigurasi paket premium')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- ========================================
-- 12. WEBSITE TEMPLATES
-- ========================================
INSERT INTO website_templates (name, slug, description, thumbnail_url, is_premium, is_active) VALUES
('Default Theme', 'default', 'Tampilan standar yang bersih dan profesional.', '/placeholder.svg', false, true),
('Gold Luxury', 'gold-luxury', 'Desain mewah dengan nuansa emas.', '/placeholder.svg', true, true)
ON CONFLICT (slug) DO NOTHING;


-- ========================================
-- 13. SUBSCRIPTION PLANS
-- ========================================
INSERT INTO subscription_plans (name, description, price_yearly, features, is_active) VALUES
('Premium Ibadah Tracker', 'Akses penuh fitur cloud & statistik', 29000, ARRAY['Sync data ke cloud', 'Backup otomatis', 'Akses multi-device', 'Statistik lengkap', 'Export data'], true)
ON CONFLICT (name) DO NOTHING;


-- ========================================
-- SELESAI!
-- Script ini aman dijalankan berulang kali.
-- Data yang sudah ada tidak akan duplikat.
-- Data baru yang belum ada akan ditambahkan.
-- ========================================
