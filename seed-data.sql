-- ========================================
-- ARAH UMROH SEED DATA
-- Jalankan di Supabase SQL Editor
-- ========================================

-- ========================================
-- 1. MANASIK GUIDES (Panduan Umroh)
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
'Talbiyah adalah ucapan yang dibaca terus-menerus sejak berniat ihram hingga memulai tawaf. Menunjukkan ketaatan penuh kepada Allah.',
'1. Baca talbiyah dengan suara keras (untuk laki-laki)
2. Baca talbiyah dengan suara pelan (untuk perempuan)
3. Terus-menerus dibaca selama perjalanan
4. Dihentikan saat memulai tawaf

Tips:
- Hafalkan bacaan talbiyah sebelum berangkat
- Bacalah dengan penuh penghayatan dan kekhusyukan',
'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيْكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيْكَ لَكَ',
'Labbaikallahumma labbaik, labbaika laa syariika laka labbaik, innal hamda wan ni''mata laka wal mulk, laa syariika lak',
'Aku memenuhi panggilan-Mu ya Allah, aku memenuhi panggilan-Mu. Aku memenuhi panggilan-Mu, tidak ada sekutu bagi-Mu, aku memenuhi panggilan-Mu. Sesungguhnya segala puji, nikmat, dan kerajaan adalah milik-Mu, tidak ada sekutu bagi-Mu.',
true),

('Tawaf', 'الطَّوَاف', 'umroh', 3,
'Tawaf adalah mengelilingi Ka''bah sebanyak 7 kali putaran berlawanan arah jarum jam. Dimulai dan diakhiri di garis Hajar Aswad.',
'1. Masuk Masjidil Haram dengan kaki kanan sambil berdoa
2. Menghadap Hajar Aswad, angkat tangan kanan dan ucapkan "Bismillahi Allahu Akbar"
3. Laki-laki melakukan Idhtiba'' (membuka bahu kanan) saat tawaf qudum
4. Mulai tawaf dari garis Hajar Aswad berlawanan jarum jam
5. Laki-laki melakukan Raml (jalan cepat) pada 3 putaran pertama
6. Berdoa bebas atau zikir selama tawaf
7. Di Rukun Yamani, usap dengan tangan kanan jika memungkinkan
8. Selesaikan 7 putaran penuh

Tips:
- Hindari mendorong jamaah lain saat menuju Hajar Aswad
- Jaga wudhu selama tawaf
- Boleh istirahat jika lelah, tapi jangan duduk di area tawaf',
'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
'Bismillahi wallahu akbar',
'Dengan nama Allah, dan Allah Maha Besar',
true),

('Shalat Sunnah Tawaf', 'صلاة سنة الطواف', 'umroh', 4,
'Setelah menyelesaikan 7 putaran tawaf, disunnahkan melaksanakan shalat 2 rakaat di belakang Maqam Ibrahim atau di tempat lain dalam Masjidil Haram.',
'1. Menuju Maqam Ibrahim setelah tawaf
2. Baca doa mendekati Maqam Ibrahim
3. Shalat 2 rakaat (rakaat 1 baca Al-Kafirun, rakaat 2 baca Al-Ikhlas)
4. Jika penuh, boleh shalat di tempat lain dalam masjid
5. Minum air zamzam dan berdoa

Tips:
- Tidak wajib tepat di belakang Maqam Ibrahim
- Berdoa dengan khusyuk setelah shalat
- Minum air zamzam sebanyak-banyaknya',
'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى',
'Wattakhidzu min maqami Ibrahima mushalla',
'Dan jadikanlah sebagian maqam Ibrahim sebagai tempat shalat',
true),

