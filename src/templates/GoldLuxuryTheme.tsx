
import { motion } from 'framer-motion';
import { 
  Building2, Phone, Mail, MapPin, MessageSquare, 
  Star, ShieldCheck, Users, Calendar, ArrowRight, Facebook, Instagram, Twitter,
  Award, CheckCircle2, Clock, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PackageCard from '@/components/paket/PackageCard';
import { PackageWithDetails, AgentWebsiteSettings } from '@/types/database';

interface GoldLuxuryThemeProps {
  data: {
    settings: AgentWebsiteSettings;
    travel: any;
    packages: PackageWithDetails[];
  };
}

const GoldLuxuryTheme = ({ data }: GoldLuxuryThemeProps) => {
  const { settings, travel, packages } = data;

  // Luxury Theme Colors (Gold & Dark/White)
  const primaryColor = '#D4AF37'; // Gold
  const secondaryColor = '#1A1A1A'; // Dark
  
  const heroTitle = settings.hero_title || `Perjalanan Ibadah Eksklusif Bersama ${travel?.name || 'Kami'}`;
  const heroDesc = settings.hero_description || travel?.description || 'Menghadirkan kenyamanan ibadah premium dengan pelayanan personal dan fasilitas terbaik di kelasnya.';
  const heroImage = settings.hero_image_url || (packages.length > 0 && packages[0].images && packages[0].images.length > 0 ? packages[0].images[0] : "https://images.unsplash.com/photo-1565552629477-087529670247?w=1200");
  
  const defaultFeatures = [
    { title: "Layanan VIP", description: "Pendampingan eksklusif mulai dari pendaftaran hingga kembali ke tanah air." },
    { title: "Hotel Bintang 5", description: "Akomodasi terbaik dengan jarak terdekat ke Masjidil Haram dan Masjid Nabawi." },
    { title: "Pembimbing Khusus", description: "Bimbingan ibadah intensif oleh asatidz berpengalaman dan kompeten." }
  ];

  const features = settings.features_json ? (Array.isArray(settings.features_json) ? settings.features_json : defaultFeatures) : defaultFeatures;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333] selection:bg-[#D4AF37]/20 font-serif">
      {/* Top Bar - Luxury Style */}
      <div className="bg-[#1A1A1A] text-white py-2 px-4 text-center text-xs tracking-[0.2em] uppercase">
        Penyelenggara Umroh & Haji Khusus Berizin Resmi Kemenag RI
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center overflow-hidden border-2 border-[#D4AF37]">
                {travel?.logo_url ? (
                  <img src={travel.logo_url} alt={travel.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6 text-[#D4AF37]" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight leading-none">{travel?.name || 'Travel Agent'}</span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] mt-1">Luxury Travel Service</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#paket" className="text-sm font-medium hover:text-[#D4AF37] transition-colors uppercase tracking-widest">Paket</a>
              <a href="#layanan" className="text-sm font-medium hover:text-[#D4AF37] transition-colors uppercase tracking-widest">Layanan</a>
              <a href="#tentang" className="text-sm font-medium hover:text-[#D4AF37] transition-colors uppercase tracking-widest">Tentang</a>
              {travel?.whatsapp && (
                <Button className="rounded-none bg-[#D4AF37] hover:bg-[#B8962E] text-white px-8 uppercase tracking-widest text-xs h-12" asChild>
                  <a href={`https://wa.me/${travel.whatsapp}`} target="_blank" rel="noreferrer">
                    Reservasi Sekarang
                  </a>
                </Button>
              )}
            </div>
            <div className="md:hidden">
               {/* Mobile menu button could go here */}
               <Button variant="ghost" size="icon">
                 <MessageSquare className="w-6 h-6 text-[#D4AF37]" />
               </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Elegant Split */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-[#1A1A1A]">
        <div className="absolute inset-0 opacity-40">
          <img src={heroImage} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] via-[#1A1A1A]/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-[1px] w-12 bg-[#D4AF37]" />
                <span className="text-[#D4AF37] uppercase tracking-[0.4em] text-xs font-bold">Premium Experience</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 leading-[1.1]">
                {heroTitle}
              </h1>
              <p className="text-xl text-gray-300 mb-12 leading-relaxed font-light italic">
                "{heroDesc}"
              </p>
              <div className="flex flex-wrap gap-6">
                <Button size="lg" className="rounded-none bg-[#D4AF37] hover:bg-[#B8962E] text-white px-10 h-16 text-sm uppercase tracking-[0.2em] shadow-2xl" asChild>
                  <a href="#paket">Eksplorasi Paket <ArrowRight className="ml-3 w-5 h-5" /></a>
                </Button>
                {travel?.whatsapp && (
                  <Button size="lg" variant="outline" className="rounded-none border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white px-10 h-16 text-sm uppercase tracking-[0.2em] bg-transparent" asChild>
                    <a href={`https://wa.me/${travel.whatsapp}`} target="_blank" rel="noreferrer">Konsultasi VIP</a>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Decorative Element */}
        <div className="absolute bottom-0 right-0 p-12 hidden lg:block">
          <div className="border-l-2 border-[#D4AF37] pl-6">
            <p className="text-white text-4xl font-bold mb-1">2026</p>
            <p className="text-[#D4AF37] uppercase tracking-widest text-xs">Season of Grace</p>
          </div>
        </div>
      </section>

      {/* Features - Luxury Cards */}
      <section id="layanan" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <span className="text-[#D4AF37] uppercase tracking-[0.3em] text-xs font-bold mb-4 block">Our Excellence</span>
            <h2 className="text-4xl font-bold mb-6">Standar Pelayanan Tertinggi</h2>
            <div className="h-1 w-20 bg-[#D4AF37] mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-16">
            {features.map((feature: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="text-center group"
              >
                <div className="w-20 h-20 mx-auto mb-8 relative">
                  <div className="absolute inset-0 border border-[#D4AF37] rotate-45 group-hover:rotate-90 transition-transform duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {idx === 0 ? <Award className="w-8 h-8 text-[#D4AF37]" /> : 
                     idx === 1 ? <Building2 className="w-8 h-8 text-[#D4AF37]" /> : 
                     <CheckCircle2 className="w-8 h-8 text-[#D4AF37]" />}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 uppercase tracking-wider">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed font-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages - Luxury Grid */}
      <section id="paket" className="py-32 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div>
              <span className="text-[#D4AF37] uppercase tracking-[0.3em] text-xs font-bold mb-4 block">Curated Collections</span>
              <h2 className="text-4xl font-bold">Paket Perjalanan Pilihan</h2>
            </div>
            <div className="h-[1px] flex-grow bg-[#D4AF37]/20 mx-8 hidden md:block" />
            <Button variant="link" className="text-[#D4AF37] uppercase tracking-widest text-xs font-bold p-0 h-auto" asChild>
              <a href="#kontak">Lihat Semua Koleksi <ArrowRight className="ml-2 w-4 h-4" /></a>
            </Button>
          </div>

          {packages.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12">
              {packages.map((pkg, idx) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="luxury-package-card"
                >
                  <PackageCard pkg={pkg} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 border border-[#D4AF37]/20 bg-white">
              <p className="text-gray-400 italic">Koleksi paket sedang diperbarui...</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonial / Quote */}
      <section className="py-32 bg-[#1A1A1A] text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-5">
          <div className="text-[20rem] font-bold leading-none select-none">UMROH</div>
        </div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <Heart className="w-12 h-12 text-[#D4AF37] mx-auto mb-12 opacity-50" />
          <h2 className="text-3xl md:text-4xl font-light italic leading-relaxed mb-12">
            "Ibadah adalah perjalanan hati. Kami hadir untuk memastikan setiap langkah Anda menuju Baitullah dipenuhi dengan ketenangan dan kemuliaan."
          </h2>
          <div className="h-[1px] w-20 bg-[#D4AF37] mx-auto mb-6" />
          <p className="uppercase tracking-[0.4em] text-[#D4AF37] text-sm font-bold">Manajemen {travel?.name}</p>
        </div>
      </section>

      {/* Contact / Footer Info */}
      <section id="tentang" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
              <div className="aspect-[4/5] bg-gray-200 relative">
                <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800" alt="Luxury Service" className="w-full h-full object-cover" />
                <div className="absolute -bottom-12 -right-12 w-64 h-64 border-2 border-[#D4AF37] -z-10 hidden md:block" />
              </div>
            </div>
            <div>
              <span className="text-[#D4AF37] uppercase tracking-[0.3em] text-xs font-bold mb-4 block">Contact Us</span>
              <h2 className="text-4xl font-bold mb-12">Hubungi Konsultan Kami</h2>
              
              <div className="space-y-10">
                <div className="flex items-start gap-6">
                  <MapPin className="w-6 h-6 text-[#D4AF37] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold uppercase tracking-widest text-sm mb-2">Main Gallery</h4>
                    <p className="text-gray-500 font-light leading-relaxed">{travel?.address || 'Alamat belum diatur'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <Phone className="w-6 h-6 text-[#D4AF37] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold uppercase tracking-widest text-sm mb-2">Concierge</h4>
                    <p className="text-gray-500 font-light">{travel?.phone || 'Nomor telepon belum diatur'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <Mail className="w-6 h-6 text-[#D4AF37] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold uppercase tracking-widest text-sm mb-2">Inquiries</h4>
                    <p className="text-gray-500 font-light">{travel?.email || 'Email belum diatur'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-16">
                {travel?.whatsapp && (
                  <Button size="lg" className="rounded-none bg-[#1A1A1A] hover:bg-black text-white px-12 h-16 text-sm uppercase tracking-[0.2em]" asChild>
                    <a href={`https://wa.me/${travel.whatsapp}`} target="_blank" rel="noreferrer">
                      Mulai Konsultasi
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-[#1A1A1A] text-white border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full border border-[#D4AF37] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <span className="font-bold text-xl tracking-tighter">{travel?.name}</span>
              </div>
              <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">Excellence in Every Journey</p>
            </div>
            
            <div className="flex items-center gap-8">
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors"><Twitter className="w-5 h-5" /></a>
            </div>

            <div className="text-center md:text-right">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">© {new Date().getFullYear()} {travel?.name}</p>
              {!settings.is_pro_active && (
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">
                  Powered by <span className="text-gray-400">Umroh Connect</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GoldLuxuryTheme;
