import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Save, Sparkles, Layout, Megaphone, Lock, ExternalLink, AlertCircle, CheckCircle, Palette, BookOpen } from 'lucide-react';
import { PageHtmlEditor } from '@/components/admin/PageHtmlEditor';
import { supabaseUntyped as supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAgentTravel } from '@/hooks/useAgentData';
import { toast } from 'sonner';

export const AgentWebsiteManager = () => {
  const { user } = useAuthContext();
  const { data: travel } = useAgentTravel();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Local state for editor
  const [htmlContent, setHtmlContent] = useState('');
  const [cssContent, setCssContent] = useState('');
  const [jsContent, setJsContent] = useState('');

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_website_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        // Parse bundled content if exists
        if (data.html_content) {
          extractBundledContent(data.html_content);
        }
      } else {
        // Default settings if none exist
        const defaultSettings = {
          user_id: user?.id,
          slug: `travel-${user?.id?.substring(0, 8)}`,
          is_builder_active: false,
          is_custom_url_active: false,
          is_pro_active: false,
        };
        setSettings(defaultSettings);
      }
    } catch (error: any) {
      toast.error('Gagal mengambil pengaturan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const extractBundledContent = (fullHtml: string) => {
    // Basic extraction logic (similar to how it was bundled)
    const styleMatch = fullHtml.match(/<style>([\s\S]*?)<\/style>/);
    const bodyMatch = fullHtml.match(/<body>([\s\S]*?)<script>/);
    const scriptMatch = fullHtml.match(/<script>([\s\S]*?)<\/script>/);

    if (styleMatch) setCssContent(styleMatch[1].trim());
    if (bodyMatch) setHtmlContent(bodyMatch[1].trim());
    if (scriptMatch) setJsContent(scriptMatch[1].trim());
    
    // Fallback if structure is different
    if (!bodyMatch) setHtmlContent(fullHtml);
  };

  const bundleContent = () => {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
${cssContent}
  </style>
</head>
<body>
${htmlContent}
<script>
${jsContent}
</script>
</body>
</html>`;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const finalHtml = settings.is_builder_active ? bundleContent() : null;
      
      const { error } = await supabase
        .from('agent_website_settings')
        .upsert({
          ...settings,
          html_content: finalHtml,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('Pengaturan berhasil disimpan');
    } catch (error: any) {
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-midtrans-token', {
        body: { 
          amount: 150000,
          transactionType: 'website_pro',
          itemDetails: [{ id: 'marketing_pro', price: 150000, name: 'Marketing Suite', quantity: 1 }] 
        }
      });
      
      if (error) throw error;
      
      // Handle Midtrans Snap (popup or redirect)
      if (data?.token) {
        // If Snap.js is available in window
        if ((window as any).snap) {
          (window as any).snap.pay(data.token);
        } else {
          // Fallback to sandbox/production redirect
          const isProduction = false; // Usually managed via env
          const snapUrl = isProduction 
            ? `https://app.midtrans.com/snap/v2/vtweb/${data.token}`
            : `https://app.sandbox.midtrans.com/snap/v2/vtweb/${data.token}`;
          window.open(snapUrl, '_blank');
        }
      } else {
        toast.info('Pembayaran dipicu, silakan cek email atau dashboard Midtrans Anda');
      }
    } catch (error: any) {
      toast.error('Gagal memproses pembayaran: ' + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat pengaturan...</div>;

  // Check if admin has approved custom URL
  const hasApprovedCustomUrl = travel?.is_custom_url_enabled_by_admin && travel?.admin_approved_slug;
  const websiteUrl = hasApprovedCustomUrl 
    ? `${window.location.origin}/agent/${travel.admin_approved_slug}`
    : `${window.location.origin}/agent/${settings?.slug || 'default'}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Website Agen
          </h2>
          <p className="text-muted-foreground">Kelola website white-label Anda</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Layout className="h-4 w-4" /> Konfigurasi
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Editor
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> Template
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Marketing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Domain & URL</CardTitle>
              <CardDescription>Lihat alamat website publik Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Website URL</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={websiteUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button variant="outline" asChild>
                    <a href={websiteUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>

                {hasApprovedCustomUrl ? (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-700">
                      <p className="font-semibold">URL Kustom Disetujui Admin</p>
                      <p className="text-xs opacity-90">Admin telah menyetujui URL kustom untuk website Anda. Anda tidak dapat mengubahnya.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                      <p className="font-semibold">URL Kustom Belum Disetujui</p>
                      <p className="text-xs opacity-90">Hubungi admin untuk meminta persetujuan URL kustom untuk website Anda.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-3">
                <Label>Metode Tampilan</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={!settings.is_builder_active ? 'default' : 'outline'}
                    className="flex flex-col h-auto py-4 gap-2"
                    onClick={() => setSettings({ ...settings, is_builder_active: false })}
                  >
                    <Layout className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-bold text-sm">Template Otomatis</p>
                      <p className="text-[10px] opacity-80">Banner + Grid Paket</p>
                    </div>
                  </Button>
                  <Button
                    variant={settings.is_builder_active ? 'default' : 'outline'}
                    className="flex flex-col h-auto py-4 gap-2"
                    onClick={() => setSettings({ ...settings, is_builder_active: true })}
                  >
                    <Sparkles className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-bold text-sm">Custom HTML</p>
                      <p className="text-[10px] opacity-80">Desain bebas & kreatif</p>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="pt-4">
          {!settings.is_builder_active ? (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto border shadow-sm">
                  <Layout className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="max-w-xs mx-auto">
                  <h3 className="font-bold">Mode Template Aktif</h3>
                  <p className="text-sm text-muted-foreground">
                    Website Anda saat ini menggunakan template standar yang menampilkan banner travel dan daftar paket umroh Anda secara otomatis.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setSettings({ ...settings, is_builder_active: true })}>
                  Pindah ke Custom HTML
                </Button>
              </CardContent>
            </Card>
          ) : (
            <PageHtmlEditor
              html={htmlContent}
              css={cssContent}
              javascript={jsContent}
              onHtmlChange={setHtmlContent}
              onCssChange={setCssContent}
              onJavaScriptChange={setJsContent}
            />
          )}
        </TabsContent>

            <TabsContent value="templates" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Website</CardTitle>
              <CardDescription>Pilih tampilan website yang sesuai dengan brand travel Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'modern', name: 'Modern Clean', desc: 'Tampilan bersih dengan fokus pada gambar paket.', color: 'bg-blue-500' },
                  { id: 'elegant', name: 'Elegant Gold', desc: 'Nuansa premium dengan aksen emas dan font serif.', color: 'bg-amber-600' },
                  { id: 'vibrant', name: 'Vibrant Green', desc: 'Segar dan energik, cocok untuk target jamaah muda.', color: 'bg-emerald-500' },
                  { id: 'minimal', name: 'Minimalist', desc: 'Sangat sederhana, mengutamakan kemudahan navigasi.', color: 'bg-slate-700' }
                ].map((tpl) => (
                  <div 
                    key={tpl.id}
                    className={cn(
                      "group relative border rounded-xl p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md",
                      settings?.template_id === tpl.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                    onClick={() => setSettings({ ...settings, template_id: tpl.id, is_builder_active: false })}
                  >
                    <div className="flex gap-4 items-center">
                      <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center text-white", tpl.color)}>
                        <Layout className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{tpl.name}</h4>
                        <p className="text-xs text-muted-foreground">{tpl.desc}</p>
                      </div>
                      {settings?.template_id === tpl.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-dashed">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Panduan Kustomisasi</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ingin tampilan yang benar-benar unik? Gunakan <strong>Editor HTML</strong> untuk memasukkan kode kustom Anda sendiri. Kami mendukung Tailwind CSS untuk kemudahan styling.
                    </p>
                    <Button variant="link" className="h-auto p-0 text-xs mt-2" asChild>
                      <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Dokumentasi sedang disiapkan'); }}>
                        Baca dokumentasi editor &rarr;
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="pt-4">
          <Card><Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Marketing Tools
                {!settings.is_pro_active && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Premium Only
                  </span>
                )}
              </CardTitle>
              <CardDescription>Integrasi tracking dan optimasi SEO</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pixel">Facebook Pixel ID</Label>
                <Input
                  id="pixel"
                  placeholder="Contoh: 1234567890"
                  value={settings.fb_pixel_id || ''}
                  onChange={(e) => setSettings({ ...settings, fb_pixel_id: e.target.value })}
                  disabled={!settings.is_pro_active}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m_title">SEO Title</Label>
                <Input
                  id="m_title"
                  placeholder="Judul saat link dibagikan"
                  value={settings.meta_title || ''}
                  onChange={(e) => setSettings({ ...settings, meta_title: e.target.value })}
                  disabled={!settings.is_pro_active}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m_desc">SEO Description</Label>
                <Input
                  id="m_desc"
                  placeholder="Deskripsi singkat untuk Google/WhatsApp"
                  value={settings.meta_description || ''}
                  onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
                  disabled={!settings.is_pro_active}
                />
              </div>

              {!settings.is_pro_active && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">Buka Fitur Premium</p>
                      <p className="text-xs text-amber-700">
                        Dapatkan akses ke Facebook Pixel, Custom SEO, dan hapus branding "Powered by Umroh Connect" hanya dengan Rp 150.000.
                      </p>
                    </div>
                  </div>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={handleUpgrade}>
                    Upgrade Sekarang
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