('Sa''i', 'السَّعْي', 'umroh', 5,
'Sa''i adalah berjalan dari bukit Safa ke Marwah sebanyak 7 kali perjalanan. Mengenang perjuangan Siti Hajar mencari air untuk Nabi Ismail.',
'1. Menuju bukit Safa setelah shalat tawaf
2. Naik ke bukit Safa, menghadap Ka''bah, angkat tangan dan berdoa
3. Berjalan menuju Marwah (hitungan 1)
4. Laki-laki berlari kecil di area lampu hijau
5. Naik ke Marwah, menghadap Ka''bah, berdoa
6. Kembali ke Safa (hitungan 2)
7. Ulangi hingga 7 kali, berakhir di Marwah
8. Berdoa bebas selama perjalanan

Tips:
- Boleh menggunakan kursi roda jika tidak mampu berjalan
- Tidak disyaratkan dalam keadaan suci dari hadats
- Perbanyak doa untuk diri sendiri dan keluarga',
'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
'Innas shafa wal marwata min sya''airillah',
'Sesungguhnya Safa dan Marwah adalah sebagian dari syi''ar Allah',
true),

('Tahallul', 'التَّحَلُّل', 'umroh', 6,
'Tahallul adalah mencukur atau memotong rambut sebagai tanda selesainya ibadah umroh. Setelah tahallul, jamaah terbebas dari larangan ihram.',
'1. Setelah selesai sa''i di Marwah
2. Laki-laki: mencukur habis (lebih utama) atau memotong minimal 3 helai
3. Perempuan: memotong ujung rambut sepanjang satu ruas jari
4. Setelah tahallul, semua larangan ihram gugur
5. Boleh kembali memakai pakaian biasa

Tips:
- Tersedia jasa cukur di sekitar Marwah
- Siapkan gunting kecil jika ingin memotong sendiri
- Perempuan tidak boleh mencukur habis, cukup memotong ujung',
'اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ وَالْمُقَصِّرِينَ',
'Allahummaghfir lil muhalliqina wal muqashshirina',
'Ya Allah, ampunilah orang-orang yang mencukur dan yang memotong rambutnya',
true);


-- ========================================
-- 2. IMPORTANT LOCATIONS (Lokasi Penting)
-- ========================================
INSERT INTO important_locations (name, name_arabic, category, city, latitude, longitude, description, address, is_active, priority) VALUES
-- Makkah
('Masjidil Haram', 'المسجد الحرام', 'masjid', 'Makkah', 21.4225, 39.8262, 'Masjid suci tempat Ka''bah berada. Pusat ibadah umroh dan haji.', 'Makkah, Arab Saudi', true, 1),
('Ka''bah', 'الكعبة', 'landmark', 'Makkah', 21.4225, 39.8262, 'Rumah Allah yang menjadi kiblat umat Islam sedunia.', 'Di dalam Masjidil Haram', true, 2),
('Safa & Marwah', 'الصفا والمروة', 'landmark', 'Makkah', 21.4234, 39.8269, 'Dua bukit tempat Sa''i dilakukan, sekarang berada dalam Masjidil Haram.', 'Di dalam Masjidil Haram', true, 3),
('Maqam Ibrahim', 'مقام إبراهيم', 'landmark', 'Makkah', 21.4225, 39.8264, 'Batu tempat Nabi Ibrahim berdiri saat membangun Ka''bah.', 'Di dalam Masjidil Haram', true, 4),
('Hajar Aswad', 'الحجر الأسود', 'landmark', 'Makkah', 21.4224, 39.8263, 'Batu hitam dari surga, titik awal dan akhir tawaf.', 'Di sudut Ka''bah', true, 5),
('Sumur Zamzam', 'بئر زمزم', 'landmark', 'Makkah', 21.4226, 39.8265, 'Sumber air suci yang muncul untuk Hajar dan Ismail.', 'Basement Masjidil Haram', true, 6),

