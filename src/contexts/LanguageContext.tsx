import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'id' | 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    // Navigation
    'nav.home': 'Beranda',
    'nav.packages': 'Paket',
    'nav.checklist': 'Checklist',
    'nav.prayers': 'Doa',
    'nav.account': 'Akun',
    
    // Home
    'home.welcome': 'Selamat Datang',
    'home.featured': 'Paket Unggulan',
    'home.quick_menu': 'Menu Cepat',
    'home.prayer_times': 'Waktu Shalat',
    'home.journey': 'Perjalanan Ibadah',
    
    // Packages
    'packages.title': 'Paket Umroh & Haji',
    'packages.search': 'Cari paket...',
    'packages.filter': 'Filter',
    'packages.all': 'Semua',
    'packages.umroh': 'Umroh',
    'packages.haji': 'Haji',
    'packages.price': 'Harga',
    'packages.duration': 'Durasi',
    'packages.days': 'hari',
    'packages.hotel': 'Hotel',
    'packages.star': 'Bintang',
    'packages.departure': 'Keberangkatan',
    'packages.book_now': 'Pesan Sekarang',
    'packages.inquiry': 'Kirim Inquiry',
    'packages.ai_recommend': 'Rekomendasi AI',
    'packages.facilities': 'Fasilitas',
    'packages.available_seats': 'Kursi Tersedia',
    
    // Checklist
    'checklist.title': 'Checklist Persiapan',
    'checklist.documents': 'Dokumen',
    'checklist.equipment': 'Perlengkapan',
    'checklist.health': 'Kesehatan',
    'checklist.mental': 'Mental & Spiritual',
    'checklist.progress': 'Progress',
    'checklist.completed': 'Selesai',
    
    // Prayers
    'prayers.title': 'Kumpulan Doa',
    'prayers.search': 'Cari doa...',
    'prayers.arabic': 'Arab',
    'prayers.transliteration': 'Transliterasi',
    'prayers.translation': 'Terjemahan',
    'prayers.source': 'Sumber',
    'prayers.play': 'Putar Audio',
    'prayers.stop': 'Hentikan',
    
    // Account
    'account.title': 'Akun Saya',
    'account.profile': 'Profil',
    'account.bookings': 'Pesanan Saya',
    'account.notifications': 'Notifikasi',
    'account.settings': 'Pengaturan',
    'account.language': 'Bahasa',
    'account.logout': 'Keluar',
    'account.login': 'Masuk',
    'account.register': 'Daftar',
    
    // Chat
    'chat.title': 'Chat dengan Agent',
    'chat.placeholder': 'Tulis pesan...',
    'chat.send': 'Kirim',
    'chat.no_messages': 'Belum ada pesan',
    'chat.online': 'Online',
    'chat.offline': 'Offline',
    'chat.typing': 'Sedang mengetik...',
    
    // Common
    'common.loading': 'Memuat...',
    'common.error': 'Terjadi kesalahan',
    'common.retry': 'Coba Lagi',
    'common.cancel': 'Batal',
    'common.save': 'Simpan',
    'common.close': 'Tutup',
    'common.confirm': 'Konfirmasi',
    'common.back': 'Kembali',
    'common.next': 'Selanjutnya',
    'common.previous': 'Sebelumnya',
    'common.search': 'Cari',
    'common.view_all': 'Lihat Semua',
    'common.no_data': 'Tidak ada data',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.packages': 'Packages',
    'nav.checklist': 'Checklist',
    'nav.prayers': 'Prayers',
    'nav.account': 'Account',
    
    // Home
    'home.welcome': 'Welcome',
    'home.featured': 'Featured Packages',
    'home.quick_menu': 'Quick Menu',
    'home.prayer_times': 'Prayer Times',
    'home.journey': 'Journey of Worship',
    
    // Packages
    'packages.title': 'Umrah & Hajj Packages',
    'packages.search': 'Search packages...',
    'packages.filter': 'Filter',
    'packages.all': 'All',
    'packages.umroh': 'Umrah',
    'packages.haji': 'Hajj',
    'packages.price': 'Price',
    'packages.duration': 'Duration',
    'packages.days': 'days',
    'packages.hotel': 'Hotel',
    'packages.star': 'Star',
    'packages.departure': 'Departure',
    'packages.book_now': 'Book Now',
    'packages.inquiry': 'Send Inquiry',
    'packages.ai_recommend': 'AI Recommendation',
    'packages.facilities': 'Facilities',
    'packages.available_seats': 'Available Seats',
    
    // Checklist
    'checklist.title': 'Preparation Checklist',
    'checklist.documents': 'Documents',
    'checklist.equipment': 'Equipment',
    'checklist.health': 'Health',
    'checklist.mental': 'Mental & Spiritual',
    'checklist.progress': 'Progress',
    'checklist.completed': 'Completed',
    
    // Prayers
    'prayers.title': 'Prayer Collection',
    'prayers.search': 'Search prayers...',
    'prayers.arabic': 'Arabic',
    'prayers.transliteration': 'Transliteration',
    'prayers.translation': 'Translation',
    'prayers.source': 'Source',
    'prayers.play': 'Play Audio',
    'prayers.stop': 'Stop',
    
    // Account
    'account.title': 'My Account',
    'account.profile': 'Profile',
    'account.bookings': 'My Bookings',
    'account.notifications': 'Notifications',
    'account.settings': 'Settings',
    'account.language': 'Language',
    'account.logout': 'Logout',
    'account.login': 'Login',
    'account.register': 'Register',
    
    // Chat
    'chat.title': 'Chat with Agent',
    'chat.placeholder': 'Type a message...',
    'chat.send': 'Send',
    'chat.no_messages': 'No messages yet',
    'chat.online': 'Online',
    'chat.offline': 'Offline',
    'chat.typing': 'Typing...',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.view_all': 'View All',
    'common.no_data': 'No data available',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.packages': 'الباقات',
    'nav.checklist': 'قائمة التحقق',
    'nav.prayers': 'الأدعية',
    'nav.account': 'الحساب',
    
    // Home
    'home.welcome': 'مرحباً',
    'home.featured': 'الباقات المميزة',
    'home.quick_menu': 'القائمة السريعة',
    'home.prayer_times': 'مواقيت الصلاة',
    'home.journey': 'رحلة العبادة',
    
    // Packages
    'packages.title': 'باقات العمرة والحج',
    'packages.search': 'البحث عن الباقات...',
    'packages.filter': 'تصفية',
    'packages.all': 'الكل',
    'packages.umroh': 'العمرة',
    'packages.haji': 'الحج',
    'packages.price': 'السعر',
    'packages.duration': 'المدة',
    'packages.days': 'أيام',
    'packages.hotel': 'الفندق',
    'packages.star': 'نجوم',
    'packages.departure': 'المغادرة',
    'packages.book_now': 'احجز الآن',
    'packages.inquiry': 'إرسال استفسار',
    'packages.ai_recommend': 'توصية الذكاء الاصطناعي',
    'packages.facilities': 'المرافق',
    'packages.available_seats': 'المقاعد المتاحة',
    
    // Checklist
    'checklist.title': 'قائمة التحضير',
    'checklist.documents': 'الوثائق',
    'checklist.equipment': 'المعدات',
    'checklist.health': 'الصحة',
    'checklist.mental': 'الروحي والنفسي',
    'checklist.progress': 'التقدم',
    'checklist.completed': 'مكتمل',
    
    // Prayers
    'prayers.title': 'مجموعة الأدعية',
    'prayers.search': 'البحث عن الأدعية...',
    'prayers.arabic': 'العربية',
    'prayers.transliteration': 'النطق',
    'prayers.translation': 'الترجمة',
    'prayers.source': 'المصدر',
    'prayers.play': 'تشغيل الصوت',
    'prayers.stop': 'إيقاف',
    
    // Account
    'account.title': 'حسابي',
    'account.profile': 'الملف الشخصي',
    'account.bookings': 'حجوزاتي',
    'account.notifications': 'الإشعارات',
    'account.settings': 'الإعدادات',
    'account.language': 'اللغة',
    'account.logout': 'تسجيل الخروج',
    'account.login': 'تسجيل الدخول',
    'account.register': 'تسجيل جديد',
    
    // Chat
    'chat.title': 'الدردشة مع الوكيل',
    'chat.placeholder': 'اكتب رسالة...',
    'chat.send': 'إرسال',
    'chat.no_messages': 'لا توجد رسائل بعد',
    'chat.online': 'متصل',
    'chat.offline': 'غير متصل',
    'chat.typing': 'يكتب...',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.retry': 'إعادة المحاولة',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.close': 'إغلاق',
    'common.confirm': 'تأكيد',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.search': 'بحث',
    'common.view_all': 'عرض الكل',
    'common.no_data': 'لا توجد بيانات',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'id';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
