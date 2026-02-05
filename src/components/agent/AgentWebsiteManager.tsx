import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Globe, Save, Sparkles, Layout, Megaphone, Lock, ExternalLink, 
  AlertCircle, CheckCircle, Palette, BookOpen, Share2, Copy, 
  Eye, Settings2, Rocket, Smartphone, Monitor, Clock, XCircle
} from 'lucide-react';
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
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');

  // Local state for editor
  const [htmlContent, setHtmlContent] = useState('');
  const [cssContent, setCssContent] = useState('');
  const [jsContent, setJsContent] = useState('');
  const [requestedSlug, setRequestedSlug] = useState('');

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
        setRequestedSlug(data.custom_slug || '');
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
          is_published: false,
          slug_status: 'pending'
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
    const styleMatch = fullHtml.match(/<style>([\s\S]*?)<\/style>/);
    const bodyMatch = fullHtml.match(/<body>([\s\S]*?)<script>/);
    const scriptMatch = fullHtml.match(/<script>([\s\S]*?)<\/script>/);

    if (styleMatch) setCssContent(styleMatch[1].trim());
    if (bodyMatch) setHtmlContent(bodyMatch[1].trim());
    if (scriptMatch) setJsContent(scriptMatch[1].trim());
    
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
        user_id: user.id,
        html_content: finalHtml,
        custom_slug: requestedSlug,
        updated_at: new Date().toISOString(),
      };

      // If slug is changed, it will be handled by the database trigger to set status to pending
      const { error } = await supabase
        .from('agent_website_settings')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Pengaturan berhasil disimpan');
      fetchSettings();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  if (loading) return (
    <div className="p-12 text-center space-y-6">
      <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      <p className="text-muted-foreground font-medium">Memuat konfigurasi website...</p>
    </div>
  );

  const websiteUrl = settings?.slug 
    ? `${window.location.origin}/${settings.slug}`
    : `${window.location.origin}/agent/${user?.id?.substring(0, 8)}`;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Website Saya</h2>
            <p className="text-sm text-muted-foreground">Kelola tampilan dan domain website Anda</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.open(websiteUrl, '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" /> Lihat Website
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
          <TabsTrigger value="config">Konfigurasi</TabsTrigger>
          <TabsTrigger value="editor">Editor Visual</TabsTrigger>
          <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* URL Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Custom URL (Slug)
                </CardTitle>
                <CardDescription>Ajukan URL unik untuk website Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">URL Saat Ini</Label>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono truncate">{websiteUrl}</code>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(websiteUrl)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="custom-slug">Request URL Baru</Label>
                    {settings?.custom_slug && getStatusBadge(settings.slug_status)}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">umroh.connect/</span>
                      <Input 
                        id="custom-slug"
                        placeholder="travel-anda" 
                        className="pl-[105px]"
                        value={requestedSlug}
                        onChange={(e) => setRequestedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    * Pengajuan URL memerlukan persetujuan admin. Status akan menjadi 'Pending' setelah disimpan.
                  </p>
                  {settings?.slug_status === 'rejected' && settings?.admin_notes && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                      <strong>Alasan Penolakan:</strong> {settings.admin_notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Builder Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layout className="h-5 w-5 text-primary" />
                  Mode Website
                </CardTitle>
                <CardDescription>Pilih cara Anda membangun website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-base">Gunakan Custom Builder</Label>
                    <p className="text-xs text-muted-foreground">Aktifkan untuk menggunakan editor HTML/CSS custom</p>
                  </div>
                  <Switch 
                    checked={settings?.is_builder_active} 
                    onCheckedChange={(checked) => setSettings({...settings, is_builder_active: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-base">Publikasikan Website</Label>
                    <p className="text-xs text-muted-foreground">Aktifkan agar website Anda dapat diakses oleh publik</p>
                  </div>
                  <Switch 
                    checked={settings?.is_published} 
                    onCheckedChange={(checked) => setSettings({...settings, is_published: checked})}
                  />
                </div>
                
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-blue-500 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-blue-900">Fitur Pro</p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Dapatkan akses ke template premium dan penghapusan branding Umroh Connect dengan berlangganan paket Pro.
                      </p>
                      <Button variant="link" className="p-0 h-auto text-xs text-blue-600 font-bold">Upgrade Sekarang →</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          {!settings?.is_builder_active ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-2">Editor Dinonaktifkan</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Aktifkan "Custom Builder" di tab Konfigurasi untuk mulai mendesain website Anda sendiri.
              </p>
              <Button onClick={() => setSettings({...settings, is_builder_active: true})}>Aktifkan Sekarang</Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Mobile/Desktop Switcher for Mobile View */}
              <div className="lg:hidden flex bg-secondary/50 p-1 rounded-xl self-center">
                <Button 
                  variant={activeView === 'edit' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="rounded-lg"
                  onClick={() => setActiveView('edit')}
                >
                  Edit
                </Button>
                <Button 
                  variant={activeView === 'preview' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="rounded-lg"
                  onClick={() => setActiveView('preview')}
                >
                  Preview
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
                {/* Editor Side */}
                <div className={cn("space-y-4", activeView === 'preview' && "hidden lg:block")}>
                  <Card className="h-full flex flex-col overflow-hidden border-none shadow-md">
                    <Tabs defaultValue="html" className="flex-1 flex flex-col">
                      <div className="bg-secondary/50 px-4 py-2 border-b border-border flex items-center justify-between">
                        <TabsList className="bg-transparent h-auto p-0 gap-4">
                          <TabsTrigger value="html" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-1 text-xs font-bold">HTML</TabsTrigger>
                          <TabsTrigger value="css" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-1 text-xs font-bold">CSS</TabsTrigger>
                          <TabsTrigger value="js" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-1 text-xs font-bold">JS</TabsTrigger>
                        </TabsList>
                        <Badge variant="outline" className="text-[10px] font-mono">Tailwind Enabled</Badge>
                      </div>
                      <div className="flex-1 bg-[#1e1e1e] p-0 overflow-hidden">
                        <TabsContent value="html" className="m-0 h-full">
                          <textarea 
                            className="w-full h-full bg-transparent text-gray-300 font-mono text-sm p-4 focus:outline-none resize-none"
                            value={htmlContent}
                            onChange={(e) => setHtmlContent(e.target.value)}
                            placeholder="<!-- Tulis HTML Anda di sini -->"
                          />
                        </TabsContent>
                        <TabsContent value="css" className="m-0 h-full">
                          <textarea 
                            className="w-full h-full bg-transparent text-gray-300 font-mono text-sm p-4 focus:outline-none resize-none"
                            value={cssContent}
                            onChange={(e) => setCssContent(e.target.value)}
                            placeholder="/* Tulis CSS custom di sini */"
                          />
                        </TabsContent>
                        <TabsContent value="js" className="m-0 h-full">
                          <textarea 
                            className="w-full h-full bg-transparent text-gray-300 font-mono text-sm p-4 focus:outline-none resize-none"
                            value={jsContent}
                            onChange={(e) => setJsContent(e.target.value)}
                            placeholder="// Tulis JavaScript custom di sini"
                          />
                        </TabsContent>
                      </div>
                    </Tabs>
                  </Card>
                </div>

                {/* Preview Side */}
                <div className={cn("space-y-4", activeView === 'edit' && "hidden lg:block")}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={previewMode === 'desktop' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setPreviewMode('desktop')}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={previewMode === 'mobile' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setPreviewMode('mobile')}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Live Preview</span>
                  </div>
                  
                  <div className={cn(
                    "bg-white rounded-2xl border border-border shadow-2xl overflow-hidden transition-all duration-500 mx-auto",
                    previewMode === 'mobile' ? "max-w-[375px] h-[667px]" : "w-full h-[600px]"
                  )}>
                    <iframe 
                      title="Website Preview"
                      className="w-full h-full border-none"
                      srcDoc={bundleContent()}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