-- Miqat
('Miqat Yalamlam', 'يلملم', 'miqat', 'Makkah', 20.5519, 39.8503, 'Miqat untuk jamaah dari arah Yemen dan Indonesia (via laut).', 'Selatan Makkah', true, 10),
('Miqat Juhfah (Rabigh)', 'الجحفة', 'miqat', 'Makkah', 22.7208, 39.0917, 'Miqat untuk jamaah dari arah Mesir, Syam, dan Maghribi.', 'Barat Laut Makkah', true, 11),
('Miqat Bir Ali (Dzulhulaifah)', 'ذو الحليفة', 'miqat', 'Madinah', 24.4136, 39.5436, 'Miqat untuk jamaah dari Madinah. Miqat terjauh dari Makkah.', 'Selatan Madinah', true, 12),
('Miqat Qarn al-Manazil', 'قرن المنازل', 'miqat', 'Makkah', 21.6167, 40.4167, 'Miqat untuk jamaah dari arah Najd dan negara-negara Teluk.', 'Timur Makkah', true, 13),

-- Madinah
('Masjid Nabawi', 'المسجد النبوي', 'masjid', 'Madinah', 24.4672, 39.6112, 'Masjid Nabi Muhammad SAW. Sholat di sini bernilai 1000x lipat.', 'Madinah, Arab Saudi', true, 20),
('Raudhah', 'الروضة', 'landmark', 'Madinah', 24.4673, 39.6113, 'Taman surga antara mimbar dan makam Nabi SAW.', 'Di dalam Masjid Nabawi', true, 21),
('Makam Rasulullah', 'قبر الرسول', 'ziarah', 'Madinah', 24.4673, 39.6114, 'Makam Nabi Muhammad SAW, Abu Bakar, dan Umar bin Khattab.', 'Di dalam Masjid Nabawi', true, 22),
('Pemakaman Baqi', 'البقيع', 'ziarah', 'Madinah', 24.4678, 39.6147, 'Pemakaman para sahabat dan keluarga Nabi SAW.', 'Sebelah timur Masjid Nabawi', true, 23),
('Masjid Quba', 'مسجد قباء', 'masjid', 'Madinah', 24.4397, 39.6172, 'Masjid pertama dalam Islam. Sholat di sini = pahala umroh.', 'Selatan Madinah', true, 24),
('Masjid Qiblatain', 'مسجد القبلتين', 'masjid', 'Madinah', 24.4803, 39.5917, 'Masjid tempat turunnya perintah perubahan kiblat.', 'Barat Laut Madinah', true, 25),
('Jabal Uhud', 'جبل أحد', 'ziarah', 'Madinah', 24.5011, 39.6156, 'Gunung tempat Perang Uhud. Nabi bersabda: "Uhud mencintai kita."', 'Utara Madinah', true, 26),
('Makam Syuhada Uhud', 'شهداء أحد', 'ziarah', 'Madinah', 24.4989, 39.6128, 'Tempat peristirahatan 70 syuhada Uhud termasuk Hamzah.', 'Dekat Jabal Uhud', true, 27);


-- ========================================
-- 3. CHECKLISTS (Checklist Persiapan)
-- ========================================
INSERT INTO checklists (title, description, category, phase, priority, icon, is_active) VALUES
-- H-30: Persiapan Awal
('Cek Masa Berlaku Paspor', 'Pastikan paspor masih berlaku minimal 6 bulan dari tanggal keberangkatan', 'dokumen', 'H-30', 1, 'file-text', true),
('Daftar Vaksinasi Meningitis', 'Lakukan vaksinasi meningitis di klinik kesehatan yang ditunjuk', 'kesehatan', 'H-30', 2, 'syringe', true),
('Siapkan Foto untuk Visa', 'Foto berwarna ukuran 4x6 dengan latar belakang putih', 'dokumen', 'H-30', 3, 'camera', true),
('Mulai Latihan Jalan Kaki', 'Latihan stamina dengan jalan kaki 2-3 km setiap hari', 'kesehatan', 'H-30', 4, 'footprints', true),
('Pelajari Tata Cara Umroh', 'Mulai mempelajari bacaan dan gerakan manasik umroh', 'ibadah', 'H-30', 5, 'book-open', true),

