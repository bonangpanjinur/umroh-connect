// Block types and interfaces for Visual Block Builder

export type BlockType = 'hero' | 'features' | 'testimonials' | 'packages' | 'faq' | 'contact' | 'richtext' | 'gallery' | 'video';

export interface BlockData {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  order: number;
  settings?: {
    paddingTop?: string;
    paddingBottom?: string;
    backgroundColor?: string;
    customClass?: string;
    isVisible?: boolean;
    animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'zoom-out' | 'none';
    animationDuration?: number;
  };
}

export interface DesignSettings {
  primaryColor: string;
  fontFamily: string;
  borderRadius: string;
  enableAOS?: boolean;
}

export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  primaryColor: '#8B5CF6',
  fontFamily: 'sans-serif',
  borderRadius: '8px',
};

// Hero Block
export interface HeroBlockContent {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  backgroundColor?: string;
  ctaText?: string;
  ctaLink?: string;
  textColor?: 'white' | 'dark';
  alignment?: 'left' | 'center' | 'right';
}

// Features Block
export interface FeaturesBlockContent {
  title: string;
  subtitle?: string;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  layout?: 'grid' | 'list';
  columns?: 2 | 3 | 4;
}

// Testimonials Block
export interface TestimonialsBlockContent {
  title: string;
  subtitle?: string;
  limit?: number;
  layout?: 'carousel' | 'grid';
  showRating?: boolean;
  showVerified?: boolean;
}

// Packages Block
export interface PackagesBlockContent {
  title: string;
  subtitle?: string;
  limit?: number;
  showPrice?: boolean;
  showRating?: boolean;
  layout?: 'grid' | 'carousel';
  columns?: 2 | 3 | 4;
}

// FAQ Block
export interface FAQBlockContent {
  title: string;
  subtitle?: string;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

// Contact Block
export interface ContactBlockContent {
  title: string;
  subtitle?: string;
  type: 'form' | 'whatsapp' | 'both';
  whatsappNumber?: string;
  whatsappMessage?: string;
  formFields?: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'phone' | 'textarea';
    required?: boolean;
  }>;
}

// Rich Text Block
export interface RichTextBlockContent {
  html: string;
}

// Gallery Block
export interface GalleryBlockContent {
  title: string;
  subtitle?: string;
  images: Array<{
    url: string;
    caption?: string;
  }>;
  columns?: 2 | 3 | 4;
}

// Video Block
export interface VideoBlockContent {
  title: string;
  subtitle?: string;
  videoUrl: string;
  platform: 'youtube' | 'vimeo';
  autoplay?: boolean;
  loop?: boolean;
}

// Block Definition
export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  defaultContent: Record<string, any>;
}

