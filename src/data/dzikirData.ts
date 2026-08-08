export interface DzikirItem {
  id: string;
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  count: number;
  source?: string;
}

const SHARED: Omit<DzikirItem, 'id'>[] = [
  {
    title: 'Ayat Kursi',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
    latin: 'Allāhu lā ilāha illā huwal-ḥayyul-qayyūm, lā ta’khudzuhū sinatun wa lā naum',
    translation:
      'Allah, tidak ada tuhan selain Dia, Yang Mahahidup, Yang terus-menerus mengurus makhluk-Nya; tidak mengantuk dan tidak tidur.',
    count: 1,
    source: 'QS. Al-Baqarah: 255',
  },
  {
    title: 'Tasbih',
    arabic: 'سُبْحَانَ اللَّهِ',
    latin: 'Subḥānallāh',
    translation: 'Mahasuci Allah.',
    count: 33,
  },
  {
    title: 'Tahmid',
    arabic: 'الْحَمْدُ لِلَّهِ',
    latin: 'Alḥamdulillāh',
    translation: 'Segala puji bagi Allah.',
    count: 33,
  },
  {
    title: 'Takbir',
    arabic: 'اللَّهُ أَكْبَرُ',
    latin: 'Allāhu akbar',
    translation: 'Allah Mahabesar.',
    count: 33,
  },
  {
    title: 'Istighfar',
    arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    latin: 'Astaghfirullāha wa atūbu ilaih',
    translation: 'Aku memohon ampun kepada Allah dan bertobat kepada-Nya.',
    count: 10,
  },
  {
    title: 'Shalawat',
    arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    latin: 'Allāhumma ṣalli wa sallim ‘alā nabiyyinā Muḥammad',
    translation: 'Ya Allah, berikanlah shalawat dan salam kepada Nabi kami Muhammad.',
    count: 10,
  },
];

export const morningDzikir: DzikirItem[] = [
  {
    id: 'pagi-doa-bangun',
    title: 'Doa Pagi',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
    latin: 'Aṣbaḥnā wa aṣbaḥal-mulku lillāh',
    translation: 'Kami memasuki waktu pagi dan kerajaan hanya milik Allah.',
    count: 1,
  },
  ...SHARED.map((d, i) => ({ ...d, id: `pagi-${i}` })),
];

export const eveningDzikir: DzikirItem[] = [
  {
    id: 'petang-doa',
    title: 'Doa Petang',
    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
    latin: 'Amsaynā wa amsal-mulku lillāh',
    translation: 'Kami memasuki waktu petang dan kerajaan hanya milik Allah.',
    count: 1,
  },
  ...SHARED.map((d, i) => ({ ...d, id: `petang-${i}` })),
];

export type DzikirSessionType = 'morning' | 'evening';

export const getDzikirSession = (type: DzikirSessionType): DzikirItem[] =>
  type === 'morning' ? morningDzikir : eveningDzikir;

export const dzikirSessionLabel = (type: DzikirSessionType) =>
  type === 'morning' ? 'Dzikir Pagi' : 'Dzikir Petang';