-- H-7: Persiapan Akhir
('Siapkan Koper dan Perlengkapan', 'Pack pakaian ihram, mukena, sajadah, dan perlengkapan pribadi', 'perlengkapan', 'H-7', 1, 'luggage', true),
('Siapkan Obat-obatan Pribadi', 'Bawa obat rutin, vitamin, dan P3K dasar', 'kesehatan', 'H-7', 2, 'pill', true),
('Fotokopi Dokumen Penting', 'Fotokopi paspor, visa, tiket, dan simpan terpisah dari aslinya', 'dokumen', 'H-7', 3, 'copy', true),
('Konfirmasi Jadwal Keberangkatan', 'Hubungi travel untuk konfirmasi jadwal dan meeting point', 'persiapan', 'H-7', 4, 'phone', true),
('Hafalkan Doa-doa Manasik', 'Pastikan sudah hafal doa tawaf, sai, dan doa-doa penting lainnya', 'ibadah', 'H-7', 5, 'book-heart', true),
('Tukar Mata Uang', 'Tukar rupiah ke Riyal Saudi secukupnya', 'persiapan', 'H-7', 6, 'banknote', true),

-- H-1: Hari Terakhir
('Cek Ulang Semua Dokumen', 'Pastikan paspor, visa, tiket, dan dokumen penting ada di tas kabin', 'dokumen', 'H-1', 1, 'clipboard-check', true),
('Sholat Istikharah', 'Lakukan sholat istikharah dan minta restu keluarga', 'ibadah', 'H-1', 2, 'heart', true),
('Charge Semua Device', 'Pastikan HP, powerbank, dan device lain terisi penuh', 'persiapan', 'H-1', 3, 'battery-charging', true),
('Siapkan Pakaian Ihram', 'Taruh pakaian ihram di tempat yang mudah dijangkau', 'perlengkapan', 'H-1', 4, 'shirt', true),
('Berangkat ke Bandara', 'Datang 3 jam sebelum jadwal keberangkatan', 'persiapan', 'H-1', 5, 'plane', true);


-- ========================================
-- 4. PACKING TEMPLATES (Template Packing List)
-- ========================================
INSERT INTO packing_templates (name, category, gender, description, is_essential, priority, quantity_suggestion, is_active) VALUES
-- Pakaian
('Kain Ihram (2 lembar)', 'pakaian', 'male', 'Kain putih tanpa jahitan untuk ihram', true, 1, 2, true),
('Mukena', 'pakaian', 'female', 'Mukena untuk sholat', true, 1, 2, true),
('Pakaian Harian', 'pakaian', 'both', 'Pakaian ganti sehari-hari', true, 2, 5, true),
('Pakaian Dalam', 'pakaian', 'both', 'Celana dalam dan kaos dalam', true, 3, 7, true),
('Sandal Jepit', 'pakaian', 'both', 'Sandal untuk berjalan', true, 4, 1, true),
('Sepatu Nyaman', 'pakaian', 'both', 'Sepatu yang nyaman untuk jalan jauh', false, 5, 1, true),
('Kaos Kaki', 'pakaian', 'both', 'Untuk pelindung kaki', false, 6, 5, true),
('Jaket Tipis', 'pakaian', 'both', 'Untuk ruangan ber-AC', false, 7, 1, true),

-- Dokumen
('Paspor', 'dokumen', 'both', 'Paspor asli dengan masa berlaku min. 6 bulan', true, 1, 1, true),
('Visa Umroh', 'dokumen', 'both', 'Visa yang sudah disetujui', true, 2, 1, true),
('Tiket Pesawat', 'dokumen', 'both', 'E-ticket atau tiket fisik', true, 3, 1, true),
('Fotokopi Paspor', 'dokumen', 'both', 'Simpan terpisah dari aslinya', true, 4, 2, true),
('Pas Foto', 'dokumen', 'both', 'Foto 4x6 background putih', false, 5, 4, true),
('Kartu Identitas Grup', 'dokumen', 'both', 'ID card dari travel', false, 6, 1, true),

