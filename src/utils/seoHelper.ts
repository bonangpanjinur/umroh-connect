// SEO Helper utilities for generating meta tags and suggestions

export interface SEOSuggestion {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  keywords: string[];
}

// Travel-specific keywords for SEO
const TRAVEL_KEYWORDS = {
  umroh: ['umroh', 'paket umroh', 'travel umroh', 'umroh murah', 'umroh terpercaya'],
  haji: ['haji', 'paket haji', 'haji plus', 'haji furoda', 'pendaftaran haji'],
  package: ['paket', 'harga', 'promo', 'diskon', 'penawaran'],
  trust: ['terpercaya', 'berpengalaman', 'profesional', 'berlisensi', 'terakreditasi'],
  features: ['akomodasi', 'transportasi', 'pembimbing', 'makanan', 'asuransi'],
};

// Template suggestions for different page types
export const PAGE_TEMPLATES = {
  landing: {
    title: 'Landing Page Umroh',
    description: 'Halaman penjualan dengan focus pada konversi jamaah',
    blocks: ['hero', 'features', 'packages', 'testimonials', 'contact'],
  },
  about: {
    title: 'Tentang Kami',
    description: 'Halaman profil perusahaan dengan cerita dan kredibilitas',
    blocks: ['hero', 'features', 'testimonials', 'contact'],
  },
  packages: {
    title: 'Daftar Paket',
    description: 'Halaman katalog paket umroh dengan filter dan detail',
    blocks: ['hero', 'packages', 'faq', 'contact'],
  },
  faq: {
    title: 'FAQ',
    description: 'Halaman pertanyaan yang sering diajukan',
    blocks: ['hero', 'faq', 'contact'],
  },
  contact: {
    title: 'Hubungi Kami',
    description: 'Halaman kontak dan informasi perusahaan',
    blocks: ['hero', 'contact', 'richtext'],
  },
};

/**
 * Generate SEO suggestions based on page title and content
 */
export function generateSEOSuggestions(
  title: string,
  content?: string,
  pageType?: string
): SEOSuggestion {
  const slug = generateSlug(title);
  const keywords = extractKeywords(title, content);

  // Generate meta title (50-60 chars is ideal)
  const metaTitle = generateMetaTitle(title, pageType);

  // Generate meta description (150-160 chars is ideal)
  const metaDescription = generateMetaDescription(title, content, pageType);

  return {
    metaTitle,
    metaDescription,
    slug,
    keywords,
  };
}

/**
 * Generate URL-friendly slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

/**
 * Generate optimized meta title
 */
function generateMetaTitle(title: string, pageType?: string): string {
  const baseTitle = title.substring(0, 40);
  let suffix = ' | Arah Umroh';

  if (pageType === 'landing') {
    suffix = ' - Paket Umroh Terpercaya | Arah Umroh';
  } else if (pageType === 'packages') {
    suffix = ' - Daftar Paket | Arah Umroh';
  } else if (pageType === 'about') {
    suffix = ' - Tentang Kami | Arah Umroh';
  }

  const metaTitle = baseTitle + suffix;
  return metaTitle.substring(0, 60);
}

/**
 * Generate optimized meta description
 */
function generateMetaDescription(title: string, content?: string, pageType?: string): string {
  let description = '';

  if (pageType === 'landing') {
    description = `${title}. Kami menawarkan paket umroh terpercaya dengan harga kompetitif, akomodasi berkualitas, dan pembimbing berpengalaman. Daftar sekarang dan dapatkan penawaran spesial.`;
  } else if (pageType === 'packages') {
    description = `Jelajahi berbagai pilihan ${title} kami. Paket umroh dengan akomodasi bintang 5, transportasi nyaman, dan pembimbing profesional. Pesan sekarang dengan harga terbaik.`;
  } else if (pageType === 'about') {
    description = `Pelajari lebih lanjut tentang ${title}. Kami adalah travel umroh terpercaya dengan pengalaman bertahun-tahun melayani jamaah dengan sepenuh hati.`;
  } else if (pageType === 'faq') {
    description = `Temukan jawaban atas pertanyaan umum tentang paket umroh kami. Informasi lengkap tentang proses pendaftaran, dokumentasi, dan persiapan perjalanan.`;
  } else if (pageType === 'contact') {
    description = `Hubungi kami untuk informasi lebih lanjut tentang paket umroh. Tim customer service kami siap membantu Anda 24/7 melalui WhatsApp, email, atau telepon.`;
  } else {
    description = `${title}. Temukan informasi lengkap tentang paket umroh kami dan bergabunglah dengan ribuan jamaah yang telah merasakan pengalaman spiritual yang tak terlupakan.`;
  }

  return description.substring(0, 160);
}

/**
 * Extract keywords from title and content
 */
