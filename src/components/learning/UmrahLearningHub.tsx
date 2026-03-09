import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, HandHeart, Book, MapPin, Compass, GraduationCap, ChevronRight, CheckCircle2, Search, ClipboardCheck, ChevronDown, ChevronUp, HelpCircle, Lightbulb, Plane, Building, Shirt, Pill, BookHeart, Check, Brain } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useManasikGuides } from '@/hooks/useManasikGuides';
import { usePrayers } from '@/hooks/usePrayers';
import { useManasikProgress } from '@/hooks/useManasikProgress';
import LearningBadgesCard from './LearningBadgesCard';
import ManasikQuiz from './ManasikQuiz';
import { ShoppingBag } from 'lucide-react';

interface UmrahLearningHubProps {
  onMenuClick?: (menuId: string) => void;
}

// Map checklist items to shop search terms
const shopSearchMap: Record<string, string> = {
  'ihram': 'kain ihram',
  'mukena': 'mukena',
  'sajadah': 'sajadah travel',
  'sandal': 'sandal',
  'quran-kecil': 'al-quran kecil',
  'tasbih': 'tasbih',
  'peniti': 'peniti ihram',
  'ikat-pinggang': 'money belt ihram',
  'koper': 'koper',
  'tas-kecil': 'sling bag',
  'charger': 'power bank',
  'botol-zamzam': 'botol zamzam',
  'masker': 'masker',
  'hand-sanitizer': 'hand sanitizer',
  'sunblock': 'sunblock',
  'buku-doa': 'buku doa manasik',
};

// Universal checklist data
const checklistCategories = [
  {
    id: 'dokumen',
    label: 'Dokumen',
    icon: BookHeart,
    items: [
      { id: 'paspor', label: 'Paspor (masa berlaku min. 6 bulan)' },
      { id: 'visa', label: 'Visa umroh' },
      { id: 'tiket', label: 'Tiket pesawat (pp)' },
      { id: 'foto', label: 'Pas foto 4x6 (latar putih)' },
      { id: 'vaksin', label: 'Sertifikat vaksin meningitis' },
      { id: 'asuransi', label: 'Asuransi perjalanan' },
      { id: 'fotokopi', label: 'Fotokopi KTP & KK' },
    ]
  },
  {
    id: 'pakaian',
    label: 'Pakaian',
    icon: Shirt,
    items: [
      { id: 'ihram', label: 'Kain ihram (2 lembar, pria)' },
      { id: 'mukena', label: 'Mukena (wanita)' },
      { id: 'sajadah', label: 'Sajadah travel' },
      { id: 'sandal', label: 'Sandal nyaman untuk tawaf' },
      { id: 'jaket', label: 'Jaket/sweater (untuk pesawat & Madinah)' },
      { id: 'baju-harian', label: 'Pakaian harian (3-5 stel)' },
      { id: 'kaos-kaki', label: 'Kaos kaki (beberapa pasang)' },
    ]
  },
  {
    id: 'obat',
    label: 'Obat & Kesehatan',
    icon: Pill,
    items: [
      { id: 'obat-pribadi', label: 'Obat-obatan pribadi' },
      { id: 'masker', label: 'Masker (banyak)' },
      { id: 'hand-sanitizer', label: 'Hand sanitizer' },
      { id: 'sunblock', label: 'Sunblock/tabir surya' },
      { id: 'plester', label: 'Plester luka' },
      { id: 'tolak-angin', label: 'Tolak angin / minyak kayu putih' },
    ]
  },
  {
    id: 'ibadah',
    label: 'Perlengkapan Ibadah',
    icon: BookOpen,
    items: [
      { id: 'quran-kecil', label: 'Al-Quran kecil / digital' },
      { id: 'buku-doa', label: 'Buku doa manasik' },
      { id: 'tasbih', label: 'Tasbih' },
      { id: 'peniti', label: 'Peniti / safety pin (untuk ihram)' },
      { id: 'ikat-pinggang', label: 'Ikat pinggang / money belt ihram' },
    ]
  },
  {
    id: 'lainnya',
    label: 'Lainnya',
    icon: Plane,
    items: [
      { id: 'koper', label: 'Koper (max 20kg)' },
      { id: 'tas-kecil', label: 'Tas kecil / sling bag' },
      { id: 'charger', label: 'Charger HP & power bank' },
      { id: 'adapter', label: 'Adapter colokan listrik (tipe G)' },
      { id: 'uang-riyal', label: 'Uang Saudi Riyal' },
      { id: 'botol-zamzam', label: 'Botol untuk air zamzam' },
    ]
  }
];