-- Kesehatan
('Obat Pribadi', 'kesehatan', 'both', 'Obat rutin yang dikonsumsi', true, 1, 1, true),
('Vitamin', 'kesehatan', 'both', 'Vitamin C, multivitamin', false, 2, 1, true),
('Obat Flu & Batuk', 'kesehatan', 'both', 'Antisipasi perubahan cuaca', false, 3, 1, true),
('Obat Maag', 'kesehatan', 'both', 'Untuk gangguan pencernaan', false, 4, 1, true),
('Plester Luka', 'kesehatan', 'both', 'Untuk lecet kaki', false, 5, 1, true),
('Hand Sanitizer', 'kesehatan', 'both', 'Pembersih tangan', false, 6, 1, true),
('Masker', 'kesehatan', 'both', 'Masker kesehatan', false, 7, 10, true),

-- Ibadah
('Al-Quran Mini', 'ibadah', 'both', 'Mushaf kecil untuk dibawa', true, 1, 1, true),
('Buku Doa Umroh', 'ibadah', 'both', 'Panduan doa-doa manasik', true, 2, 1, true),
('Sajadah Lipat', 'ibadah', 'both', 'Sajadah travel', false, 3, 1, true),
('Tasbih', 'ibadah', 'both', 'Untuk dzikir', false, 4, 1, true),

-- Perlengkapan
('Tas Kabin', 'perlengkapan', 'both', 'Tas kecil untuk dokumen dan barang penting', true, 1, 1, true),
('Koper', 'perlengkapan', 'both', 'Koper utama untuk pakaian', true, 2, 1, true),
('Tas Sandang', 'perlengkapan', 'both', 'Tas kecil untuk saat ibadah', false, 3, 1, true),
('Powerbank', 'perlengkapan', 'both', 'Untuk charge HP', false, 4, 1, true),
('Charger HP', 'perlengkapan', 'both', 'Charger dan kabel', true, 5, 1, true),
('Adaptor Listrik', 'perlengkapan', 'both', 'Adaptor colokan Saudi type G', false, 6, 1, true),
('Botol Minum', 'perlengkapan', 'both', 'Untuk air zamzam', false, 7, 1, true),
('Payung Lipat', 'perlengkapan', 'both', 'Pelindung panas matahari', false, 8, 1, true),

-- Toiletries
('Sabun Mandi', 'toiletries', 'both', 'Sabun tanpa pewangi (untuk ihram)', true, 1, 1, true),
('Shampoo', 'toiletries', 'both', 'Shampoo tanpa pewangi', true, 2, 1, true),
('Sikat Gigi & Pasta', 'toiletries', 'both', 'Perlengkapan sikat gigi', true, 3, 1, true),
('Handuk Kecil', 'toiletries', 'both', 'Handuk travel', false, 4, 1, true),
('Sunblock', 'toiletries', 'both', 'Pelindung kulit dari matahari', false, 5, 1, true),
('Lip Balm', 'toiletries', 'both', 'Pelembab bibir', false, 6, 1, true);


-- ========================================
-- 5. PRAYER CATEGORIES (Kategori Doa)
-- ========================================
INSERT INTO prayer_categories (name, name_arabic, description, icon, priority, is_active) VALUES
('Doa Harian', 'أدعية يومية', 'Doa-doa sehari-hari yang sering dibaca', 'sun', 1, true),
('Doa Perjalanan', 'أدعية السفر', 'Doa saat bepergian dan dalam perjalanan', 'plane', 2, true),
('Doa Umroh', 'أدعية العمرة', 'Doa khusus saat melaksanakan ibadah umroh', 'kaaba', 3, true),
('Doa di Masjid', 'أدعية المسجد', 'Doa saat masuk dan keluar masjid', 'mosque', 4, true),
('Doa Perlindungan', 'أدعية الحماية', 'Doa memohon perlindungan Allah', 'shield', 5, true),
('Doa Kesehatan', 'أدعية الصحة', 'Doa untuk kesehatan dan kesembuhan', 'heart-pulse', 6, true);


-- ========================================
-- 6. PRAYERS (Doa-Doa)
-- ========================================
-- Note: category_id will be set after prayer_categories are inserted
-- Run this after the categories are created

