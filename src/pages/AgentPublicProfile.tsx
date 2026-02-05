import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseUntyped as supabase } from '@/lib/supabase';
import PackageCard from '@/components/paket/PackageCard';
import { Button } from '@/components/ui/button';
import { Building2, Phone, Mail, MapPin, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { PackageWithDetails } from '@/types/database';

const AgentPublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
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
        // If not found in agent settings, maybe it's a static page
        // We'll let the parent or App.tsx handle the fallback if possible, 
        // but here we'll just set error.
        setError('Halaman tidak ditemukan');
        return;
      }

      // Check if website is published
      // If is_published is null or undefined, we treat it as false (not published)
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">{error || 'Halaman Tidak Ditemukan'}</h2>
        <Button onClick={() => navigate('/')}>Kembali ke Beranda</Button>
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

  // Render Standard Template Mode
  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header Banner */}
      <div className="bg-primary text-primary-foreground py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            {travel?.logo_url ? (
              <img src={travel.logo_url} alt={travel.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <Building2 className="w-12 h-12" />
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold mb-2">{travel?.name || 'Travel Agent'}</h1>
            <p className="text-primary-foreground/80 max-w-2xl">{travel?.description || 'Agen perjalanan umroh terpercaya.'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm">
              {travel?.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {travel.address}
                </div>
              )}
              {travel?.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" /> {travel.phone}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {travel?.whatsapp && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <a href={`https://wa.me/${travel.whatsapp}`} target="_blank" rel="noreferrer">
                  <MessageSquare className="w-4 h-4 mr-2" /> Hubungi Kami
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Package Grid */}
      <main className="max-w-6xl mx-auto py-12 px-6">
        <h2 className="text-2xl font-bold mb-8">Paket Umroh & Haji</h2>
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard 
                key={pkg.id} 
                package={pkg} 
                onClick={() => navigate(`/paket/${pkg.id}`)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
            <p className="text-muted-foreground">Belum ada paket yang tersedia saat ini.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm font-medium mb-2">© {new Date().getFullYear()} {travel?.name}. All rights reserved.</p>
          {!settings.is_pro_active && (
            <p className="text-xs text-muted-foreground">
              Powered by <a href="https://umrohconnect.id" className="font-bold text-primary">Umroh Connect</a>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default AgentPublicProfile;
