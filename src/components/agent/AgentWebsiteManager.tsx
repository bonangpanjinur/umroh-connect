import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Save, Sparkles, Layout, Megaphone, Lock, ExternalLink, AlertCircle, CheckCircle, Palette, BookOpen, Share2, Copy, Eye, Settings2, Rocket } from 'lucide-react';
import { PageHtmlEditor } from '@/components/admin/PageHtmlEditor';
import { supabaseUntyped as supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAgentTravel } from '@/hooks/useAgentData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

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
      console.error('Fetch settings error:', error);
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
    if (!user?.id) return;
    
    try {
      setSaving(true);
      const finalHtml = settings.is_builder_active ? bundleContent() : (settings.html_content || null);
      
      const payload = {
        ...settings,
        user_id: user.id, // Ensure user_id is set
        html_content: finalHtml,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('agent_website_settings')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Pengaturan berhasil disimpan');
      fetchSettings(); // Refresh to get latest data
    } catch (error: any) {
      console.error('Save settings error:', error);
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL disalin ke clipboard');
  };

  if (loading) return (
    <div className="p-12 text-center space-y-6">
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
        <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full" />
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">Memuat konfigurasi website...</p>
    </div>
  );

  if (!settings && !loading) return (
    <div className="p-12 text-center space-y-6 max-w-md mx-auto">
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="w-10 h-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <p className="text-xl font-bold">Gagal memuat pengaturan</p>
        <p className="text-muted-foreground">Terjadi kesalahan saat mengambil data dari server. Pastikan koneksi internet Anda stabil.</p>
      </div>
      <Button size="lg" className="w-full" onClick={fetchSettings}>Coba Lagi</Button>
    </div>
  );

  // Check if admin has approved custom URL
  const hasApprovedCustomUrl = travel?.is_custom_url_enabled_by_admin && travel?.admin_approved_slug;
  const websiteUrl = hasApprovedCustomUrl 
    ? `${window.location.origin}/agent/${travel.admin_approved_slug}`
    : `${window.location.origin}/agent/${settings?.slug || 'default'}`;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/5 to-secondary/5 p-6 rounded-3xl border border-border">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Website Agen</h2>
            <p className="text-sm text-muted-foreground">Kelola website white-label & branding Anda</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" className="rounded-xl" asChild>
            <a href={websiteUrl} target="_blank" rel="noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Pratinjau
            </a>
          </Button>
          <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-secondary/30 rounded-2xl mb-8">
          <TabsTrigger value="config" className="rounded-xl py-3 flex items-center gap-2 data-[state=active]:shadow-md">
            <Settings2 className="h-4 w-4" /> 
            <span className="hidden sm:inline">Konfigurasi</span>
          </TabsTrigger>
          <TabsTrigger value="editor" className="rounded-xl py-3 flex items-center gap-2 data-[state=active]:shadow-md">
            <Sparkles className="h-4 w-4" /> 
            <span className="hidden sm:inline">Editor HTML</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-xl py-3 flex items-center gap-2 data-[state=active]:shadow-md">
            <Palette className="h-4 w-4" /> 
            <span className="hidden sm:inline">Template</span>
          </TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-xl py-3 flex items-center gap-2 data-[state=active]:shadow-md">
            <Megaphone className="h-4 w-4" /> 
            <span className="hidden sm:inline">Marketing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-3xl overflow-hidden border-border shadow-sm">
              <CardHeader className="bg-secondary/10 pb-6">
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Domain & Akses
                </CardTitle>
                <CardDescription>Atur bagaimana pelanggan mengakses website Anda</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="space-y-4">
                  <Label className="text-base font-bold">Alamat Website Anda</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative group">
                      <Input
                        value={websiteUrl}
                        readOnly
                        className="font-mono text-sm h-12 bg-secondary/20 border-none rounded-xl pr-10"
                      />
                      <Globe className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="h-12 rounded-xl px-6" onClick={() => copyToClipboard(websiteUrl)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Salin
                      </Button>
                      <Button variant="outline" className="h-12 w-12 rounded-xl p-0" asChild>
                        <a href={websiteUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  {hasApprovedCustomUrl ? (
                    <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                      <div className="p-2 bg-green-500/20 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-sm">
                        <p className="font-bold text-green-800">URL Kustom Aktif</p>
                        <p className="text-green-700/80 leading-relaxed">Admin telah menyetujui branding eksklusif untuk website Anda. URL ini sekarang menjadi identitas digital travel Anda.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                      <div className="p-2 bg-amber-500/20 rounded-full">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="text-sm">
                        <p className="font-bold text-amber-800">Gunakan URL Kustom?</p>
                        <p className="text-amber-700/80 leading-relaxed">Anda masih menggunakan URL default. Upgrade ke Premium atau hubungi admin untuk mendapatkan URL branding khusus (contoh: arahumroh.com/travel-anda).</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-bold">Metode Tampilan</Label>
                      <p className="text-xs text-muted-foreground">Pilih bagaimana konten website Anda ditampilkan</p>
                    </div>
                    <Badge variant={settings.is_builder_active ? "default" : "secondary"} className="rounded-full px-4 py-1">
                      {settings.is_builder_active ? "Custom HTML Mode" : "Template Mode"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, is_builder_active: false })}
                      className={cn(
                        "flex flex-col items-start p-6 rounded-2xl border-2 transition-all text-left group",
                        !settings.is_builder_active 
                          ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20" 
                          : "border-border bg-background hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-xl mb-4 transition-colors",
                        !settings.is_builder_active ? "bg-primary text-white" : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        <Layout className="h-6 w-6" />
                      </div>
                      <p className="font-black text-sm mb-1">Template Otomatis</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Banner standar, grid paket otomatis, dan integrasi chat langsung.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, is_builder_active: true })}
                      className={cn(
                        "flex flex-col items-start p-6 rounded-2xl border-2 transition-all text-left group",
                        settings.is_builder_active 
                          ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20" 
                          : "border-border bg-background hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-xl mb-4 transition-colors",
                        settings.is_builder_active ? "bg-primary text-white" : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <p className="font-black text-sm mb-1">Custom HTML Builder</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Kebebasan penuh untuk mendesain landing page unik dengan HTML/CSS/JS.</p>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border shadow-sm overflow-hidden h-fit">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg">SEO & Metadata</CardTitle>
                <CardDescription>Optimasi mesin pencari (Google)</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label>Judul Halaman (Meta Title)</Label>
                  <Input 
                    placeholder="Contoh: Travel Umroh Terpercaya - Jakarta" 
                    value={settings.meta_title || ''}
                    onChange={(e) => setSettings({...settings, meta_title: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi (Meta Description)</Label>
                  <textarea 
                    className="w-full min-h-[120px] rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Deskripsikan travel Anda untuk hasil pencarian Google..."
                    value={settings.meta_description || ''}
                    onChange={(e) => setSettings({...settings, meta_description: e.target.value})}
                  />
                </div>
                <div className="p-4 bg-secondary/20 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <Eye className="h-3 w-3" />
                    Preview Google
                  </div>
                  <div className="space-y-1">
                    <p className="text-blue-600 text-base font-medium hover:underline cursor-pointer truncate">
                      {settings.meta_title || 'Judul Website Anda'}
                    </p>
                    <p className="text-green-700 text-xs truncate">{websiteUrl}</p>
                    <p className="text-muted-foreground text-xs line-clamp-2">
                      {settings.meta_description || 'Tambahkan deskripsi untuk melihat bagaimana website Anda muncul di hasil pencarian Google.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="editor" className="focus-visible:outline-none">
          <Card className="rounded-3xl border-border shadow-lg overflow-hidden border-2 border-primary/10">
            {!settings.is_builder_active && (
              <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8 text-amber-600" />
                </div>
                <h4 className="text-xl font-black mb-2">Editor Terkunci</h4>
                <p className="text-muted-foreground max-w-xs mb-6">Aktifkan "Custom HTML Mode" di tab Konfigurasi untuk menggunakan editor ini.</p>
                <Button onClick={() => setSettings({...settings, is_builder_active: true})} className="rounded-xl">
                  Aktifkan Sekarang
                </Button>
              </div>
            )}
            <CardHeader className="flex flex-row items-center justify-between bg-secondary/20 border-b">
              <div>
                <CardTitle>HTML/Tailwind Editor</CardTitle>
                <CardDescription>Gunakan Tailwind CSS untuk desain responsif yang cepat</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background">Tailwind CSS v3.4</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <PageHtmlEditor 
                html={htmlContent}
                css={cssContent}
                js={jsContent}
                onChange={(h, c, j) => {
                  setHtmlContent(h);
                  setCssContent(c);
                  setJsContent(j);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="group overflow-hidden rounded-3xl border-border hover:border-primary/50 transition-all cursor-pointer">
                <div className="aspect-video bg-secondary/50 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm z-10">
                    <Button variant="secondary" className="rounded-full font-bold">Gunakan Template</Button>
                  </div>
                  <div className="p-8 flex flex-col gap-4">
                    <div className="w-full h-4 bg-secondary rounded-full animate-pulse" />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-20 bg-secondary rounded-xl animate-pulse" />
                      <div className="h-20 bg-secondary rounded-xl animate-pulse" />
                      <div className="h-20 bg-secondary rounded-xl animate-pulse" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-lg">Template Modern {i}</h4>
                    {i === 1 && <Badge className="bg-primary">Default</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">Desain bersih dengan fokus pada paket unggulan dan konversi tinggi.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-3xl border-border shadow-sm">
              <CardHeader className="bg-[#1877F2]/10">
                <CardTitle className="flex items-center gap-2 text-[#1877F2]">
                  <Share2 className="h-5 w-5" />
                  Facebook Pixel
                </CardTitle>
                <CardDescription>Lacak konversi iklan Facebook & Instagram</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="space-y-2">
                  <Label>Pixel ID</Label>
                  <Input 
                    placeholder="Contoh: 123456789012345" 
                    value={settings.fb_pixel_id || ''}
                    onChange={(e) => setSettings({...settings, fb_pixel_id: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                  <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Pixel ID memungkinkan Anda untuk melacak pengunjung website dan mengoptimalkan biaya iklan Anda melalui Meta Ads Manager.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border shadow-sm">
              <CardHeader className="bg-green-500/10">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <MessageSquare className="h-5 w-5" />
                  WhatsApp Marketing
                </CardTitle>
                <CardDescription>Integrasi tombol chat langsung</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Floating Button</p>
                    <p className="text-xs text-muted-foreground">Tampilkan tombol WA melayang</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Pesan Otomatis (Default Message)</Label>
                  <textarea 
                    className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Halo, saya ingin bertanya tentang paket umroh..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
