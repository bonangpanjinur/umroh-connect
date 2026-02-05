
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseUntyped as supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, Loader2
} from 'lucide-react';
import { PackageWithDetails, AgentWebsiteSettings } from '@/types/database';
import { motion } from 'framer-motion';
import TemplateRenderer from '@/components/public/TemplateRenderer';

const AgentPublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AgentWebsiteSettings | any>(null);
  const [travel, setTravel] = useState<any>(null);
  const [packages, setPackages] = useState<PackageWithDetails[]>([]);
  const [templateSlug, setTemplateSlug] = useState<string | null>('default');

  useEffect(() => {
    if (slug) {
      fetchAgentData();
    }
  }, [slug]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch settings by slug OR custom_slug (if approved)
      // Join with website_templates to get the slug
      const { data: settingsData, error: settingsError } = await supabase
        .from('agent_website_settings')
        .select('*, website_templates(slug)')
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
      
      // Set template slug from joined data
      if (settingsData.website_templates?.slug) {
        setTemplateSlug(settingsData.website_templates.slug);
      } else {
        setTemplateSlug('default');
      }

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

  // Render Custom HTML Mode (Legacy Page Builder)
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

  // Render via Template Renderer
  return (
    <TemplateRenderer 
      templateSlug={templateSlug} 
      data={{ settings, travel, packages }} 
    />
  );
};

export default AgentPublicProfile;