// FAQ Data
const faqData = [
  {
    category: 'Sebelum Berangkat',
    items: [
      { q: 'Berapa lama paspor harus berlaku?', a: 'Minimal 6 bulan sebelum tanggal keberangkatan. Pastikan juga masih ada halaman kosong untuk visa.' },
      { q: 'Vaksin apa yang wajib?', a: 'Vaksin meningitis meningokokus wajib. Disarankan juga vaksin influenza, terutama saat musim haji.' },
      { q: 'Berapa uang yang perlu dibawa?', a: 'Disarankan membawa 1.500-3.000 SAR (Saudi Riyal) untuk keperluan makan tambahan, oleh-oleh, dan transportasi lokal.' },
    ]
  },
  {
    category: 'Di Tanah Suci',
    items: [
      { q: 'Bagaimana cuaca di Makkah & Madinah?', a: 'Makkah cenderung panas (30-45°C). Madinah sedikit lebih sejuk. Bawa pakaian ringan dan pelindung matahari.' },
      { q: 'Apakah boleh menggunakan kursi roda untuk tawaf?', a: 'Ya, tersedia layanan kursi roda di Masjidil Haram. Bisa disewa atau dibawa sendiri. Tawaf dilakukan di lantai atas.' },
      { q: 'Bagaimana jika haid saat umroh?', a: 'Wanita yang haid tidak boleh melakukan tawaf. Tunggu hingga suci, mandi besar, lalu lanjutkan ibadah umroh.' },
    ]
  },
  {
    category: 'Setelah Pulang',
    items: [
      { q: 'Berapa liter air zamzam boleh dibawa pulang?', a: 'Umumnya 5-10 liter per orang. Pastikan menggunakan wadah yang aman dan sesuai aturan maskapai.' },
      { q: 'Apa yang harus dilakukan setelah sampai di rumah?', a: 'Shalat 2 rakaat syukur, berbagi oleh-oleh, dan terus istiqamah menjaga ibadah yang sudah dibiasakan selama di Tanah Suci.' },
    ]
  }
];

// Tips data
const tipsData = [
  { icon: '💰', title: 'Mata Uang', desc: '1 SAR ≈ Rp4.200. Tukarkan di money changer terpercaya atau ambil di ATM Arab Saudi.' },
  { icon: '🔌', title: 'Colokan Listrik', desc: 'Arab Saudi menggunakan tipe G (3 pin persegi). Bawa adapter universal.' },
  { icon: '☀️', title: 'Cuaca', desc: 'Suhu bisa mencapai 45°C di musim panas. Bawa tabir surya, topi, dan minum air yang cukup.' },
  { icon: '📱', title: 'SIM Card', desc: 'Beli SIM card lokal (STC, Mobily) di bandara untuk internet murah selama di Arab Saudi.' },
  { icon: '🕐', title: 'Zona Waktu', desc: 'WIB +4 jam. Sesuaikan jadwal tidur beberapa hari sebelum berangkat.' },
  { icon: '👟', title: 'Alas Kaki', desc: 'Gunakan sandal yang mudah dilepas-pasang untuk tawaf dan sai. Bawa tas sandal kecil.' },
];

