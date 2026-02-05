import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseUntyped as supabase } from '@/lib/supabase';
import PackageCard from '@/components/paket/PackageCard';
import { Button } from '@/components/ui/button';
import { 
  Building2, Phone, Mail, MapPin, MessageSquare, AlertCircle, Loader2, 
  Star, ShieldCheck, Users, Calendar, ArrowRight, Facebook, Instagram, Twitter
} from 'lucide-react';
import { PackageWithDetails, AgentWebsiteSettings } from '@/types/database';
import { motion } from 'framer-motion';

const AgentPublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AgentWebsiteSettings | any>(null);
  const [travel, setTravel] = useState<any>(null);
  const [packages, setPackages] = useState<PackageWithDetails[]>([]);

  useEffect(() => {
    if (slug) {
      fetchAgentData();
    }
  }, [slug]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch settings by slug OR custom_slug (if approved)
      const { data: settingsData, error: settingsError } = await supabase
        .from('agent_website_settings')
        .select('*')
        .or(`slug.eq.${slug},and(custom_slug.eq.${slug},slug_status.eq.approved)`)
        .maybeSingle();

      if (settingsError) throw settingsError;
      
      if (!settingsData) {
        setError('Halaman tidak ditemukan');
        return;
      }

      if (settingsData.is_published === false || settingsData.is_published === null) {
        setError('Website ini belum dipublikasikan oleh pemiliknya');
        return;
      }

      setSettings(settingsData);

      // 2. Fetch travel profile
      const { data: travelData, error: travelError } = await supabase
        .from('travels')
        .select('*')
        .eq('owner_id', settingsData.user_id)
        .maybeSingle();

      if (travelError) throw travelError;
      setTravel(travelData);

      // 3. Fetch packages
      if (travelData) {
        const { data: packagesData, error: packagesError } = await supabase
          .from('packages')
          .select('*, travel:travels(*), departures(*)')
          .eq('travel_id', travelData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (packagesError) throw packagesError;
        setPackages(packagesData as PackageWithDetails[]);
      }

      // 4. Inject SEO & Meta Tags
      const title = settingsData.meta_title || (travelData ? `${travelData.name} | Umroh Connect` : 'Agent Profile');
      document.title = title;
      
      if (settingsData.meta_description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', settingsData.meta_description);
      }

      // 5. Inject Pixel if PRO
      if (settingsData.is_pro_active && settingsData.fb_pixel_id) {
        injectFbPixel(settingsData.fb_pixel_id);
      }

    } catch (err: any) {
      console.error('Error fetching agent data:', err);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const injectFbPixel = (pixelId: string) => {
    if (window.document.getElementById('fb-pixel-script')) return;
    
    const script = window.document.createElement('script');
    script.id = 'fb-pixel-script';
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    window.document.head.appendChild(script);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md"
        >
          <AlertCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">{error || 'Halaman Tidak Ditemukan'}</h2>
          <p className="text-muted-foreground mb-8">Maaf, halaman yang Anda cari tidak dapat ditemukan atau belum dipublikasikan.</p>
          <Button size="lg" onClick={() => navigate('/')} className="rounded-full px-8">
            Kembali ke Beranda
          </Button>
        </motion.div>
      </div>
    );
  }

  // Render Custom HTML Mode
  if (settings.is_builder_active && settings.html_content) {
    return (
      <div className="min-h-screen w-full bg-white relative">
        <div dangerouslySetInnerHTML={{ __html: settings.html_content }} />
        {!settings.is_pro_active && (
          <footer className="py-4 text-center border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Powered by <a href="https://umrohconnect.id" className="font-bold text-primary">Umroh Connect</a>
            </p>
          </footer>
        )}
      </div>
    );
  }

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

  // Render Standard Template Mode
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
                <Button size="lg" className="rounded-full px-8 h-14 text-base shadow-xl shadow-primary/20" style={{ backgroundColor: primaryColor }} asChild>
                  <a href="#paket">Lihat Paket <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                {travel?.phone && (
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base" asChild>
                    <a href={`tel:${travel.phone}`}>Konsultasi Gratis</a>
                  </Button>
                )}
              </div>

              {/* Stats */}
              {settings.show_stats !== false && (
                <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border">
                  <div>
                    <div className="text-3xl font-bold text-foreground mb-1">1000+</div>
                    <div className="text-sm text-muted-foreground">Jamaah Puas</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground mb-1">10+</div>
                    <div className="text-sm text-muted-foreground">Tahun Pengalaman</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground mb-1">{travel?.rating || '4.9'}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      Rating <Star className="w-3 h-3 fill-accent text-accent" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-8 border-background relative z-10">
                <img 
                  src={heroImage} 
                  alt="Hero" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-muted overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                        </div>
                      ))}
                    </div>
                    <span className="text-xs font-medium">Bergabung dengan 500+ jamaah bulan ini</span>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/20 rounded-2xl -z-10 rotate-12" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {settings.show_features !== false && (
        <section className="py-24 bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Mengapa Memilih Kami?</h2>
              <p className="text-muted-foreground">Kami memberikan jaminan kenyamanan dan keamanan untuk setiap langkah perjalanan ibadah Anda.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature: any, i: number) => {
                const Icon = i === 0 ? ShieldCheck : i === 1 ? Users : Calendar;
                return (
                  <div key={i} className="bg-background p-8 rounded-3xl border border-border hover:shadow-xl transition-shadow group">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-primary" style={{ color: primaryColor }} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description || feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Package Grid */}
      <section id="paket" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold mb-4">Paket Umroh & Haji Unggulan</h2>
              <p className="text-muted-foreground">Pilih paket yang sesuai dengan kebutuhan dan budget Anda. Semua paket sudah termasuk fasilitas standar premium.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full">Semua</Button>
              <Button variant="ghost" className="rounded-full">Umroh</Button>
              <Button variant="ghost" className="rounded-full">Haji</Button>
            </div>
          </div>

          {packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <PackageCard 
                  key={pkg.id} 
                  package={pkg} 
                  onClick={() => navigate(`/paket/${pkg.id}`)} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-secondary/20 rounded-[40px] border-2 border-dashed border-border">
              <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Calendar className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold mb-2">Belum Ada Paket</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">Saat ini belum ada paket yang dipublikasikan. Silakan hubungi kami untuk informasi lebih lanjut.</p>
              <Button className="mt-8 rounded-full" variant="outline" asChild>
                <a href={`https://wa.me/${travel?.whatsapp}`}>Tanya Jadwal Terbaru</a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* About / Contact Section */}
      <section id="tentang" className="py-24 bg-foreground text-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 -skew-x-12 translate-x-1/4" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-8">Hubungi Kantor Kami</h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-primary" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-1">Alamat Kantor</div>
                    <div className="text-lg font-medium">{travel?.address || 'Alamat belum tersedia'}</div>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-primary" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-1">Telepon / WhatsApp</div>
                    <div className="text-lg font-medium">{travel?.phone || travel?.whatsapp || 'Kontak belum tersedia'}</div>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-primary" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-1">Email Support</div>
                    <div className="text-lg font-medium">{travel?.email || 'Email belum tersedia'}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {settings.show_contact_form !== false && (
              <div className="bg-white text-foreground p-8 sm:p-10 rounded-[40px] shadow-2xl">
                <h3 className="text-2xl font-bold mb-6">Kirim Pesan</h3>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nama Lengkap</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Masukkan nama" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nomor WhatsApp</label>
                      <input type="tel" className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="0812..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pesan Anda</label>
                    <textarea className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[120px]" placeholder="Tanyakan sesuatu tentang paket kami..." />
                  </div>
                  <Button className="w-full h-14 rounded-xl text-base font-bold" style={{ backgroundColor: primaryColor }}>Kirim Pesan Sekarang</Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                {travel?.logo_url ? (
                  <img src={travel.logo_url} alt={travel.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-4 h-4 text-primary" />
                )}
              </div>
              <span className="font-bold">{travel?.name}</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {travel?.name}. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              {!settings.is_pro_active && (
                <p className="text-xs text-muted-foreground">
                  Powered by <a href="https://umrohconnect.id" className="font-bold text-primary hover:underline">Umroh Connect</a>
                </p>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AgentPublicProfile;