function extractKeywords(title: string, content?: string): string[] {
  const keywords: Set<string> = new Set();

  // Add title words as keywords
  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  titleWords.forEach(word => keywords.add(word));

  // Add travel-specific keywords
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('umroh')) {
    TRAVEL_KEYWORDS.umroh.forEach(k => keywords.add(k));
  }
  if (lowerTitle.includes('haji')) {
    TRAVEL_KEYWORDS.haji.forEach(k => keywords.add(k));
  }
  if (lowerTitle.includes('paket')) {
    TRAVEL_KEYWORDS.package.forEach(k => keywords.add(k));
  }

  // Always add trust keywords for travel industry
  TRAVEL_KEYWORDS.trust.slice(0, 2).forEach(k => keywords.add(k));

  return Array.from(keywords).slice(0, 10);
}

/**
 * Get template suggestions based on page title
 */
export function getTemplateSuggestions(title: string): string[] {
  const lowerTitle = title.toLowerCase();
  const suggestions: string[] = [];

  if (lowerTitle.includes('landing') || lowerTitle.includes('promosi')) {
    suggestions.push('landing');
  }
  if (lowerTitle.includes('tentang') || lowerTitle.includes('profil')) {
    suggestions.push('about');
  }
  if (lowerTitle.includes('paket')) {
    suggestions.push('packages');
  }
  if (lowerTitle.includes('faq') || lowerTitle.includes('tanya')) {
    suggestions.push('faq');
  }
  if (lowerTitle.includes('hubungi') || lowerTitle.includes('kontak')) {
    suggestions.push('contact');
  }

  return suggestions.length > 0 ? suggestions : ['landing'];
}

/**
 * Generate copywriting suggestions based on page type
 */
export function getCopywritingSuggestions(pageType?: string): Record<string, string> {
  const suggestions: Record<string, string> = {};

  switch (pageType) {
    case 'landing':
      suggestions.heroTitle = 'Wujudkan Impian Umroh Anda Bersama Kami';
      suggestions.heroSubtitle = 'Paket umroh terpercaya dengan akomodasi berkualitas dan pembimbing berpengalaman';
      suggestions.ctaText = 'Daftar Sekarang';
      suggestions.featuresTitle = 'Mengapa Memilih Kami?';
      suggestions.testimonialsTitle = 'Kepuasan Jamaah Adalah Bukti Kualitas Kami';
      break;
    case 'packages':
      suggestions.heroTitle = 'Pilih Paket Umroh Impian Anda';
      suggestions.heroSubtitle = 'Berbagai pilihan paket dengan harga kompetitif dan kualitas terjamin';
      suggestions.packagesTitle = 'Paket Populer Kami';
      suggestions.ctaText = 'Lihat Detail';
      break;
    case 'about':
      suggestions.heroTitle = 'Tentang Arah Umroh';
      suggestions.heroSubtitle = 'Kami berkomitmen memberikan pengalaman umroh terbaik untuk Anda';
      suggestions.featuresTitle = 'Keunggulan Kami';
      break;
    case 'faq':
      suggestions.heroTitle = 'Pertanyaan yang Sering Diajakan';
      suggestions.heroSubtitle = 'Temukan jawaban atas pertanyaan umum tentang paket umroh kami';
      suggestions.faqTitle = 'FAQ';
      break;
    case 'contact':
      suggestions.heroTitle = 'Hubungi Kami';
      suggestions.heroSubtitle = 'Tim kami siap membantu Anda 24/7';
      suggestions.contactTitle = 'Hubungi Kami';
      suggestions.contactSubtitle = 'Silakan hubungi kami melalui form di bawah atau kontak langsung via WhatsApp';
      break;
    default:
      suggestions.heroTitle = 'Selamat Datang';
      suggestions.heroSubtitle = 'Halaman informasi penting untuk Anda';
  }

  return suggestions;
}

/**
 * Validate SEO metrics
 */
export interface SEOMetrics {
  titleLength: number;
  descriptionLength: number;
  titleOK: boolean;
  descriptionOK: boolean;
  keywordCount: number;
  score: number;
}

export function validateSEO(
  title: string,
  description: string,
  keywords: string[]
): SEOMetrics {
  const titleLength = title.length;
  const descriptionLength = description.length;
  const titleOK = titleLength >= 30 && titleLength <= 60;
  const descriptionOK = descriptionLength >= 120 && descriptionLength <= 160;
  const keywordCount = keywords.length;

  let score = 0;
  if (titleOK) score += 30;
  if (descriptionOK) score += 30;
  if (keywordCount >= 5) score += 20;
  if (titleLength > 0 && descriptionLength > 0) score += 20;

  return {
    titleLength,
    descriptionLength,
    titleOK,
    descriptionOK,
    keywordCount,
    score: Math.min(score, 100),
  };
}

/**
 * Get SEO score color
 */
export function getSEOScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get SEO score label
 */
export function getSEOScoreLabel(score: number): string {
  if (score >= 80) return 'Sangat Baik';
  if (score >= 60) return 'Baik';
  return 'Perlu Diperbaiki';
}