// Registry of all available blocks
export const BLOCK_REGISTRY: Record<BlockType, BlockDefinition> = {
  hero: {
    type: 'hero',
    label: 'Hero Section',
    description: 'Main banner dengan judul dan tombol CTA',
    icon: 'Zap',
    defaultContent: {
      title: 'Selamat Datang',
      subtitle: 'Perjalanan spiritual yang nyaman dan terpercaya',
      backgroundColor: '#8B5CF6',
      textColor: 'white',
      alignment: 'center',
      ctaText: 'Daftar Sekarang',
      ctaLink: '/register',
    } as HeroBlockContent,
  },
  features: {
    type: 'features',
    label: 'Features Grid',
    description: 'Grid fitur dengan ikon dan deskripsi',
    icon: 'Grid',
    defaultContent: {
      title: 'Mengapa Memilih Kami?',
      subtitle: '',
      features: [
        {
          icon: '🚀',
          title: 'Cepat',
          description: 'Proses pendaftaran yang cepat dan mudah',
        },
        {
          icon: '🔒',
          title: 'Aman',
          description: 'Keamanan transaksi adalah prioritas utama',
        },
        {
          icon: '💡',
          title: 'Inovatif',
          description: 'Teknologi terkini untuk kemudahan Anda',
        },
      ],
      layout: 'grid',
      columns: 3,
    } as FeaturesBlockContent,
  },
  testimonials: {
    type: 'testimonials',
    label: 'Testimonials',
    description: 'Ulasan dan testimoni dari jamaah',
    icon: 'MessageSquare',
    defaultContent: {
      title: 'Testimoni Jamaah',
      subtitle: 'Kepuasan pelanggan adalah bukti kualitas kami',
      limit: 6,
      layout: 'grid',
      showRating: true,
      showVerified: true,
    } as TestimonialsBlockContent,
  },
  packages: {
    type: 'packages',
    label: 'Package List',
    description: 'Daftar paket umroh dari database',
    icon: 'Package',
    defaultContent: {
      title: 'Paket Populer',
      subtitle: 'Pilih paket yang sesuai dengan kebutuhan Anda',
      limit: 6,
      showPrice: true,
      showRating: true,
      layout: 'grid',
      columns: 3,
    } as PackagesBlockContent,
  },
  faq: {
    type: 'faq',
    label: 'FAQ',
    description: 'Pertanyaan yang sering diajukan',
    icon: 'HelpCircle',
    defaultContent: {
      title: 'Pertanyaan Umum',
      subtitle: 'Jawaban untuk pertanyaan yang sering diajukan',
      faqs: [
        {
          question: 'Berapa lama proses pendaftaran?',
          answer: 'Proses pendaftaran biasanya memakan waktu 1-2 hari kerja.',
        },
        {
          question: 'Apa saja dokumen yang diperlukan?',
          answer: 'Dokumen yang diperlukan antara lain paspor, KTP, dan surat kesehatan.',
        },
      ],
    } as FAQBlockContent,
  },
  contact: {
    type: 'contact',
    label: 'Contact',
    description: 'Form kontak atau tombol WhatsApp',
    icon: 'Mail',
    defaultContent: {
      title: 'Hubungi Kami',
      subtitle: 'Kami siap membantu Anda',
      type: 'both',
      whatsappNumber: '62812345678',
      whatsappMessage: 'Halo, saya ingin bertanya tentang paket umroh',
      formFields: [
        { name: 'name', label: 'Nama Lengkap', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Nomor HP', type: 'phone', required: true },
        { name: 'message', label: 'Pesan', type: 'textarea', required: true },
      ],
    } as ContactBlockContent,
  },
  richtext: {
    type: 'richtext',
    label: 'Rich Text',
    description: 'Blok teks dengan editor WYSIWYG',
    icon: 'Type',
    defaultContent: {
      html: '<div class="prose max-w-none"><h2>Konten Anda di Sini</h2><p>Gunakan editor untuk menambahkan konten yang Anda inginkan.</p></div>',
    } as RichTextBlockContent,
  },
  gallery: {
    type: 'gallery',
    label: 'Gallery',
    description: 'Grid gambar dengan lightbox',
    icon: 'Image',
    defaultContent: {
      title: 'Galeri Kami',
      subtitle: 'Dokumentasi perjalanan jamaah',
      images: [
        { url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa', caption: 'Masjidil Haram' },
        { url: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb', caption: 'Masjid Nabawi' },
        { url: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056', caption: 'Ka\'bah' },
      ],
      columns: 3,
    } as GalleryBlockContent,
  },
  video: {
    type: 'video',
    label: 'Video',
    description: 'Embed video YouTube atau Vimeo',
    icon: 'Video',
    defaultContent: {
      title: 'Video Perjalanan',
      subtitle: 'Lihat bagaimana perjalanan kami berlangsung',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'youtube',
      autoplay: false,
      loop: false,
    } as VideoBlockContent,
  },
};

// Helper function to create a new block
export function createBlock(type: BlockType): BlockData {
  const definition = BLOCK_REGISTRY[type];
  return {
    id: `block-${Date.now()}`,
    type,
    content: JSON.parse(JSON.stringify(definition.defaultContent)),
    order: 0,
  };
}
