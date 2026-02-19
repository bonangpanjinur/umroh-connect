-- ==========================================
-- COMPLETE DOA (PRAYERS) DATABASE SQL
-- Tabel: prayer_categories & prayers
-- Jalankan di SQL Editor
-- ==========================================

-- 1. Buat Tabel prayer_categories
CREATE TABLE IF NOT EXISTS public.prayer_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_arabic TEXT,
    description TEXT,
    icon TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.prayer_categories ENABLE ROW LEVEL SECURITY;

-- Pastikan policy dihapus dulu jika sudah ada untuk menghindari error 42710
DROP POLICY IF EXISTS "Anyone can view active prayer categories" ON public.prayer_categories;
CREATE POLICY "Anyone can view active prayer categories"
ON public.prayer_categories FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage prayer categories" ON public.prayer_categories;
CREATE POLICY "Admins can manage prayer categories"
ON public.prayer_categories FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 2. Buat Tabel prayers
CREATE TABLE IF NOT EXISTS public.prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.prayer_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    title_arabic TEXT,
    arabic_text TEXT NOT NULL,
    transliteration TEXT,
    translation TEXT,
    source TEXT,
    benefits TEXT,
    audio_url TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active prayers" ON public.prayers;
CREATE POLICY "Anyone can view active prayers"
ON public.prayers FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage prayers" ON public.prayers;
CREATE POLICY "Admins can manage prayers"
ON public.prayers FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 3. Storage bucket untuk audio doa
INSERT INTO storage.buckets (id, name, public)
VALUES ('prayer-audio', 'prayer-audio', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Trigger updated_at
DROP TRIGGER IF EXISTS update_prayer_categories_updated_at ON public.prayer_categories;
CREATE TRIGGER update_prayer_categories_updated_at
    BEFORE UPDATE ON public.prayer_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_prayers_updated_at ON public.prayers;
CREATE TRIGGER update_prayers_updated_at
    BEFORE UPDATE ON public.prayers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- DATA: 14 KATEGORI DOA
-- ==========================================

INSERT INTO public.prayer_categories (id, name, name_arabic, icon, priority, is_active) VALUES
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Umroh', 'أدعية العمرة', 'kaaba', 1, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Harian', 'أدعية يومية', 'sun', 2, true),
('afbf6510-9033-4b7b-b3cd-560f95d954bd', 'Doa Perjalanan', 'أدعية السفر', 'plane', 3, true),
('ac22f67c-bfe7-47dd-87c3-7f96574b7692', 'Dzikir', 'الأذكار', 'sparkles', 4, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000001', 'Doa Shalat', 'أدعية الصلاة', 'book-open', 5, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000002', 'Doa Makan & Minum', 'أدعية الطعام والشراب', 'utensils', 6, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000003', 'Doa Tidur & Bangun', 'أدعية النوم والاستيقاظ', 'moon', 7, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000004', 'Doa Perlindungan', 'أدعية الحماية', 'shield', 8, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000005', 'Doa Kesehatan', 'أدعية الصحة', 'heart', 9, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000006', 'Doa Rezeki & Keluarga', 'أدعية الرزق والأسرة', 'home', 10, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000007', 'Doa Haji', 'أدعية الحج', 'flag', 11, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000008', 'Doa Cuaca & Alam', 'أدعية الطقس', 'cloud', 12, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000009', 'Doa Berpakaian & Bercermin', 'أدعية اللباس', 'shirt', 13, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000010', 'Doa Masjid', 'أدعية المسجد', 'landmark', 14, true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- DATA: 92 DOA LENGKAP
-- ==========================================

-- === KATEGORI: DOA UMROH ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Niat Ihram Umroh', 'نية الإحرام للعمرة', 'لَبَّيْكَ اللَّهُمَّ عُمْرَةً', 'Labbaika Allahumma ''umratan', 'Aku penuhi panggilan-Mu ya Allah untuk melaksanakan umroh', 'HR. Bukhari & Muslim', 'Niat awal ibadah umroh, menandai dimulainya ihram', 1, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Talbiyah', 'التلبية', 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لاَ شَرِيْكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لاَ شَرِيْكَ لَكَ', 'Labbaika Allahumma labbaik, labbaika laa syarika laka labbaik, innal hamda wan ni''mata laka wal mulk, laa syarika lak', 'Aku penuhi panggilan-Mu ya Allah, aku penuhi. Aku penuhi panggilan-Mu yang tiada sekutu bagi-Mu. Sesungguhnya segala puji, nikmat, dan kerajaan milik-Mu. Tiada sekutu bagi-Mu', 'HR. Bukhari & Muslim', 'Dzikir utama saat berihram, diucapkan berulang-ulang', 2, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Melihat Ka''bah', 'دعاء رؤية الكعبة', 'اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيْفًا وَتَعْظِيْمًا وَتَكْرِيْمًا وَمَهَابَةً، وَزِدْ مَنْ شَرَّفَهُ وَكَرَّمَهُ مِمَّنْ حَجَّهُ أَوِ اعْتَمَرَهُ تَشْرِيْفًا وَتَكْرِيْمًا وَتَكْرِيْمًا وَتَعْظِيْمًا وَبِرًّا', 'Allahumma zid hadal baita tasyrifan wa ta''zhiman wa takriman wa mahabah, wa zid man syarrafahu wa karramahu mimman hajjahu awi''tamarahu tasyrifan wa takriman wa ta''zhiman wa birra', 'Ya Allah, tambahkanlah kemuliaan, keagungan, kehormatan, dan kewibawaan bagi rumah ini. Dan tambahkanlah kemuliaan, kehormatan, keagungan dan kebaikan bagi orang yang memuliakan dan menghormatinya dari orang yang berhaji atau berumroh', 'HR. Baihaqi', 'Doa saat pertama kali melihat Ka''bah, saat mustajab', 3, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa di Hajar Aswad', 'دعاء عند الحجر الأسود', 'بِسْمِ اللهِ وَاللهُ أَكْبَرُ، اللَّهُمَّ إِيْمَانًا بِكَ وَتَصْدِيْقًا بِكِتَابِكَ وَوَفَاءً بِعَهْدِكَ وَاتِّبَاعًا لِسُنَّةِ نَبِيِّكَ مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ', 'Bismillahi wallahu akbar. Allahumma imanan bika wa tashdiqan bikitabika wa wafa-an bi''ahdika wattiba''an lisunnati nabiyyika Muhammadin shallallahu ''alaihi wasallam', 'Dengan nama Allah, Allah Maha Besar. Ya Allah, dengan iman kepada-Mu, membenarkan kitab-Mu, memenuhi janji-Mu, dan mengikuti sunnah Nabi-Mu Muhammad SAW', 'Riwayat Ibnu Umar', 'Dibaca saat memulai tawaf dari Hajar Aswad', 4, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Tawaf (Antara Rukun Yamani & Hajar Aswad)', 'دعاء بين الركن اليماني والحجر الأسود', 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', 'Rabbana atina fid dunya hasanatan wa fil akhirati hasanatan wa qina ''adzaban nar', 'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari azab api neraka', 'QS. Al-Baqarah: 201', 'Doa yang dibaca antara Rukun Yamani dan Hajar Aswad saat tawaf', 5, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Setelah Shalat di Maqam Ibrahim', 'دعاء setelah صلاة المقام', 'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى', 'Wattakhidzu min maqami ibrahima mushalla', 'Dan jadikanlah Maqam Ibrahim sebagai tempat shalat', 'QS. Al-Baqarah: 125', 'Shalat 2 rakaat setelah tawaf di belakang Maqam Ibrahim', 6, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa di Bukit Shafa', 'دعاء على الصفا', 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللهِ، أَبْدَأُ بِمَا بَدَأَ اللهُ بِهِ', 'Innash shafa wal marwata min sya''airillah, abda-u bima bada-allahu bih', 'Sesungguhnya Shafa dan Marwah termasuk syiar-syiar Allah. Aku mulai dengan apa yang Allah mulai', 'HR. Muslim', 'Dibaca saat memulai sa''i di Bukit Shafa', 7, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Sa''i', 'دعاء السعي', 'رَبِّ اغْفِرْ وَارْحَمْ وَاهْدِنِي السَّبِيلَ الْأَقْوَمَ', 'Rabbighfir warham wahdinissabilal aqwam', 'Ya Tuhanku, ampunilah aku, rahmatilah aku, dan tunjukkanlah aku jalan yang paling lurus', 'HR. Tirmidzi', 'Dibaca selama perjalanan sa''i antara Shafa dan Marwah', 8, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Minum Air Zamzam', 'دعاء شرب زمزم', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ', 'Allahumma inni as-aluka ''ilman nafi''an wa rizqan wasi''an wa syifa-an min kulli da''in', 'Ya Allah, aku memohon kepada-Mu ilmu yang bermanfaat, rezeki yang luas, dan kesembuhan dari segala penyakit', 'HR. Daruquthni', 'Air zamzam sesuai niat peminumnya', 9, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Multazam', 'دعاء الملتزم', 'اللَّهُمَّ يَا رَبَّ الْبَيْتِ الْعَتِيْقِ أَعْتِقْ رِقَابَنَا وَرِقَابَ آبَائِنَا وَأُمَّهَاتِنَا وَإِخْوَانِنَا وَأَوْلاَدِنَا مِنَ النَّارِ يَا ذَا الْجُوْدِ وَالْكَرَمِ وَالْفَضْلِ وَالْمَنِّ وَالْعَطَاءِ وَالْإِحْسَانِ', 'Allahumma ya rabbal baytil ''atiqi, a''tiq riqabana wa riqaba aba-ina wa ummahatina wa ikhwanina wa awladina minan nar, ya dzal judi wal karami wal fadhli wal manni wal ''atha-i wal ihsan', 'Ya Allah, Tuhan pemilik Baitullah, bebaskanlah diri kami, bapak-bapak kami, ibu-ibu kami, saudara-saudara kami, dan anak-anak kami dari api neraka. Wahai Dzat yang memiliki kemurahan, kemuliaan, keutamaan, anugerah, pemberian dan kebaikan', 'Riwayat Ibnu Abbas', 'Berdoa di Multazam (antara Hajar Aswad dan pintu Ka''bah) sangat mustajab', 10, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DOA HARIAN ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Bangun Tidur', 'دعاء الاستيقاظ', 'الْحَمْدُ لِلَّهِ الَّذِيْ أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُوْرُ', 'Alhamdulillahilladzi ahyana ba''da ma amatana wa ilaihin nusyur', 'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan kepada-Nya kami dibangkitkan', 'HR. Bukhari', 'Bersyukur atas nikmat hidup setiap pagi', 1, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Sebelum Makan', 'دعاء قبل الأكل', 'بِسْمِ اللهِ وَعَلَى بَرَكَةِ اللهِ', 'Bismillahi wa ''ala barakatillah', 'Dengan nama Allah dan atas berkah Allah', 'HR. Abu Dawud', 'Mendapat berkah dalam makanan', 2, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Sesudah Makan', 'دعاء بعد الأكل', 'الْحَمْدُ لِلَّهِ الَّذِيْ أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِيْنَ', 'Alhamdulillahilladzi ath''amana wa saqana wa ja''alana muslimin', 'Segala puji bagi Allah yang telah memberi kami makan dan minum serta menjadikan kami muslim', 'HR. Abu Dawud & Tirmidzi', 'Bersyukur atas rezeki makanan', 3, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Keluar Rumah', 'دعاء الخروج من المنزل', 'بِسْمِ اللهِ تَوَكَّلْتُ عَلَى اللهِ وَلاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللهِ', 'Bismillahi tawakkaltu ''alallahi wa laa haula wa laa quwwata illa billah', 'Dengan nama Allah, aku bertawakal kepada Allah. Tiada daya dan kekuatan kecuali dengan Allah', 'HR. Abu Dawud & Tirmidzi', 'Dilindungi, dicukupi, dan dijauhi setan', 4, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Masuk Rumah', 'دعاء دخول المنزل', 'بِسْمِ اللهِ وَلَجْنَا وَبِسْمِ اللهِ خَرَجْنَا وَعَلَى رَبِّنَا تَوَكَّلْنَا', 'Bismillahi walajna wa bismillahi kharajna wa ''ala rabbina tawakkalna', 'Dengan nama Allah kami masuk, dengan nama Allah kami keluar, dan kepada Tuhan kami bertawakal', 'HR. Abu Dawud', 'Rumah diberkahi dan setan tidak bisa masuk', 5, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Masuk Kamar Mandi', 'دعاء دخول الخلاء', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ', 'Allahumma inni a''udzu bika minal khubutsi wal khaba-its', 'Ya Allah, aku berlindung kepada-Mu dari setan laki-laki dan setan perempuan', 'HR. Bukhari & Muslim', 'Perlindungan dari gangguan jin di kamar mandi', 6, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Keluar Kamar Mandi', 'دعاء الخروج من الخلاء', 'غُفْرَانَكَ', 'Ghufranaka', 'Aku mohon ampunan-Mu', 'HR. Abu Dawud & Tirmidzi', 'Memohon ampunan setelah dari kamar mandi', 7, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Sebelum Wudhu', 'دعاء قبل الوضوء', 'بِسْمِ اللهِ', 'Bismillah', 'Dengan nama Allah', 'HR. Abu Dawud', 'Memberkahi wudhu', 8, true)
ON CONFLICT DO NOTHING;