const UmrahLearningHub = ({ onMenuClick }: UmrahLearningHubProps) => {
  const [activeTab, setActiveTab] = useState('tatacara');
  const [doaSearch, setDoaSearch] = useState('');
  const { data: manasikGuides = [], isLoading: loadingManasik } = useManasikGuides('umroh');
  const { data: prayers = [], isLoading: loadingPrayers } = usePrayers();
  const { completedSteps, toggleStep } = useManasikProgress();

  // Checklist state from localStorage
  const [checkedItems, setCheckedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('umroh_checklist');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const toggleChecklist = (itemId: string) => {
    const updated = checkedItems.includes(itemId)
      ? checkedItems.filter(i => i !== itemId)
      : [...checkedItems, itemId];
    setCheckedItems(updated);
    localStorage.setItem('umroh_checklist', JSON.stringify(updated));
  };

  const totalChecklistItems = checklistCategories.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedCount = checkedItems.length;

  const progress = manasikGuides.length > 0
    ? Math.round((completedSteps.filter(id => manasikGuides.some(g => g.id === id)).length / manasikGuides.length) * 100)
    : 0;

  const filteredPrayers = prayers.filter(p =>
    !doaSearch || p.title?.toLowerCase().includes(doaSearch.toLowerCase()) || p.category?.name?.toLowerCase().includes(doaSearch.toLowerCase())
  );

  const prayerCategories = filteredPrayers.reduce((acc, p) => {
    const cat = p.category?.name || 'Lainnya';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, typeof prayers>);

  const quranProgress = useMemo(() => {
    try {
      const saved = localStorage.getItem('quran_last_read');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 space-y-4"
    >
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Belajar Umroh</h1>
            <p className="text-xs text-muted-foreground">Panduan lengkap persiapan ibadah</p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="px-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Progress Belajar</span>
              <Badge variant="secondary" className="text-xs">{progress}%</Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[10px] text-muted-foreground">
                {completedSteps.filter(id => manasikGuides.some(g => g.id === id)).length} dari {manasikGuides.length} langkah
              </p>
              <p className="text-[10px] text-muted-foreground">
                {checkedCount}/{totalChecklistItems} checklist
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Badges */}
      <div className="px-4">
        <LearningBadgesCard />
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="tatacara" className="text-[10px] gap-0.5 px-1">
              <BookOpen className="w-3 h-3" />
              Tata Cara
            </TabsTrigger>
            <TabsTrigger value="doa" className="text-[10px] gap-0.5 px-1">
              <HandHeart className="w-3 h-3" />
              Doa
            </TabsTrigger>
            <TabsTrigger value="quran" className="text-[10px] gap-0.5 px-1">
              <Book className="w-3 h-3" />
              Al-Quran
            </TabsTrigger>
            <TabsTrigger value="persiapan" className="text-[10px] gap-0.5 px-1">
              <ClipboardCheck className="w-3 h-3" />
              Persiapan
            </TabsTrigger>
            <TabsTrigger value="quiz" className="text-[10px] gap-0.5 px-1">
              <Brain className="w-3 h-3" />
              Quiz
            </TabsTrigger>
          </TabsList>

          {/* Tab: Tata Cara */}
          <TabsContent value="tatacara" className="space-y-3 mt-3">
            {loadingManasik ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : manasikGuides.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada panduan manasik</p>
                </CardContent>
              </Card>
            ) : (
              manasikGuides.map((guide, idx) => {
                const isDone = completedSteps.includes(guide.id);
                return (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all ${isDone ? 'bg-primary/5 border-primary/20' : 'hover:shadow-md'}`}
                      onClick={() => onMenuClick?.(`manasik:${idx}`)}
                    >
                      <CardContent className="py-3 px-4 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium ${isDone ? 'text-primary' : 'text-foreground'}`}>
                            {guide.title}
                          </h4>
                          {guide.title_arabic && (
                            <p className="text-xs text-muted-foreground font-arabic">{guide.title_arabic}</p>
                          )}
                          {guide.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{guide.description}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}

            <Button
              variant="outline"
              className="w-full gap-2 text-xs"
              onClick={() => onMenuClick?.('peta')}
            >
              <MapPin className="w-4 h-4 text-primary" />
              Lihat Peta Lokasi Penting
            </Button>
          </TabsContent>

          {/* Tab: Doa-doa */}
          <TabsContent value="doa" className="space-y-3 mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari doa..."
                value={doaSearch}
                onChange={e => setDoaSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {loadingPrayers ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : Object.keys(prayerCategories).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <HandHeart className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {doaSearch ? 'Doa tidak ditemukan' : 'Belum ada doa'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(prayerCategories).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{category}</h4>
                  <div className="space-y-2">
                    {items.map(prayer => (
                      <Card key={prayer.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="py-3 px-4">
                          <h5 className="text-sm font-medium text-foreground">{prayer.title}</h5>
                          {prayer.arabic_text && (
                            <p className="text-right text-base font-arabic text-foreground mt-2 leading-loose">{prayer.arabic_text}</p>
                          )}
                          {prayer.transliteration && (
                            <p className="text-xs text-muted-foreground italic mt-1">{prayer.transliteration}</p>
                          )}
                          {prayer.translation && (
                            <p className="text-xs text-muted-foreground mt-1">{prayer.translation}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Tab: Al-Quran */}
          <TabsContent value="quran" className="space-y-3 mt-3">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800">
              <CardContent className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      {quranProgress ? 'Lanjut Membaca' : 'Mulai Membaca'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {quranProgress
                        ? `Surah ${quranProgress.surahName || quranProgress.surah}, Ayat ${quranProgress.ayah || 1}`
                        : 'Al-Fatihah, Ayat 1'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => onMenuClick?.('quran')}
                  >
                    Baca
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Progress Khatam</span>
                  <span className="text-xs text-muted-foreground">
                    {quranProgress?.surah || 1}/114 Surah
                  </span>
                </div>
                <Progress value={((quranProgress?.surah || 1) / 114) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => onMenuClick?.('quran')}
            >
              <Book className="w-4 h-4" />
              Buka Al-Quran Digital
            </Button>
          </TabsContent>

          {/* Tab: Persiapan */}
          <TabsContent value="persiapan" className="space-y-4 mt-3">
            {/* Checklist Progress */}
            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-200 dark:border-blue-800">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">Checklist Persiapan</span>
                  <Badge variant="secondary" className="text-xs">
                    {checkedCount}/{totalChecklistItems}
                  </Badge>
                </div>
                <Progress value={totalChecklistItems > 0 ? (checkedCount / totalChecklistItems) * 100 : 0} className="h-2" />
              </CardContent>
            </Card>

            {/* Checklist Categories */}
            <Accordion type="multiple" className="space-y-2">
              {checklistCategories.map(cat => {
                const Icon = cat.icon;
                const catChecked = cat.items.filter(i => checkedItems.includes(i.id)).length;
                return (
                  <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg px-1">
                    <AccordionTrigger className="py-3 px-3 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground">{cat.label}</span>
                        <Badge variant={catChecked === cat.items.length ? 'default' : 'outline'} className="text-[10px] ml-auto mr-2">
                          {catChecked}/{cat.items.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <div className="space-y-2">
                        {cat.items.map(item => (
                          <label
                            key={item.id}
                            className="flex items-center gap-3 py-1.5 cursor-pointer"
                          >
                            <Checkbox
                              checked={checkedItems.includes(item.id)}
                              onCheckedChange={() => toggleChecklist(item.id)}
                            />
                            <span className={`text-sm flex-1 ${checkedItems.includes(item.id) ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {item.label}
                            </span>
                            {shopSearchMap[item.id] && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] text-primary gap-1 shrink-0"
                                onClick={(e) => { e.preventDefault(); onMenuClick?.(`shop:${shopSearchMap[item.id]}`); }}
                              >
                                <ShoppingBag className="w-3 h-3" />
                                Beli
                              </Button>
                            )}
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {/* Tips Section */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Tips Perjalanan
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {tipsData.map((tip, idx) => (
                  <Card key={idx} className="hover:shadow-sm transition-shadow">
                    <CardContent className="py-2.5 px-3">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{tip.icon}</span>
                        <div>
                          <h5 className="text-xs font-semibold text-foreground">{tip.title}</h5>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{tip.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                FAQ Umroh
              </h4>
              <Accordion type="single" collapsible className="space-y-2">
                {faqData.map(section => (
                  <div key={section.category}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">{section.category}</p>
                    {section.items.map((item, idx) => (
                      <AccordionItem key={`${section.category}-${idx}`} value={`${section.category}-${idx}`} className="border rounded-lg px-1 mb-2">
                        <AccordionTrigger className="py-2.5 px-3 text-left hover:no-underline">
                          <span className="text-xs font-medium text-foreground pr-4">{item.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3">
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </div>
                ))}
              </Accordion>
            </div>

            {/* Quick Tools */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => onMenuClick?.('qibla')}
              >
                <Compass className="w-3.5 h-3.5 text-primary" />
                Kiblat
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => onMenuClick?.('tabungan')}
              >
                <Building className="w-3.5 h-3.5 text-primary" />
                Kalkulator
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => onMenuClick?.('peta')}
              >
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Peta
              </Button>
            </div>
          </TabsContent>

          {/* Tab: Quiz */}
          <TabsContent value="quiz" className="mt-3">
            <ManasikQuiz />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default UmrahLearningHub;
