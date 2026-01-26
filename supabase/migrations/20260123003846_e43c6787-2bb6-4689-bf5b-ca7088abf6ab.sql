-- Create storage bucket for prayer audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('prayer-audio', 'prayer-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create prayer categories table
CREATE TABLE public.prayer_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_arabic TEXT,
  description TEXT,
  icon TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prayers table
CREATE TABLE public.prayers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.prayer_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  title_arabic TEXT,
  arabic_text TEXT NOT NULL,
  transliteration TEXT,
  translation TEXT,
  source TEXT,
  benefits TEXT,
  audio_url TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prayer_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

-- RLS policies for prayer_categories
CREATE POLICY "Anyone can view active categories"
ON public.prayer_categories FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage categories"
ON public.prayer_categories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for prayers
CREATE POLICY "Anyone can view active prayers"
ON public.prayers FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage prayers"
ON public.prayers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for prayer audio
CREATE POLICY "Anyone can view prayer audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'prayer-audio');

CREATE POLICY "Admins can upload prayer audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prayer-audio' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update prayer audio"
ON storage.objects FOR UPDATE
USING (bucket_id = 'prayer-audio' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete prayer audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'prayer-audio' AND has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_prayer_categories_updated_at
BEFORE UPDATE ON public.prayer_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prayers_updated_at
BEFORE UPDATE ON public.prayers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.prayer_categories (name, name_arabic, description, icon, priority) VALUES
('Doa Umroh', 'أدعية العمرة', 'Doa-doa khusus saat pelaksanaan umroh', 'kaaba', 1),
('Doa Harian', 'أدعية يومية', 'Doa-doa sehari-hari', 'sun', 2),
('Doa Perjalanan', 'أدعية السفر', 'Doa-doa saat bepergian', 'plane', 3),
('Dzikir', 'الأذكار', 'Bacaan dzikir dan wirid', 'sparkles', 4);

-- Insert default prayers
INSERT INTO public.prayers (category_id, title, title_arabic, arabic_text, transliteration, translation, source, priority) VALUES
-- Doa Umroh
((SELECT id FROM prayer_categories WHERE name = 'Doa Umroh'), 
'Niat Umroh', 'نية العمرة',
'لَبَّيْكَ اللَّهُمَّ عُمْرَةً',
'Labbaikallahumma ''umratan',
'Aku memenuhi panggilan-Mu ya Allah untuk melaksanakan umroh',
'HR. Bukhari & Muslim', 1),

((SELECT id FROM prayer_categories WHERE name = 'Doa Umroh'),
'Talbiyah', 'التلبية',
'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لاَ شَرِيْكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لاَ شَرِيْكَ لَكَ',
'Labbaikallahumma labbaik, labbaika laa syariika laka labbaik, innal hamda wan ni''mata laka wal mulk, laa syariika lak',
'Aku datang memenuhi panggilan-Mu ya Allah, aku datang memenuhi panggilan-Mu. Aku datang memenuhi panggilan-Mu, tiada sekutu bagi-Mu, aku datang memenuhi panggilan-Mu. Sesungguhnya segala puji, nikmat dan kerajaan adalah milik-Mu, tiada sekutu bagi-Mu',
'HR. Bukhari & Muslim', 2),

((SELECT id FROM prayer_categories WHERE name = 'Doa Umroh'),
'Doa Melihat Ka''bah', 'دعاء رؤية الكعبة',
'اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً، وَزِدْ مَنْ شَرَّفَهُ وَكَرَّمَهُ مِمَّنْ حَجَّهُ أَوِ اعْتَمَرَهُ تَشْرِيفًا وَتَكْرِيمًا وَتَعْظِيمًا وَبِرًّا',
'Allahumma zid hadhal baita tasyrifan wa ta''zhiman wa takriman wa mahabah, wa zid man syarrafahu wa karramahu mimman hajjahu awi''tamarahu tasyrifan wa takriman wa ta''zhiman wa birra',
'Ya Allah, tambahkanlah kemuliaan, keagungan, kehormatan dan kewibawaan rumah ini. Dan tambahkanlah kemuliaan, kehormatan, keagungan dan kebaikan bagi siapa saja yang memuliakannya dari orang-orang yang berhaji atau berumrah',
'Riwayat Baihaqi', 3),

((SELECT id FROM prayer_categories WHERE name = 'Doa Umroh'),
'Doa di Multazam', 'دعاء الملتزم',
'اللَّهُمَّ يَا رَبَّ الْبَيْتِ الْعَتِيقِ، أَعْتِقْ رِقَابَنَا وَرِقَابَ آبَائِنَا وَأُمَّهَاتِنَا وَإِخْوَانِنَا وَأَوْلاَدِنَا مِنَ النَّارِ',
'Allahumma ya rabbal baitil ''atiq, a''tiq riqabana wa riqaba aba-ina wa ummahatina wa ikhwanina wa auladina minan nar',
'Ya Allah, Tuhan rumah tua ini (Ka''bah), bebaskanlah diri kami, bapak-bapak kami, ibu-ibu kami, saudara-saudara kami, dan anak-anak kami dari api neraka',
'Riwayat Baihaqi', 4),

((SELECT id FROM prayer_categories WHERE name = 'Doa Umroh'),
'Doa Sai di Bukit Shafa', 'دعاء السعي في الصفا',
'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللهِ، أَبْدَأُ بِمَا بَدَأَ اللهُ بِهِ',
'Innash shafa wal marwata min sya''airillah, abda-u bima bada-allahu bih',
'Sesungguhnya Shafa dan Marwah termasuk syiar-syiar Allah. Aku memulai dengan apa yang Allah memulainya',
'QS. Al-Baqarah: 158', 5),

-- Doa Harian
((SELECT id FROM prayer_categories WHERE name = 'Doa Harian'),
'Doa Bangun Tidur', 'دعاء الاستيقاظ',
'الْحَمْدُ لِلَّهِ الَّذِيْ أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُوْرُ',
'Alhamdulillahilladzi ahyana ba''da ma amatana wa ilaihin nusyur',
'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan kepada-Nya kami akan dibangkitkan',
'HR. Bukhari', 1),

((SELECT id FROM prayer_categories WHERE name = 'Doa Harian'),
'Doa Sebelum Makan', 'دعاء قبل الأكل',
'بِسْمِ اللهِ وَعَلَى بَرَكَةِ اللهِ',
'Bismillahi wa ''ala barakatillah',
'Dengan nama Allah dan dengan berkah Allah',
'HR. Abu Dawud', 2),

((SELECT id FROM prayer_categories WHERE name = 'Doa Harian'),
'Doa Sesudah Makan', 'دعاء بعد الأكل',
'الْحَمْدُ لِلَّهِ الَّذِيْ أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِيْنَ',
'Alhamdulillahilladzi ath''amana wa saqana wa ja''alana minal muslimin',
'Segala puji bagi Allah yang telah memberi kami makan dan minum serta menjadikan kami termasuk orang-orang Islam',
'HR. Abu Dawud & Tirmidzi', 3),

-- Doa Perjalanan
((SELECT id FROM prayer_categories WHERE name = 'Doa Perjalanan'),
'Doa Naik Kendaraan', 'دعاء ركوب الدابة',
'سُبْحَانَ الَّذِيْ سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِيْنَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُوْنَ',
'Subhanalladzi sakhkhara lana hadza wa ma kunna lahu muqrinin wa inna ila rabbina lamunqalibun',
'Maha Suci Allah yang telah menundukkan ini untuk kami, padahal sebelumnya kami tidak mampu menguasainya, dan sesungguhnya kepada Tuhan kami pasti akan kembali',
'QS. Az-Zukhruf: 13-14', 1),

((SELECT id FROM prayer_categories WHERE name = 'Doa Perjalanan'),
'Doa Masuk Masjid', 'دعاء دخول المسجد',
'اللَّهُمَّ افْتَحْ لِيْ أَبْوَابَ رَحْمَتِكَ',
'Allahummaf tahli abwaba rahmatik',
'Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu',
'HR. Muslim', 2),

((SELECT id FROM prayer_categories WHERE name = 'Doa Perjalanan'),
'Doa Keluar Masjid', 'دعاء الخروج من المسجد',
'اللَّهُمَّ إِنِّيْ أَسْأَلُكَ مِنْ فَضْلِكَ',
'Allahumma inni as-aluka min fadlik',
'Ya Allah, sesungguhnya aku memohon kepada-Mu dari karunia-Mu',
'HR. Muslim', 3),

-- Dzikir
((SELECT id FROM prayer_categories WHERE name = 'Dzikir'),
'Tasbih', 'التسبيح',
'سُبْحَانَ اللهِ',
'Subhanallah',
'Maha Suci Allah',
'HR. Muslim', 1),

((SELECT id FROM prayer_categories WHERE name = 'Dzikir'),
'Tahmid', 'التحميد',
'الْحَمْدُ لِلَّهِ',
'Alhamdulillah',
'Segala puji bagi Allah',
'HR. Muslim', 2),

((SELECT id FROM prayer_categories WHERE name = 'Dzikir'),
'Takbir', 'التكبير',
'اللهُ أَكْبَرُ',
'Allahu Akbar',
'Allah Maha Besar',
'HR. Muslim', 3),

((SELECT id FROM prayer_categories WHERE name = 'Dzikir'),
'Istighfar', 'الاستغفار',
'أَسْتَغْفِرُ اللهَ الْعَظِيْمَ',
'Astaghfirullahal ''azhim',
'Aku memohon ampun kepada Allah Yang Maha Agung',
'HR. Muslim', 4);