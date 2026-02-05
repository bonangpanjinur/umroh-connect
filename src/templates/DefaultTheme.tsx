
import { motion } from 'framer-motion';
import { 
  Building2, Phone, Mail, MapPin, MessageSquare, 
  Star, ShieldCheck, Users, Calendar, ArrowRight, Facebook, Instagram, Twitter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PackageCard from '@/components/paket/PackageCard';
import { PackageWithDetails, AgentWebsiteSettings } from '@/types/database';

interface DefaultThemeProps {
  data: {
    settings: AgentWebsiteSettings;
    travel: any;
    packages: PackageWithDetails[];
  };
}

const DefaultTheme = ({ data }: DefaultThemeProps) => {
  const { settings, travel, packages } = data;

  // Dynamic values from settings
  const primaryColor = settings.primary_color || '#0284c7';
  const heroTitle = settings.hero_title || `Wujudkan Ibadah Suci Bersama ${travel?.name || 'Kami'}`;
  const heroDesc = settings.hero_description || travel?.description || 'Kami berkomitmen memberikan pelayanan terbaik untuk perjalanan ibadah Umroh dan Haji Anda dengan fasilitas premium dan pembimbing berpengalaman.';
  const heroImage = settings.hero_image_url || (packages.length > 0 && packages[0].images && packages[0].images.length > 0 ? packages[0].images[0] : "https://images.unsplash.com/photo-1565552629477-087529670247?w=1200");
  
  const defaultFeatures = [
    { title: "Resmi & Terpercaya", description: "Terdaftar resmi di Kementrian Agama dengan track record keberangkatan 100%." },
    { title: "Pembimbing Berpengalaman", description: "Didampingi oleh Muthawif dan pembimbing ibadah yang kompeten dan sabar." },
    { title: "Jadwal Pasti", description: "Kepastian tanggal keberangkatan dan maskapai terbaik untuk kenyamanan Anda." }
  ];

  const features = settings.features_json ? (Array.isArray(settings.features_json) ? settings.features_json : defaultFeatures) : defaultFeatures;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10" style={{ '--primary': primaryColor } as any}>
      {/* Navigation / Top Bar */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                {travel?.logo_url ? (
                  <img src={travel.logo_url} alt={travel.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6 text-primary" />
                )}
              </div>
              <span className="font-bold text-lg hidden sm:block">{travel?.name || 'Travel Agent'}</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="hidden md:flex" asChild>
                <a href="#paket">Paket</a>
              </Button>
              <Button variant="ghost" size="sm" className="hidden md:flex" asChild>
                <a href="#tentang">Tentang Kami</a>
              </Button>
              {travel?.whatsapp && (
                <Button size="sm" className="rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20" asChild>
                  <a href={`https://wa.me/${travel.whatsapp}`} target="_blank" rel="noreferrer">
                    <MessageSquare className="w-4 h-4 mr-2" /> Hubungi Kami
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Travel Umroh & Haji Terpercaya
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]" style={{ color: primaryColor }}>
                {heroTitle}
              </h1>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl leading-relaxed">
                {heroDesc}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/20" asChild>
                  <a href="#paket">Lihat Paket Pilihan <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                {travel?.whatsapp && (
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-2" asChild>
                    <a href={`https://wa.me/${travel.whatsapp}`} target="_blank" rel="noreferrer">Konsultasi Gratis</a>
                  </Button>
                )}
              </div>
              
              <div className="mt-12 flex items-center gap-8 border-t border-border pt-8">
                <div>
                  <p className="text-3xl font-bold mb-1">100%</p>
                  <p className="text-sm text-muted-foreground">Keberangkatan</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-3xl font-bold mb-1">5.0</p>
                  <p className="text-sm text-muted-foreground">Rating Kepuasan</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-3xl font-bold mb-1">24/7</p>
                  <p className="text-sm text-muted-foreground">Layanan Support</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-8 border-background relative z-10">
                <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-background p-6 rounded-2xl shadow-xl border border-border z-20 max-w-[240px] hidden sm:block">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Ribuan Jamaah</p>
                    <p className="text-xs text-muted-foreground">Telah berangkat bersama kami</p>
                  </div>
                </div>
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                    +1k
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {settings.show_features !== false && (
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Mengapa Memilih Kami?</h2>
              <p className="text-muted-foreground">Kami mengutamakan kenyamanan dan kekhusyukan ibadah Anda dengan standar pelayanan internasional.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    {idx === 0 ? <ShieldCheck className="w-6 h-6 text-primary" /> : 
                     idx === 1 ? <Users className="w-6 h-6 text-primary" /> : 
                     <Calendar className="w-6 h-6 text-primary" />}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Packages Section */}
      <section id="paket" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Paket Perjalanan Pilihan</h2>
              <p className="text-muted-foreground">Pilih paket yang sesuai dengan kebutuhan dan budget Anda. Semua paket sudah termasuk fasilitas standar berkualitas.</p>
            </div>
            <Button variant="outline" className="rounded-full" asChild>
              <a href="#kontak">Lihat Semua Paket</a>
            </Button>
          </div>

          {packages.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg, idx) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <PackageCard pkg={pkg} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
              <p className="text-muted-foreground">Belum ada paket yang tersedia saat ini.</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      {settings.show_stats !== false && (
        <section className="py-24 bg-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 rounded-full border-8 border-white" />
            <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full border-8 border-white" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
              <div>
                <p className="text-4xl sm:text-5xl font-extrabold mb-2">10+</p>
                <p className="text-primary-foreground/80 font-medium uppercase tracking-wider text-sm">Tahun Pengalaman</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-extrabold mb-2">5k+</p>
                <p className="text-primary-foreground/80 font-medium uppercase tracking-wider text-sm">Jamaah Terlayani</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-extrabold mb-2">100%</p>
                <p className="text-primary-foreground/80 font-medium uppercase tracking-wider text-sm">Visa Disetujui</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-extrabold mb-2">24/7</p>
                <p className="text-primary-foreground/80 font-medium uppercase tracking-wider text-sm">Layanan Bantuan</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About / CTA Section */}
      <section id="tentang" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-muted/50 rounded-[3rem] p-8 md:p-16 border border-border overflow-hidden relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Siap Melangkah ke Tanah Suci?</h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Jangan tunda niat suci Anda. Kami siap membantu mewujudkan perjalanan ibadah yang nyaman, aman, dan penuh berkah. Hubungi tim konsultan kami untuk informasi lebih lanjut mengenai paket, jadwal, dan persyaratan.
                </p>
                <div className="space-y-4 mb-8">
                  {travel?.address && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 border border-border">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">Kantor Pusat</p>
                        <p className="text-muted-foreground">{travel.address}</p>
                      </div>
                    </div>
                  )}
                  {travel?.phone && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 border border-border">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">Telepon</p>
                        <p className="text-muted-foreground">{travel.phone}</p>
                      </div>
                    </div>
                  )}
                  {travel?.email && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 border border-border">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">Email</p>
                        <p className="text-muted-foreground">{travel.email}</p>
                      </div>
                    </div>
                  )}
                </div>
                {travel?.whatsapp && (
                  <Button size="lg" className="rounded-full px-10 h-14 text-lg bg-green-600 hover:bg-green-700 text-white" asChild>
                    <a href={`https://wa.me/${travel.whatsapp}`} target="_blank" rel="noreferrer">
                      <MessageSquare className="w-5 h-5 mr-2" /> Chat via WhatsApp
                    </a>
                  </Button>
                )}
              </div>
              <div className="relative">
                <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800" alt="Contact" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                {travel?.logo_url ? (
                  <img src={travel.logo_url} alt={travel.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-5 h-5 text-primary" />
                )}
              </div>
              <span className="font-bold text-lg">{travel?.name || 'Travel Agent'}</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
            </div>

            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {travel?.name}. All rights reserved.
            </p>
          </div>
          
          {!settings.is_pro_active && (
            <div className="mt-12 pt-8 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Powered by <a href="https://umrohconnect.id" className="font-bold text-primary">Umroh Connect</a> - Platform Manajemen Travel Umroh & Haji
              </p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default DefaultTheme;
