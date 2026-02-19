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
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Melihat Ka''bah', 'دعاء رؤية الكعبة', 'اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيْفًا وَتَعْظِيْمًا وَتَكْرِيْمًا وَمَهَابَةً، وَزِدْ مَنْ شَرَّفَهُ وَكَرَّمَهُ مِمَّنْ حَجَّهُ أَوِ اعْتَمَرَهُ تَشْرِيْفًا وَتَكْرِيْمًا وَتَعْظِيْمًا وَبِرًّا', 'Allahumma zid hadal baita tasyrifan wa ta''zhiman wa takriman wa mahabah, wa zid man syarrafahu wa karramahu mimman hajjahu awi''tamarahu tasyrifan wa takriman wa ta''zhiman wa birra', 'Ya Allah, tambahkanlah kemuliaan, keagungan, kehormatan, dan kewibawaan bagi rumah ini. Dan tambahkanlah kemuliaan, kehormatan, keagungan dan kebaikan bagi orang yang memuliakan dan menghormatinya dari orang yang berhaji atau berumroh', 'HR. Baihaqi', 'Doa saat pertama kali melihat Ka''bah, saat mustajab', 3, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa di Hajar Aswad', 'دعاء عند الحجر الأسود', 'بِسْمِ اللهِ وَاللهُ أَكْبَرُ، اللَّهُمَّ إِيْمَانًا بِكَ وَتَصْدِيْقًا بِكِتَابِكَ وَوَفَاءً بِعَهْدِكَ وَاتِّبَاعًا لِسُنَّةِ نَبِيِّكَ مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ', 'Bismillahi wallahu akbar. Allahumma imanan bika wa tashdiqan bikitabika wa wafa-an bi''ahdika wattiba''an lisunnati nabiyyika Muhammadin shallallahu ''alaihi wasallam', 'Dengan nama Allah, Allah Maha Besar. Ya Allah, dengan iman kepada-Mu, membenarkan kitab-Mu, memenuhi janji-Mu, dan mengikuti sunnah Nabi-Mu Muhammad SAW', 'Riwayat Ibnu Umar', 'Dibaca saat memulai tawaf dari Hajar Aswad', 4, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Tawaf (Antara Rukun Yamani & Hajar Aswad)', 'دعاء بين الركن اليماني والحجر الأسود', 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', 'Rabbana atina fid dunya hasanatan wa fil akhirati hasanatan wa qina ''adzaban nar', 'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari azab api neraka', 'QS. Al-Baqarah: 201', 'Doa yang dibaca antara Rukun Yamani dan Hajar Aswad saat tawaf', 5, true),
('d5e18198-82f8-4787-9ec3-1b6455da5faf', 'Doa Setelah Shalat di Maqam Ibrahim', 'دعاء بعد صلاة المقام', 'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى', 'Wattakhidzu min maqami ibrahima mushalla', 'Dan jadikanlah Maqam Ibrahim sebagai tempat shalat', 'QS. Al-Baqarah: 125', 'Shalat 2 rakaat setelah tawaf di belakang Maqam Ibrahim', 6, true),
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
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Sebelum Wudhu', 'دعاء قبل الوضوء', 'بِسْمِ اللهِ', 'Bismillah', 'Dengan nama Allah', 'HR. Abu Dawud', 'Memberkahi wudhu', 8, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Sesudah Wudhu', 'دعاء بعد الوضوء', 'أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ، اللَّهُمَّ اجْعَلْنِيْ مِنَ التَّوَّابِيْنَ وَاجْعَلْنِيْ مِنَ الْمُتَطَهِّرِيْنَ', 'Asyhadu an laa ilaha illallahu wahdahu laa syarika lahu wa asyhadu anna Muhammadan ''abduhu wa rasuluh. Allahummaj''alni minat tawwabin waj''alni minal mutathahhirin', 'Aku bersaksi tiada tuhan selain Allah semata, tiada sekutu bagi-Nya, dan aku bersaksi bahwa Muhammad adalah hamba dan rasul-Nya. Ya Allah, jadikanlah aku dari golongan orang yang bertaubat dan orang yang bersuci', 'HR. Muslim & Tirmidzi', 'Dibukakan 8 pintu surga', 9, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Pagi Hari', 'دعاء الصباح', 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ', 'Ashbahna wa ashbahal mulku lillah walhamdulillah laa ilaha illallahu wahdahu laa syarika lah', 'Kami memasuki waktu pagi dan kerajaan milik Allah. Segala puji bagi Allah, tiada tuhan selain Allah semata, tiada sekutu bagi-Nya', 'HR. Muslim', 'Perlindungan di pagi hari', 10, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Doa Sore Hari', 'دعاء المساء', 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ', 'Amsayna wa amsal mulku lillah walhamdulillah laa ilaha illallahu wahdahu laa syarika lah', 'Kami memasuki waktu sore dan kerajaan milik Allah. Segala puji bagi Allah, tiada tuhan selain Allah semata, tiada sekutu bagi-Nya', 'HR. Muslim', 'Perlindungan di sore hari', 11, true),
('ab72349f-ce77-4d72-a11a-0ae7825eee1a', 'Sayyidul Istighfar', 'سيد الاستغفار', 'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ', 'Allahumma anta rabbi laa ilaha illa anta khalaqtani wa ana ''abduka wa ana ''ala ''ahdika wa wa''dika mas tatha''tu, a''udzu bika min syarri ma shana''tu, abu-u laka bini''matika ''alayya wa abu-u bidzanbi faghfirli fa innahu laa yaghfirudz dzunuba illa anta', 'Ya Allah, Engkau Tuhanku, tiada tuhan selain Engkau, Engkau menciptakan aku dan aku hamba-Mu, aku di atas perjanjian dan janji-Mu semampuku, aku berlindung dari keburukan yang kuperbuat, aku akui nikmat-Mu dan aku akui dosaku, maka ampunilah aku karena tidak ada yang mengampuni dosa selain Engkau', 'HR. Bukhari', 'Penghulu istighfar, jika dibaca pagi lalu meninggal masuk surga', 12, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DOA PERJALANAN ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('afbf6510-9033-4b7b-b3cd-560f95d954bd', 'Doa Naik Kendaraan', 'دعاء ركوب الدابة', 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ', 'Subhanalladzi sakhkhara lana hadza wa ma kunna lahu muqrinin wa inna ila rabbina lamunqalibun', 'Maha Suci Dzat yang menundukkan ini untuk kami, padahal kami tidak mampu menguasainya. Dan sesungguhnya kami akan kembali kepada Tuhan kami', 'QS. Az-Zukhruf: 13-14', 'Keselamatan dalam perjalanan', 1, true),
('afbf6510-9033-4b7b-b3cd-560f95d954bd', 'Doa Bepergian', 'دعاء السفر', 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ', 'Allahumma inna nas-aluka fi safarina hadzal birra wat taqwa wa minal ''amali ma tardha. Allahumma hawwin ''alaina safarana hadza wathwi ''anna bu''dah', 'Ya Allah, kami memohon dalam perjalanan ini kebaikan, ketakwaan, dan amal yang Engkau ridhai. Ya Allah, mudahkanlah perjalanan ini dan dekatkanlah jaraknya', 'HR. Muslim', 'Doa keselamatan dan kemudahan perjalanan', 2, true),
('afbf6510-9033-4b7b-b3cd-560f95d954bd', 'Doa Sampai Tujuan', 'دعاء الوصول', 'أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', 'A''udzu bikalimatillahit tammati min syarri ma khalaq', 'Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan makhluk-Nya', 'HR. Muslim', 'Perlindungan di tempat baru yang dikunjungi', 3, true),
('afbf6510-9033-4b7b-b3cd-560f95d954bd', 'Doa Masuk Kota/Negeri', 'دعاء دخول البلد', 'اللَّهُمَّ رَبَّ السَّمَاوَاتِ السَّبْعِ وَمَا أَظْلَلْنَ وَرَبَّ الْأَرَضِينَ السَّبْعِ وَمَا أَقْلَلْنَ أَسْأَلُكَ خَيْرَ هَذِهِ الْقَرْيَةِ وَخَيْرَ أَهْلِهَا', 'Allahumma rabbas samawatis sab''i wa ma azhlalna wa rabbal aradhinas sab''i wa ma aqlalna, as-aluka khaira hadzihi al-qaryati wa khaira ahliha', 'Ya Allah, Tuhan tujuh langit dan apa yang dinaunginya, Tuhan tujuh bumi dan apa yang dipikulnya, aku memohon kebaikan kota ini dan kebaikan penduduknya', 'HR. Hakim & Ibnu Hibban', 'Memohon kebaikan tempat yang dikunjungi', 4, true),
('afbf6510-9033-4b7b-b3cd-560f95d954bd', 'Doa Naik Pesawat', 'دعاء ركوب الطائرة', 'بِسْمِ اللهِ مَجْرَاهَا وَمُرْسَاهَا إِنَّ رَبِّي لَغَفُورٌ رَحِيمٌ', 'Bismillahi majraha wa mursaha inna rabbi laghafurun rahim', 'Dengan nama Allah saat berlayar dan berlabuh. Sesungguhnya Tuhanku Maha Pengampun lagi Maha Penyayang', 'QS. Hud: 41', 'Keselamatan perjalanan udara', 5, true),
('afbf6510-9033-4b7b-b3cd-560f95d954bd', 'Doa Pulang dari Safar', 'دعاء الرجوع من السفر', 'آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ', 'Ayibuna ta-ibuna ''abiduna lirabbina hamidun', 'Kami kembali, bertaubat, beribadah, dan memuji Tuhan kami', 'HR. Bukhari & Muslim', 'Mensyukuri kepulangan yang selamat', 6, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DZIKIR ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('ac22f67c-bfe7-47dd-87c3-7f96574b7692', 'Tasbih', 'التسبيح', 'سُبْحَانَ اللهِ', 'Subhanallah', 'Maha Suci Allah', 'HR. Muslim', 'Dibaca 33x setelah shalat, menghapus dosa', 1, true),
('ac22f67c-bfe7-47dd-87c3-7f96574b7692', 'Tahmid', 'التحميد', 'الْحَمْدُ لِلَّهِ', 'Alhamdulillah', 'Segala puji bagi Allah', 'HR. Muslim', 'Dibaca 33x setelah shalat, memenuhi timbangan', 2, true),
('ac22f67c-bfe7-47dd-87c3-7f96574b7692', 'Takbir', 'التكبير', 'اللهُ أَكْبَرُ', 'Allahu Akbar', 'Allah Maha Besar', 'HR. Muslim', 'Dibaca 33x setelah shalat, mengagungkan Allah', 3, true),
('ac22f67c-bfe7-47dd-87c3-7f96574b7692', 'Tahlil', 'التهليل', 'لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيْرٌ', 'Laa ilaha illallahu wahdahu laa syarika lah, lahul mulku wa lahul hamdu wa huwa ''ala kulli syai-in qadir', 'Tiada tuhan selain Allah semata, tiada sekutu bagi-Nya, milik-Nya kerajaan dan pujian, Dia Maha Kuasa atas segala sesuatu', 'HR. Bukhari & Muslim', 'Dibaca 1x setelah tasbih-tahmid-takbir, penyempurna dzikir setelah shalat', 4, true),
('ac22f67c-bfe7-47dd-87c3-7f96574b7692', 'Hauqalah', 'الحوقلة', 'لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللهِ', 'Laa haula wa laa quwwata illa billah', 'Tiada daya dan kekuatan kecuali dari Allah', 'HR. Bukhari & Muslim', 'Kunci harta surga', 5, true),
('ac22f67c-bfe7-47dd-87c3-7f96574b7692', 'Istighfar', 'الاستغفار', 'أَسْتَغْفِرُ اللهَ الْعَظِيمَ', 'Astaghfirullahal ''azhim', 'Aku memohon ampun kepada Allah Yang Maha Agung', 'HR. Muslim', 'Dibaca 3x setelah shalat, menghapus dosa', 6, true),
('ac22f67c-bfe7-47dd-87c3-7f96574b7692', 'Shalawat Nabi', 'الصلاة على النبي', 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ', 'Allahumma shalli ''ala Muhammadin wa ''ala ali Muhammadin kama shallaita ''ala Ibrahima wa ''ala ali Ibrahima innaka hamidum majid', 'Ya Allah, limpahkanlah shalawat kepada Muhammad dan keluarga Muhammad sebagaimana Engkau melimpahkan shalawat kepada Ibrahim dan keluarga Ibrahim, sesungguhnya Engkau Maha Terpuji lagi Maha Mulia', 'HR. Bukhari & Muslim', 'Mendapat 10 shalawat dari Allah untuk setiap 1x membaca', 7, true),
('ac22f67c-bfe7-47dd-87c3-7f96574b7692', 'Dzikir Pagi - Ayat Kursi', 'آية الكرسي', 'اللهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلاَّ بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلاَ يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ', 'Allahu laa ilaha illa huwal hayyul qayyum, laa ta''khudzuhu sinatun wa laa naum, lahu ma fis samawati wa ma fil ardhi, man dzalladzi yasyfa''u ''indahu illa bi-idznih, ya''lamu ma baina aidihim wa ma khalfahum, wa laa yuhituna bisyai-in min ''ilmihi illa bima sya-a, wasi''a kursiyyuhus samawati wal ardh, wa laa ya-uduhu hifzuhuma wa huwal ''aliyyul ''azhim', 'Allah, tiada tuhan selain Dia, Yang Maha Hidup lagi terus-menerus mengurus. Tidak mengantuk dan tidak tidur. Milik-Nya apa yang di langit dan di bumi...', 'QS. Al-Baqarah: 255', 'Dilindungi dari setan sampai pagi/sore, ayat paling agung dalam Al-Quran', 8, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DOA SHALAT ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000001', 'Doa Iftitah', 'دعاء الافتتاح', 'اللهُ أَكْبَرُ كَبِيرًا وَالْحَمْدُ لِلَّهِ كَثِيرًا وَسُبْحَانَ اللهِ بُكْرَةً وَأَصِيلاً', 'Allahu akbaru kabira walhamdulillahi katsira wa subhanallahi bukratan wa ashila', 'Allah Maha Besar dengan sebesar-besarnya, segala puji bagi Allah dengan pujian yang banyak, Maha Suci Allah pagi dan petang', 'HR. Muslim', 'Pembuka shalat yang utama', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000001', 'Doa Ruku', 'دعاء الركوع', 'سُبْحَانَ رَبِّيَ الْعَظِيمِ', 'Subhana rabbiyal ''azhim', 'Maha Suci Tuhanku Yang Maha Agung', 'HR. Muslim', 'Dibaca 3x saat ruku', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000001', 'Doa I''tidal', 'دعاء الاعتدال', 'سَمِعَ اللهُ لِمَنْ حَمِدَهُ، رَبَّنَا وَلَكَ الْحَمْدُ', 'Sami''allahu liman hamidah, rabbana wa lakal hamd', 'Allah mendengar orang yang memuji-Nya. Tuhan kami, bagi-Mu segala pujian', 'HR. Bukhari & Muslim', 'Diucapkan saat bangkit dari ruku', 3, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000001', 'Doa Sujud', 'دعاء السجود', 'سُبْحَانَ رَبِّيَ الْأَعْلَى', 'Subhana rabbiyal a''la', 'Maha Suci Tuhanku Yang Maha Tinggi', 'HR. Muslim', 'Dibaca 3x saat sujud, posisi terdekat dengan Allah', 4, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000001', 'Doa Duduk Antara Dua Sujud', 'دعاء بين السجدتين', 'رَبِّ اغْفِرْ لِي وَارْحَمْنِي وَاجْبُرْنِي وَارْفَعْنِي وَارْزُقْنِي وَاهْدِنِي وَعَافِنِي', 'Rabbighfirli warhamni wajburni warfa''ni warzuqni wahdini wa ''afini', 'Ya Tuhanku, ampunilah aku, rahmatilah aku, cukupkanlah aku, angkatlah derajatku, berilah aku rezeki, tunjukilah aku, dan sehatkan aku', 'HR. Abu Dawud & Tirmidzi', 'Doa komprehensif di antara dua sujud', 5, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000001', 'Doa Qunut', 'دعاء القنوت', 'اللَّهُمَّ اهْدِنِيْ فِيْمَنْ هَدَيْتَ وَعَافِنِيْ فِيْمَنْ عَافَيْتَ وَتَوَلَّنِيْ فِيْمَنْ تَوَلَّيْتَ وَبَارِكْ لِيْ فِيْمَا أَعْطَيْتَ وَقِنِيْ شَرَّ مَا قَضَيْتَ', 'Allahummahdini fiman hadait wa ''afini fiman ''afait wa tawallani fiman tawallait wa barik li fima a''thait wa qini syarra ma qadhait', 'Ya Allah, tunjukilah aku di antara orang yang Engkau tunjuki, sehatkan aku di antara orang yang Engkau sehatkan, peliharalah aku di antara yang Engkau pelihara, berkahilah aku dalam apa yang Engkau berikan, dan lindungilah aku dari keburukan yang Engkau tetapkan', 'HR. Abu Dawud & Tirmidzi', 'Dibaca pada shalat Subuh atau shalat Witir', 6, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000001', 'Doa Setelah Tasyahud Akhir', 'دعاء بعد التشهد', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ جَهَنَّمَ وَمِنْ عَذَابِ الْقَبْرِ وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ وَمِنْ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ', 'Allahumma inni a''udzu bika min ''adzabi jahannam wa min ''adzabil qabri wa min fitnatil mahya wal mamati wa min fitnatil masihid dajjal', 'Ya Allah, aku berlindung dari azab Jahannam, azab kubur, fitnah hidup dan mati, serta fitnah Dajjal', 'HR. Bukhari & Muslim', 'Doa yang diperintahkan Nabi untuk dibaca sebelum salam', 7, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DOA MAKAN & MINUM ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000002', 'Doa Sebelum Makan', 'دعاء قبل الطعام', 'بِسْمِ اللهِ وَعَلَى بَرَكَةِ اللهِ', 'Bismillahi wa ''ala barakatillah', 'Dengan nama Allah dan atas berkah Allah', 'HR. Abu Dawud', 'Makanan diberkahi', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000002', 'Doa Sesudah Makan', 'دعاء بعد الطعام', 'الْحَمْدُ لِلَّهِ الَّذِيْ أَطْعَمَنِيْ هَذَا وَرَزَقَنِيْهِ مِنْ غَيْرِ حَوْلٍ مِنِّيْ وَلاَ قُوَّةٍ', 'Alhamdulillahilladzi ath''amani hadza wa razaqanihi min ghairi haulin minni wa laa quwwah', 'Segala puji bagi Allah yang telah memberi makan ini dan memberiku rezeki tanpa daya dan kekuatan dariku', 'HR. Tirmidzi', 'Diampuni dosa yang telah lalu', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000002', 'Doa Lupa Membaca Bismillah', 'دعاء نسيان البسملة', 'بِسْمِ اللهِ أَوَّلَهُ وَآخِرَهُ', 'Bismillahi awwalahu wa akhirah', 'Dengan nama Allah pada awalnya dan akhirnya', 'HR. Abu Dawud & Tirmidzi', 'Jika lupa baca bismillah di awal makan', 3, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000002', 'Doa Untuk Tuan Rumah', 'دعاء لصاحب الطعام', 'اللَّهُمَّ بَارِكْ لَهُمْ فِيمَا رَزَقْتَهُمْ وَاغْفِرْ لَهُمْ وَارْحَمْهُمْ', 'Allahumma barik lahum fima razaqtahum waghfir lahum warhamhum', 'Ya Allah, berkahilah mereka dalam rezeki yang Engkau berikan, ampunilah mereka, dan rahmatilah mereka', 'HR. Muslim', 'Mendoakan tuan rumah setelah makan', 4, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000002', 'Doa Minum Susu', 'دعاء شرب اللبن', 'اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَزِدْنَا مِنْهُ', 'Allahumma barik lana fihi wa zidna minh', 'Ya Allah, berkahilah kami dalam susu ini dan tambahkanlah untuk kami', 'HR. Tirmidzi', 'Susu adalah satu-satunya yang tidak ada doa gantinya', 5, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DOA TIDUR & BANGUN ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000003', 'Doa Sebelum Tidur', 'دعاء قبل النوم', 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', 'Bismika Allahumma amutu wa ahya', 'Dengan nama-Mu ya Allah aku mati dan hidup', 'HR. Bukhari', 'Perlindungan saat tidur', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000003', 'Doa Bangun Tidur', 'دعاء الاستيقاظ من النوم', 'الْحَمْدُ لِلَّهِ الَّذِيْ أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُوْرُ', 'Alhamdulillahilladzi ahyana ba''da ma amatana wa ilaihin nusyur', 'Segala puji bagi Allah yang menghidupkan kami setelah mematikan kami, dan kepada-Nya kebangkitan', 'HR. Bukhari', 'Mensyukuri nikmat kehidupan', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000003', 'Doa Susah Tidur', 'دعاء الأرق', 'اللَّهُمَّ غَارَتِ النُّجُومُ وَهَدَأَتِ الْعُيُونُ وَأَنْتَ حَيٌّ قَيُّومٌ لاَ تَأْخُذُكَ سِنَةٌ وَلاَ نَوْمٌ يَا حَيُّ يَا قَيُّومُ أَهْدِئْ لَيْلِي وَأَنِمْ عَيْنِي', 'Allahumma gharatin nujumu wa hada-atil ''uyunu wa anta hayyun qayyumun laa ta''khudzuka sinatun wa laa naum, ya hayyu ya qayyumu ahdi'' layli wa anim ''aini', 'Ya Allah, bintang-bintang telah tenggelam, mata-mata telah tenang, Engkau Maha Hidup lagi Maha Mengurus, tidak mengantuk dan tidur. Ya Yang Maha Hidup, Ya Yang Maha Mengurus, tenangkanlah malamku dan tidurkan mataku', 'Riwayat Ibnu Sunni', 'Membantu mengatasi insomnia', 3, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000003', 'Doa Mimpi Buruk', 'دعاء الكابوس', 'أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ غَضَبِهِ وَعِقَابِهِ وَشَرِّ عِبَادِهِ وَمِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَنْ يَحْضُرُونِ', 'A''udzu bikalimatillahit tammati min ghadhabihi wa ''iqabihi wa syarri ''ibadihi wa min hamazatisy syayathin wa an yahdhurun', 'Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari murka-Nya, hukuman-Nya, kejahatan hamba-hamba-Nya, dan dari bisikan setan serta kehadirannya', 'HR. Abu Dawud & Tirmidzi', 'Perlindungan dari mimpi buruk dan gangguan setan', 4, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DOA PERLINDUNGAN ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000004', 'Al-Mu''awwidzatain (Al-Falaq)', 'سورة الفلق', 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ مِنْ شَرِّ مَا خَلَقَ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ', 'Qul a''udzu birabbil falaq, min syarri ma khalaq, wa min syarri ghasiqin idza waqab, wa min syarrin naffatsati fil ''uqad, wa min syarri hasidin idza hasad', 'Katakanlah: Aku berlindung kepada Tuhan yang menguasai subuh, dari kejahatan apa yang Dia ciptakan, dari kejahatan malam apabila telah gelap, dari kejahatan peniup-peniup pada buhul-buhul, dari kejahatan pendengki apabila ia dengki', 'QS. Al-Falaq: 1-5', 'Pelindung dari segala kejahatan, dibaca 3x pagi dan sore', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000004', 'Al-Mu''awwidzatain (An-Nas)', 'سورة الناس', 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ مَلِكِ النَّاسِ إِلَهِ النَّاسِ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ مِنَ الْجِنَّةِ وَالنَّاسِ', 'Qul a''udzu birabbin nas, malikin nas, ilahin nas, min syarril waswasil khannas, alladzi yuwaswisu fi shudurin nas, minal jinnati wan nas', 'Katakanlah: Aku berlindung kepada Tuhan manusia, Raja manusia, Tuhan manusia, dari kejahatan bisikan yang tersembunyi, yang membisik di dada manusia, dari jin dan manusia', 'QS. An-Nas: 1-6', 'Pelindung dari bisikan setan, dibaca 3x pagi dan sore', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000004', 'Doa Perlindungan dari Sihir', 'دعاء الحماية من السحر', 'أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ وَمِنْ كُلِّ عَيْنٍ لاَمَّةٍ', 'A''udzu bikalimatillahit tammati min kulli syaithanin wa hammah wa min kulli ''ainin lammah', 'Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari setiap setan, binatang berbisa, dan dari setiap mata yang jahat', 'HR. Bukhari', 'Nabi membacakan ini untuk Hasan dan Husain', 3, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000004', 'Doa Perlindungan dari Hutang', 'دعاء من الدين', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْبُخْلِ وَالْجُبْنِ وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ', 'Allahumma inni a''udzu bika minal hammi wal hazani wal ''ajzi wal kasali wal bukhli wal jubni wa dhala''id daini wa ghalabatir rijal', 'Ya Allah, aku berlindung dari kegelisahan, kesedihan, kelemahan, kemalasan, kebakhilan, ketakutan, lilitan hutang, dan dominasi orang', 'HR. Bukhari', 'Doa komprehensif Nabi untuk perlindungan dari berbagai keburukan', 4, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000004', 'Doa Perlindungan Diri dan Keluarga', 'دعاء حفظ النفس والأهل', 'بِسْمِ اللهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', 'Bismillahilladzi laa yadhurru ma''asmihi syai-un fil ardhi wa laa fis sama-i wa huwas sami''ul ''alim', 'Dengan nama Allah yang tidak ada sesuatu pun di bumi dan langit yang membahayakan bersama nama-Nya, dan Dia Maha Mendengar lagi Maha Mengetahui', 'HR. Abu Dawud & Tirmidzi', 'Dibaca 3x pagi dan sore, tidak tertimpa bahaya apapun', 5, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DOA KESEHATAN ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000005', 'Doa Menjenguk Orang Sakit', 'دعاء عيادة المريض', 'أَذْهِبِ الْبَأْسَ رَبَّ النَّاسِ وَاشْفِ أَنْتَ الشَّافِي لاَ شِفَاءَ إِلاَّ شِفَاؤُكَ شِفَاءً لاَ يُغَادِرُ سَقَمًا', 'Adzhibil ba''sa rabban nas wasyfi antasy syafi laa syifa-a illa syifa-uka syifa-an laa yughadiru saqama', 'Hilangkanlah penyakit wahai Tuhan manusia, sembuhkanlah, Engkau Maha Penyembuh, tidak ada kesembuhan kecuali dari-Mu, kesembuhan yang tidak meninggalkan penyakit', 'HR. Bukhari & Muslim', 'Doa Nabi untuk menyembuhkan orang sakit', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000005', 'Doa Kesehatan Badan', 'دعاء صحة البدن', 'اللَّهُمَّ عَافِنِي فِي بَدَنِي اللَّهُمَّ عَافِنِي فِي سَمْعِي اللَّهُمَّ عَافِنِي فِي بَصَرِي لاَ إِلَهَ إِلاَّ أَنْتَ', 'Allahumma ''afini fi badani, Allahumma ''afini fi sam''i, Allahumma ''afini fi bashari, laa ilaha illa anta', 'Ya Allah sehatkan tubuhku, sehatkan pendengaranku, sehatkan penglihatanku, tiada tuhan selain Engkau', 'HR. Abu Dawud', 'Dibaca 3x pagi dan sore untuk kesehatan', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000005', 'Doa Saat Sakit', 'دعاء عند المرض', 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ اشْفِنِي أَنْتَ الشَّافِي لاَ شَافِيَ إِلاَّ أَنْتَ شِفَاءً لاَ يُغَادِرُ سَقَمًا', 'Allahumma rabban nas adzhibil ba''sa isyfini antasy syafi laa syafiya illa anta syifa-an laa yughadiru saqama', 'Ya Allah Tuhan manusia, hilangkanlah penyakit, sembuhkan aku, Engkau Maha Penyembuh, tiada yang menyembuhkan kecuali Engkau, dengan kesembuhan yang tidak menyisakan penyakit', 'HR. Bukhari & Muslim', 'Doa untuk diri sendiri saat sakit', 3, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000005', 'Ruqyah Syar''iyyah', 'الرقية الشرعية', 'بِسْمِ اللهِ أَرْقِيكَ مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ اللهُ يَشْفِيكَ بِسْمِ اللهِ أَرْقِيكَ', 'Bismillahi arqika min kulli syai-in yu''dzika min syarri kulli nafsin aw ''aini hasidin Allahu yasyfika bismillahi arqika', 'Dengan nama Allah aku meruqyahmu dari segala yang menyakitimu, dari kejahatan setiap jiwa atau mata pendengki, Allah menyembuhkanmu', 'HR. Muslim', 'Ruqyah yang diajarkan Nabi Muhammad SAW', 4, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DOA REZEKI & KELUARGA ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000006', 'Doa Murah Rezeki', 'دعاء سعة الرزق', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى', 'Allahumma inni as-alukal huda wat tuqa wal ''afafa wal ghina', 'Ya Allah, aku memohon petunjuk, ketakwaan, kehormatan, dan kecukupan', 'HR. Muslim', 'Doa ringkas tapi komprehensif untuk rezeki', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000006', 'Doa untuk Kedua Orang Tua', 'دعاء للوالدين', 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', 'Rabbirhamhuma kama rabbayani shaghira', 'Ya Tuhanku, rahmatilah mereka berdua sebagaimana mereka memeliharaku waktu kecil', 'QS. Al-Isra: 24', 'Berbakti kepada orang tua melalui doa', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000006', 'Doa Keluarga Sakinah', 'دعاء الأسرة السكينة', 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا', 'Rabbana hab lana min azwajina wa dzurriyyatina qurrata a''yunin waj''alna lil muttaqina imama', 'Ya Tuhan kami, karuniakanlah dari pasangan dan keturunan kami penyejuk mata, dan jadikanlah kami imam bagi orang bertakwa', 'QS. Al-Furqan: 74', 'Doa untuk kebahagiaan keluarga', 3, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000006', 'Doa Dijauhkan dari Kemiskinan', 'دعاء من الفقر', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْفَقْرِ وَالْقِلَّةِ وَالذِّلَّةِ وَأَعُوذُ بِكَ مِنْ أَنْ أَظْلِمَ أَوْ أُظْلَمَ', 'Allahumma inni a''udzu bika minal faqri wal qillati wadz dzillati wa a''udzu bika min an azhlima aw uzhlam', 'Ya Allah, aku berlindung dari kefakiran, kekurangan, kehinaan, dan aku berlindung dari menzhalimi atau dizhalimi', 'HR. Abu Dawud & Nasa''i', 'Berlindung dari kemiskinan dan kezaliman', 4, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000006', 'Doa Anak Shalih', 'دعاء الذرية الصالحة', 'رَبِّ هَبْ لِي مِنْ لَدُنْكَ ذُرِّيَّةً طَيِّبَةً إِنَّكَ سَمِيعُ الدُّعَاءِ', 'Rabbi hab li min ladunka dzurriyyatan thayyibah innaka sami''ud du''a', 'Ya Tuhanku, karuniakanlah kepadaku dari sisi-Mu keturunan yang baik. Sesungguhnya Engkau Maha Mendengar doa', 'QS. Ali Imran: 38', 'Doa Nabi Zakariya untuk mendapatkan keturunan yang shalih', 5, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DOA HAJI ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000007', 'Doa Niat Haji', 'نية الحج', 'لَبَّيْكَ اللَّهُمَّ حَجًّا', 'Labbaika Allahumma hajjan', 'Aku penuhi panggilan-Mu ya Allah untuk melaksanakan haji', 'HR. Muslim', 'Niat awal ibadah haji', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000007', 'Doa di Arafah', 'دعاء عرفة', 'لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيْرٌ', 'Laa ilaha illallahu wahdahu laa syarika lah, lahul mulku wa lahul hamdu wa huwa ''ala kulli syai-in qadir', 'Tiada tuhan selain Allah semata, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan pujian. Dia Maha Kuasa atas segala sesuatu', 'HR. Tirmidzi', 'Doa terbaik di hari Arafah, hari paling mustajab', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000007', 'Doa di Muzdalifah', 'دعاء المزدلفة', 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', 'Rabbana atina fid dunya hasanatan wa fil akhirati hasanatan wa qina ''adzaban nar', 'Ya Tuhan kami, berilah kami kebaikan di dunia dan akhirat, dan lindungilah kami dari azab neraka', 'QS. Al-Baqarah: 201', 'Doa utama saat bermalam di Muzdalifah', 3, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000007', 'Doa Melempar Jumrah', 'دعاء رمي الجمرات', 'اللهُ أَكْبَرُ، اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا وَذَنْبًا مَغْفُورًا', 'Allahu Akbar. Allahummaj''alhu hajjan mabruran wa dzanban maghfura', 'Allah Maha Besar. Ya Allah, jadikanlah haji yang mabrur dan dosa yang diampuni', 'Riwayat Baihaqi', 'Dibaca setiap melempar batu jumrah', 4, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000007', 'Doa Thawaf Ifadhah', 'دعاء طواف الإفاضة', 'اللَّهُمَّ الْبَيْتُ بَيْتُكَ وَالْعَبْدُ عَبْدُكَ وَابْنُ عَبْدِكَ وَابْنُ أَمَتِكَ حَمَلْتَنِي عَلَى مَا سَخَّرْتَ لِي مِنْ خَلْقِكَ', 'Allahummalbaytu baytuka wal ''abdu ''abduka wabnu ''abdika wabnu amatik, hamaltani ''ala ma sakhkharta li min khalqik', 'Ya Allah, rumah ini rumah-Mu, hamba ini hamba-Mu, anak dari hamba-Mu dan anak dari hamba perempuan-Mu, Engkau membawaku dengan apa yang Engkau tundukkan dari makhluk-Mu', 'Riwayat Baihaqi', 'Doa saat melaksanakan thawaf ifadhah (rukun haji)', 5, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DOA CUACA & ALAM ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000008', 'Doa Saat Hujan', 'دعاء عند المطر', 'اللَّهُمَّ صَيِّبًا نَافِعًا', 'Allahumma shayyiban nafi''a', 'Ya Allah, turunkanlah hujan yang bermanfaat', 'HR. Bukhari', 'Doa saat hujan turun, saat mustajab', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000008', 'Doa Setelah Hujan', 'دعاء بعد المطر', 'مُطِرْنَا بِفَضْلِ اللهِ وَرَحْمَتِهِ', 'Muthirna bifadhlillahi wa rahmatihi', 'Kita dihujani karena karunia dan rahmat Allah', 'HR. Bukhari & Muslim', 'Mensyukuri hujan sebagai rahmat', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000008', 'Doa Saat Angin Kencang', 'دعاء عند الريح', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَهَا وَخَيْرَ مَا فِيهَا وَخَيْرَ مَا أُرْسِلَتْ بِهِ وَأَعُوذُ بِكَ مِنْ شَرِّهَا وَشَرِّ مَا فِيهَا وَشَرِّ مَا أُرْسِلَتْ بِهِ', 'Allahumma inni as-aluka khairaha wa khaira ma fiha wa khaira ma ursilat bih, wa a''udzu bika min syarriha wa syarri ma fiha wa syarri ma ursilat bih', 'Ya Allah, aku memohon kebaikannya, kebaikan yang ada padanya, kebaikan yang dibawanya. Dan aku berlindung dari keburukannya, keburukan yang ada padanya, dan keburukan yang dibawanya', 'HR. Muslim', 'Perlindungan dari bencana angin', 3, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000008', 'Doa Saat Petir', 'دعاء عند الرعد', 'سُبْحَانَ الَّذِي يُسَبِّحُ الرَّعْدُ بِحَمْدِهِ وَالْمَلاَئِكَةُ مِنْ خِيفَتِهِ', 'Subhanalladzi yusabbihur ra''du bihamdihi wal mala-ikatu min khifatihi', 'Maha Suci Allah yang petir bertasbih memuji-Nya dan malaikat pun bertasbih karena takut kepada-Nya', 'Muwaththa'' Imam Malik', 'Membaca tasbih saat mendengar petir', 4, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DOA BERPAKAIAN & BERCERMIN ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000009', 'Doa Memakai Pakaian Baru', 'دعاء لبس الثوب الجديد', 'اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ كَسَوْتَنِيهِ أَسْأَلُكَ خَيْرَهُ وَخَيْرَ مَا صُنِعَ لَهُ وَأَعُوذُ بِكَ مِنْ شَرِّهِ وَشَرِّ مَا صُنِعَ لَهُ', 'Allahumma lakal hamdu anta kasautanihi as-aluka khairahu wa khaira ma shuni''a lahu wa a''udzu bika min syarrihi wa syarri ma shuni''a lah', 'Ya Allah, segala puji bagi-Mu, Engkau yang memakaikannya. Aku memohon kebaikan dan kebaikan dari bahan pembuatannya, dan aku berlindung dari keburukan dan keburukan bahan pembuatannya', 'HR. Abu Dawud & Tirmidzi', 'Doa saat memakai pakaian baru', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000009', 'Doa Bercermin', 'دعاء النظر في المرآة', 'اللَّهُمَّ أَنْتَ حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي', 'Allahumma anta hassanta khalqi fahassin khuluqi', 'Ya Allah, Engkau telah membaguskan ciptaanku maka baguskanlah akhlakku', 'HR. Ahmad', 'Mensyukuri penciptaan dan memohon akhlak baik', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000009', 'Doa Melepas Pakaian', 'دعاء خلع الثوب', 'بِسْمِ اللهِ', 'Bismillah', 'Dengan nama Allah', 'HR. Tirmidzi', 'Terlindung dari pandangan jin saat melepas pakaian', 3, true)
ON CONFLICT DO NOTHING;

-- === KATEGORI: DOA MASJID ===
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, benefits, priority, is_active) VALUES
('b1a2c3d4-1111-4aaa-bbbb-000000000010', 'Doa Masuk Masjid', 'دعاء دخول المسجد', 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', 'Allahummaf-tah li abwaba rahmatik', 'Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu', 'HR. Muslim', 'Dibaca sambil melangkahkan kaki kanan', 1, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000010', 'Doa Keluar Masjid', 'دعاء الخروج من المسجد', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', 'Allahumma inni as-aluka min fadhlika', 'Ya Allah, aku memohon dari karunia-Mu', 'HR. Muslim', 'Dibaca sambil melangkahkan kaki kiri', 2, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000010', 'Doa Masuk Masjid Nabawi', 'دعاء دخول المسجد النبوي', 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَسَلِّمْ، اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', 'Allahumma shalli ''ala Muhammadin wa sallim, Allahummaf-tah li abwaba rahmatik', 'Ya Allah, limpahkanlah shalawat dan salam kepada Muhammad. Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu', 'HR. Muslim & Ibnu Majah', 'Doa khusus saat masuk Masjid Nabawi', 3, true),
('b1a2c3d4-1111-4aaa-bbbb-000000000010', 'Doa Masuk Masjidil Haram', 'دعاء دخول المسجد الحرام', 'اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ فَحَيِّنَا رَبَّنَا بِالسَّلاَمِ وَأَدْخِلْنَا الْجَنَّةَ دَارَ السَّلاَمِ تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ يَا ذَا الْجَلاَلِ وَالْإِكْرَامِ', 'Allahumma antas salam wa minkas salam fahayyana rabbana bis salam wa adkhilnal jannata daras salam tabarakta rabbana wa ta''alaita ya dzal jalali wal ikram', 'Ya Allah, Engkau pemberi keselamatan, dari-Mu keselamatan, hidupkanlah kami dengan keselamatan, masukkan kami ke surga kampung keselamatan, Maha Berkah Engkau wahai Tuhan kami dan Maha Tinggi wahai pemilik keagungan dan kemuliaan', 'HR. Muslim', 'Doa khusus masuk Masjidil Haram Makkah', 4, true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- VERIFIKASI
-- ==========================================
-- SELECT count(*) FROM prayer_categories; -- Harus 14
-- SELECT count(*) FROM prayers; -- Harus 92
