import ihramImg from '@/assets/manasik/ihram.jpg';
import tawafImg from '@/assets/manasik/tawaf.jpg';
import saiImg from '@/assets/manasik/sai.jpg';
import tahallulImg from '@/assets/manasik/tahallul.jpg';
import shalatTawafImg from '@/assets/manasik/shalat-tawaf.jpg';

export interface ManasikStep {
  id: string;
  order: number;
  title: string;
  titleArabic: string;
  type: 'rukun' | 'wajib' | 'sunnah';
  description: string;
  detailedSteps: string[];
  doaArabic?: string;
  doaLatin?: string;
  doaMeaning?: string;
  tips?: string[];
  imageUrl: string;
  audioDuration?: string;
}

export const manasikSteps: ManasikStep[] = [
  {
    id: 'ihram',
    order: 1,
    title: 'Niat & Ihram',
    titleArabic: 'نية الإحرام',
    type: 'rukun',
    imageUrl: ihramImg,
    description: 'Ihram adalah niat untuk memulai ibadah umroh dengan mengenakan pakaian ihram. Dilakukan di Miqat sebelum memasuki tanah suci.',
    detailedSteps: [
      'Mandi sunnah ihram (untuk laki-laki dan perempuan)',
      'Laki-laki memakai 2 lembar kain putih tanpa jahitan',
      'Perempuan memakai pakaian yang menutup aurat, tidak bercadar',
      'Shalat sunnah ihram 2 rakaat',
      'Berniat ihram menghadap kiblat',
      'Mengucapkan Talbiyah'
    ],
    doaArabic: 'لَبَّيْكَ اللَّهُمَّ عُمْرَةً',
    doaLatin: 'Labbaikallahumma \'umratan',
    doaMeaning: 'Aku memenuhi panggilan-Mu ya Allah untuk umroh',
    tips: [
      'Gunakan sabun tanpa pewangi sebelum ihram',
      'Pastikan kain ihram bersih dan tidak tipis',
      'Siapkan safety pin untuk mengamankan kain'
    ],
    audioDuration: '02:45'
  },
  {
    id: 'talbiyah',
    order: 2,
    title: 'Talbiyah',
    titleArabic: 'التَّلْبِيَة',
    type: 'wajib',
    imageUrl: ihramImg,
    description: 'Talbiyah adalah ucapan yang dibaca terus-menerus sejak berniat ihram hingga memulai tawaf. Menunjukkan ketaatan penuh kepada Allah.',
    detailedSteps: [
      'Baca talbiyah dengan suara keras (untuk laki-laki)',
      'Baca talbiyah dengan suara pelan (untuk perempuan)',
      'Terus-menerus dibaca selama perjalanan',
      'Dihentikan saat memulai tawaf'
    ],
    doaArabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيْكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيْكَ لَكَ',
    doaLatin: 'Labbaikallahumma labbaik, labbaika laa syariika laka labbaik, innal hamda wan ni\'mata laka wal mulk, laa syariika lak',
    doaMeaning: 'Aku memenuhi panggilan-Mu ya Allah, aku memenuhi panggilan-Mu. Aku memenuhi panggilan-Mu, tidak ada sekutu bagi-Mu, aku memenuhi panggilan-Mu. Sesungguhnya segala puji, nikmat, dan kerajaan adalah milik-Mu, tidak ada sekutu bagi-Mu.',
    tips: [
      'Hafalkan bacaan talbiyah sebelum berangkat',
      'Bacalah dengan penuh penghayatan dan kekhusyukan'
    ],
    audioDuration: '03:30'
  },
  {
    id: 'tawaf',
    order: 3,
    title: 'Tawaf',
    titleArabic: 'الطَّوَاف',
    type: 'rukun',
    imageUrl: tawafImg,
    description: 'Tawaf adalah mengelilingi Ka\'bah sebanyak 7 kali putaran berlawanan arah jarum jam. Dimulai dan diakhiri di garis Hajar Aswad.',
    detailedSteps: [
      'Masuk Masjidil Haram dengan kaki kanan sambil berdoa',
      'Menghadap Hajar Aswad, angkat tangan kanan dan ucapkan "Bismillahi Allahu Akbar"',
      'Laki-laki melakukan Idhtiba\' (membuka bahu kanan) saat tawaf qudum',
      'Mulai tawaf dari garis Hajar Aswad berlawanan jarum jam',
      'Laki-laki melakukan Raml (jalan cepat) pada 3 putaran pertama',
      'Berdoa bebas atau zikir selama tawaf',
      'Di Rukun Yamani, usap dengan tangan kanan jika memungkinkan',
      'Selesaikan 7 putaran penuh'
    ],
    doaArabic: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
    doaLatin: 'Bismillahi wallahu akbar',
    doaMeaning: 'Dengan nama Allah, dan Allah Maha Besar',
    tips: [
      'Hindari mendorong jamaah lain saat menuju Hajar Aswad',
      'Jaga wudhu selama tawaf',
      'Boleh istirahat jika lelah, tapi jangan duduk di area tawaf'
    ],
    audioDuration: '04:15'
  },
  {
    id: 'shalat-tawaf',
    order: 4,
    title: 'Shalat Sunnah Tawaf',
    titleArabic: 'صلاة سنة الطواف',
    type: 'sunnah',
    imageUrl: shalatTawafImg,
    description: 'Setelah menyelesaikan 7 putaran tawaf, disunnahkan melaksanakan shalat 2 rakaat di belakang Maqam Ibrahim atau di tempat lain dalam Masjidil Haram.',
    detailedSteps: [
      'Menuju Maqam Ibrahim setelah tawaf',
      'Baca doa mendekati Maqam Ibrahim',
      'Shalat 2 rakaat (rakaat 1 baca Al-Kafirun, rakaat 2 baca Al-Ikhlas)',
      'Jika penuh, boleh shalat di tempat lain dalam masjid',
      'Minum air zamzam dan berdoa'
    ],
    doaArabic: 'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى',
    doaLatin: 'Wattakhidzu min maqami Ibrahima mushalla',
    doaMeaning: 'Dan jadikanlah sebagian maqam Ibrahim sebagai tempat shalat',
    tips: [
      'Tidak wajib tepat di belakang Maqam Ibrahim',
      'Berdoa dengan khusyuk setelah shalat',
      'Minum air zamzam sebanyak-banyaknya'
    ],
    audioDuration: '02:00'
  },
  {
    id: 'sai',
    order: 5,
    title: "Sa'i",
    titleArabic: 'السَّعْي',
    type: 'rukun',
    imageUrl: saiImg,
    description: "Sa'i adalah berjalan dari bukit Safa ke Marwah sebanyak 7 kali perjalanan. Mengenang perjuangan Siti Hajar mencari air untuk Nabi Ismail.",
    detailedSteps: [
      'Menuju bukit Safa setelah shalat tawaf',
      'Naik ke bukit Safa, menghadap Ka\'bah, angkat tangan dan berdoa',
      'Berjalan menuju Marwah (hitungan 1)',
      'Laki-laki berlari kecil di area lampu hijau',
      'Naik ke Marwah, menghadap Ka\'bah, berdoa',
      'Kembali ke Safa (hitungan 2)',
      'Ulangi hingga 7 kali, berakhir di Marwah',
      'Berdoa bebas selama perjalanan'
    ],
    doaArabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
    doaLatin: 'Innas shafa wal marwata min sya\'airillah',
    doaMeaning: 'Sesungguhnya Safa dan Marwah adalah sebagian dari syi\'ar Allah',
    tips: [
      'Boleh menggunakan kursi roda jika tidak mampu berjalan',
      'Tidak disyaratkan dalam keadaan suci dari hadats',
      'Perbanyak doa untuk diri sendiri dan keluarga'
    ],
    audioDuration: '03:45'
  },
  {
    id: 'tahallul',
    order: 6,
    title: 'Tahallul',
    titleArabic: 'التَّحَلُّل',
    type: 'rukun',
    imageUrl: tahallulImg,
    description: 'Tahallul adalah mencukur atau memotong rambut sebagai tanda selesainya ibadah umroh. Setelah tahallul, jamaah terbebas dari larangan ihram.',
    detailedSteps: [
      'Setelah selesai sa\'i di Marwah',
      'Laki-laki: mencukur habis (lebih utama) atau memotong minimal 3 helai',
      'Perempuan: memotong ujung rambut sepanjang satu ruas jari',
      'Setelah tahallul, semua larangan ihram gugur',
      'Boleh kembali memakai pakaian biasa'
    ],
    doaArabic: 'اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ وَالْمُقَصِّرِينَ',
    doaLatin: 'Allahummaghfir lil muhalliqina wal muqashshirina',
    doaMeaning: 'Ya Allah, ampunilah orang-orang yang mencukur dan yang memotong rambutnya',
    tips: [
      'Tersedia jasa cukur di sekitar Marwah',
      'Siapkan gunting kecil jika ingin memotong sendiri',
      'Perempuan tidak boleh mencukur habis, cukup memotong ujung'
    ],
    audioDuration: '01:30'
  }
];