-- Get category IDs first, then insert prayers
DO $$
DECLARE
    cat_harian UUID;
    cat_perjalanan UUID;
    cat_umroh UUID;
    cat_masjid UUID;
    cat_perlindungan UUID;
    cat_kesehatan UUID;
BEGIN
    SELECT id INTO cat_harian FROM prayer_categories WHERE name = 'Doa Harian';
    SELECT id INTO cat_perjalanan FROM prayer_categories WHERE name = 'Doa Perjalanan';
    SELECT id INTO cat_umroh FROM prayer_categories WHERE name = 'Doa Umroh';
    SELECT id INTO cat_masjid FROM prayer_categories WHERE name = 'Doa di Masjid';
    SELECT id INTO cat_perlindungan FROM prayer_categories WHERE name = 'Doa Perlindungan';
    SELECT id INTO cat_kesehatan FROM prayer_categories WHERE name = 'Doa Kesehatan';

    -- Doa Harian
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Bangun Tidur', 'دعاء الاستيقاظ من النوم', 
    'اَلْحَمْدُ لِلّٰهِ الَّذِيْ أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُوْرُ',
    'Alhamdulillahil ladzi ahyana ba''da ma amaatana wa ilaihin nusyuur',
    'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan kepada-Nya kami akan dikembalikan',
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
    'Segala puji bagi Allah yang telah memberi kami makan dan minum serta menjadikan kami muslim',
    cat_harian, 'HR. Abu Dawud & Tirmidzi', 6, true);

    -- Doa Perjalanan
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Naik Kendaraan', 'دعاء ركوب الدابة',
    'سُبْحَانَ الَّذِيْ سَخَّرَ لَنَا هٰذَا وَمَا كُنَّا لَهُ مُقْرِنِيْنَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُوْنَ',
    'Subhaanal ladzi sakhkhara lana haadza wa ma kunna lahu muqriniin, wa inna ilaa rabbina lamunqalibuun',
    'Maha Suci Allah yang telah menundukkan ini untuk kami, padahal sebelumnya kami tidak mampu menguasainya, dan sesungguhnya kepada Tuhan kami pasti kami akan kembali',
    cat_perjalanan, 'QS. Az-Zukhruf: 13-14', 1, true),
    
    ('Doa Berangkat Bepergian', 'دعاء السفر',
    'اللّٰهُمَّ إِنَّا نَسْأَلُكَ فِيْ سَفَرِنَا هٰذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى',
    'Allaahumma inna nas''aluka fii safarinaa haadzal birra wat taqwa, wa minal ''amali maa tardhaa',
    'Ya Allah, kami memohon kepada-Mu dalam perjalanan kami ini kebaikan dan ketakwaan, dan amal yang Engkau ridhai',
    cat_perjalanan, 'HR. Muslim', 2, true),
    
    ('Doa Sampai di Tujuan', 'دعاء الوصول',
    'اللّٰهُمَّ رَبَّ السَّمٰوَاتِ السَّبْعِ وَمَا أَظَلَّتْ، وَرَبَّ الْأَرَضِيْنَ وَمَا أَقَلَّتْ، أَسْأَلُكَ خَيْرَ هٰذِهِ الْقَرْيَةِ وَخَيْرَ أَهْلِهَا',
    'Allaahumma rabbas samaawaatis sab''i wa maa adhallat, wa rabbal aradhiina wa maa aqallat, as''aluka khaira haadzihil qaryati wa khaira ahlihaa',
    'Ya Allah, Tuhan langit yang tujuh dan apa yang dinaunginya, Tuhan bumi dan apa yang dikandungnya, aku memohon kebaikan negeri ini dan kebaikan penduduknya',
    cat_perjalanan, 'HR. Ibnu Hibban', 3, true);

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
    'Aku memenuhi panggilan-Mu ya Allah. Aku memenuhi panggilan-Mu, tidak ada sekutu bagi-Mu. Segala puji, nikmat, dan kerajaan adalah milik-Mu, tidak ada sekutu bagi-Mu',
    cat_umroh, 'HR. Bukhari & Muslim', 2, true),
    
    ('Doa Melihat Ka''bah', 'دعاء رؤية الكعبة',
    'اللّٰهُمَّ زِدْ هٰذَا الْبَيْتَ تَشْرِيْفًا وَتَعْظِيْمًا وَتَكْرِيْمًا وَمَهَابَةً، وَزِدْ مَنْ شَرَّفَهُ وَكَرَّمَهُ مِمَّنْ حَجَّهُ أَوِ اعْتَمَرَهُ تَشْرِيْفًا وَتَكْرِيْمًا وَتَعْظِيْمًا وَبِرًّا',
    'Allaahumma zid haadzal baita tasyriifan wa ta''dhiiman wa takriiman wa mahaabatan, wa zid man syarrafahu wa karramahu mimman hajjahu awi''tamarahu tasyriifan wa takriiman wa ta''dhiiman wa birraa',
    'Ya Allah, tambahkanlah kemuliaan, keagungan, kehormatan, dan kewibawaan rumah ini. Dan tambahkanlah kemuliaan, kehormatan, keagungan, dan kebaikan bagi orang yang memuliakan dan menghormatinya, baik yang berhaji maupun berumroh',
    cat_umroh, 'HR. Baihaqi', 3, true),
    
    ('Doa Tawaf', 'دعاء الطواف',
    'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    'Rabbana aatina fid dunya hasanatan wa fil aakhirati hasanatan wa qinaa ''adzaaban naar',
    'Ya Tuhan kami, berikanlah kami kebaikan di dunia dan kebaikan di akhirat, serta lindungilah kami dari siksa api neraka',
    cat_umroh, 'QS. Al-Baqarah: 201', 4, true),
    
    ('Doa Sa''i di Safa', 'دعاء الصفا',
    'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللّٰهِ، أَبْدَأُ بِمَا بَدَأَ اللّٰهُ بِهِ',
    'Innas shafa wal marwata min sya''aa''irillah, abda''u bima bada''allahu bih',
    'Sesungguhnya Safa dan Marwah adalah sebagian syi''ar Allah. Aku mulai dengan apa yang Allah mulai dengannya',
    cat_umroh, 'HR. Muslim', 5, true),
    
    ('Doa Minum Air Zamzam', 'دعاء شرب ماء زمزم',
    'اللّٰهُمَّ إِنِّيْ أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ',
    'Allaahumma innii as''aluka ''ilman naafi''an wa rizqan waasi''an wa syifaa''an min kulli daa''',
    'Ya Allah, aku memohon kepada-Mu ilmu yang bermanfaat, rezeki yang luas, dan kesembuhan dari segala penyakit',
    cat_umroh, 'HR. Daruquthni', 6, true);

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
    'Dengan nama Allah, shalawat dan salam atas Rasulullah. Ya Allah ampunilah dosaku dan bukakanlah untukku pintu-pintu rahmat-Mu',
    cat_masjid, 'HR. Muslim', 3, true);

    -- Doa Perlindungan
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Mohon Perlindungan', 'دعاء الاستعاذة',
    'أَعُوْذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    'A''uudzu bikalimaatillaahit taammaati min syarri maa khalaq',
    'Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan makhluk-Nya',
    cat_perlindungan, 'HR. Muslim', 1, true),
    
    ('Doa Pagi Hari', 'دعاء الصباح',
    'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلّٰهِ، وَالْحَمْدُ لِلّٰهِ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ',
    'Ashbahnaa wa ashbahal mulku lillah, wal hamdu lillah, laa ilaaha illallaahu wahdahu laa syariikalah',
    'Kami memasuki pagi dan kerajaan menjadi milik Allah. Segala puji bagi Allah. Tiada Tuhan selain Allah yang Esa, tiada sekutu bagi-Nya',
    cat_perlindungan, 'HR. Abu Dawud', 2, true),
    
    ('Doa Sore Hari', 'دعاء المساء',
    'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلّٰهِ، وَالْحَمْدُ لِلّٰهِ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ',
    'Amsainaa wa amsal mulku lillah, wal hamdu lillah, laa ilaaha illallaahu wahdahu laa syariikalah',
    'Kami memasuki sore dan kerajaan menjadi milik Allah. Segala puji bagi Allah. Tiada Tuhan selain Allah yang Esa, tiada sekutu bagi-Nya',
    cat_perlindungan, 'HR. Abu Dawud', 3, true);

    -- Doa Kesehatan
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Mohon Kesehatan', 'دعاء طلب الصحة',
    'اللّٰهُمَّ عَافِنِيْ فِيْ بَدَنِيْ، اللّٰهُمَّ عَافِنِيْ فِيْ سَمْعِيْ، اللّٰهُمَّ عَافِنِيْ فِيْ بَصَرِيْ',
    'Allaahumma ''aafini fii badanii, allaahumma ''aafini fii sam''ii, allaahumma ''aafini fii bashari',
    'Ya Allah, sehatkanlah badanku. Ya Allah, sehatkanlah pendengaranku. Ya Allah, sehatkanlah penglihatanku',
    cat_kesehatan, 'HR. Abu Dawud', 1, true),
    
    ('Doa untuk Orang Sakit', 'دعاء للمريض',
    'اللّٰهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اِشْفِ أَنْتَ الشَّافِيْ، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا',
    'Allaahumma rabban naas, adzhibil ba''s, isyfi antas syaafii, laa syifaa''a illa syifaa''uka, syifaa''an laa yughaadiru saqaman',
    'Ya Allah Tuhan manusia, hilangkanlah penyakitnya, sembuhkanlah. Engkau Maha Penyembuh, tidak ada kesembuhan kecuali kesembuhan dari-Mu, kesembuhan yang tidak menyisakan penyakit',
    cat_kesehatan, 'HR. Bukhari & Muslim', 2, true);

END $$;


-- ========================================
-- 7. HAJI CHECKLISTS (Checklist Haji)
-- ========================================
INSERT INTO haji_checklists (title, description, category, is_required, priority, applies_to, is_active) VALUES
('NIK dan KK', 'Nomor Induk Kependudukan dan Kartu Keluarga asli', 'dokumen', true, 1, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Akta Kelahiran', 'Akta kelahiran asli atau surat kenal lahir', 'dokumen', true, 2, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Buku Nikah/Akta Cerai', 'Untuk yang sudah menikah/bercerai', 'dokumen', false, 3, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Paspor', 'Paspor dengan masa berlaku minimal 6 bulan', 'dokumen', true, 4, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Pas Foto', 'Foto 4x6 background putih, 80% wajah', 'dokumen', true, 5, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Surat Keterangan Sehat', 'Dari dokter/Puskesmas', 'kesehatan', true, 6, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Vaksinasi Meningitis', 'Kartu bukti vaksinasi', 'kesehatan', true, 7, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Setoran Awal BPIH', 'Bukti setoran awal Rp 25 juta', 'pembayaran', true, 8, ARRAY['haji_reguler'], true),
('Pelunasan BPIH', 'Bukti pelunasan biaya haji', 'pembayaran', true, 9, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true);


-- ========================================
-- 8. PLATFORM SETTINGS (Pengaturan Platform)
-- ========================================
INSERT INTO platform_settings (key, value, description) VALUES
('featured_price_per_day', '{"amount": 50000}', 'Harga kredit per hari untuk featured package'),
('min_featured_duration', '{"days": 7}', 'Minimal durasi featured package'),
('max_featured_duration', '{"days": 30}', 'Maksimal durasi featured package'),
('platform_fee_percentage', '{"percentage": 5}', 'Persentase fee platform dari setiap booking'),
('currency_rates', '{"SAR_to_IDR": 4200}', 'Kurs mata uang Saudi Riyal ke Rupiah')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- ========================================
-- SELESAI!
-- ========================================
-- Data telah siap digunakan.
-- Pastikan tabel-tabel sudah ada sebelum menjalankan script ini.
