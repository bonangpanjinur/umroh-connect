import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Pencil, Trash2, Upload, Loader2, Eye, EyeOff, Copy, 
  Lock, Unlock, Search, FileText, Image as ImageIcon, 
  Code, ExternalLink, Settings, Info, AlertCircle, Layout, Sparkles, Menu
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHtmlEditor } from './PageHtmlEditor';
import { VisualBlockBuilder } from '../blocks/VisualBlockBuilder';
import { SEOHelper } from '../blocks/SEOHelper';
import { NavigationManager } from './NavigationManager';
import { generatePageHTML } from '../blocks/BlockRenderers';
import { BlockData, DesignSettings, DEFAULT_DESIGN_SETTINGS } from '@/types/blocks';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  is_active: boolean;
  page_type: 'standard' | 'builder' | 'landing';
  layout_data: any;
  design_data: any;
  created_at: string;
  updated_at: string;
}

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image'],
    ['clean']
  ],
};

const RESERVED_SLUGS = [
  "admin", "auth", "login", "register", "agent", "dashboard",
  "profile", "settings", "api", "u", "p", "404", "offline", "kemitraan"
];

export const PagesManagement = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [showStandardPreview, setShowStandardPreview] = useState(false);
  const [mainTab, setMainTab] = useState('pages');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    image_url: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    is_active: true,
    page_type: 'standard' as 'standard' | 'builder' | 'landing',
  });
  
  const [htmlContent, setHtmlContent] = useState('');
  const [cssContent, setCssContent] = useState('');
  const [jsContent, setJsContent] = useState('');
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [designSettings, setDesignSettings] = useState<DesignSettings>(DEFAULT_DESIGN_SETTINGS);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('static_pages' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pages:', error);
        toast.error('Gagal memuat halaman');
        setPages([]);
        return;
      }

      setPages((data || []) as unknown as Page[]);
    } catch (err) {
      console.error('Error:', err);
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      image_url: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      is_active: true,
      page_type: 'standard',
    });
    setHtmlContent('');
    setCssContent('');
    setJsContent('');
    setBlocks([]);
    setDesignSettings(DEFAULT_DESIGN_SETTINGS);
    setEditingPage(null);
    setActiveTab('content');
    setIsSlugLocked(true);
    setShowStandardPreview(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: !editingPage && isSlugLocked ? generateSlug(title) : prev.slug,
    }));
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      image_url: page.image_url || '',
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      meta_keywords: page.meta_keywords || '',
      is_active: page.is_active,
      page_type: page.page_type || 'standard',
    });

    // Reset editor contents
    setHtmlContent('');
    setCssContent('');
    setJsContent('');
    setBlocks(page.layout_data || []);
    setDesignSettings(page.design_data || DEFAULT_DESIGN_SETTINGS);

    // Extract content if it's builder/landing type
    if ((page.page_type === 'builder' || page.page_type === 'landing') && page.content) {
      const styleMatch = page.content.match(/<style>([\s\S]*?)<\/style>/);
      const bodyMatch = page.content.match(/<body>([\s\S]*?)<script>/) || page.content.match(/<body>([\s\S]*?)<\/body>/);
      const jsMatch = page.content.match(/<script>([\s\S]*?)<\/script>/);
      
      if (styleMatch) setCssContent(styleMatch[1].trim());
      if (bodyMatch) setHtmlContent(bodyMatch[1].trim());
      if (jsMatch) setJsContent(jsMatch[1].trim());
    }

    setActiveTab('content');
    setIsSlugLocked(true);
    setIsDialogOpen(true);
    setShowStandardPreview(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `pages/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        image_url: data.publicUrl,
      }));
      toast.success('Gambar berhasil diunggah');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Gagal mengunggah gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const checkSlugUniqueness = async (slug: string, id?: string) => {
    if (!slug) return true;
    const { data, error } = await supabase
      .from('static_pages' as any)
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (error) return true;
    if (data && data.id !== id) return false;
    return true;
  };

  const validateSlug = (slug: string) => {
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
    
    if (RESERVED_SLUGS.includes(cleanSlug)) {
      toast.error(`Slug '${cleanSlug}' digunakan oleh sistem.`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error('Judul dan URL harus diisi');
      return;
    }

    if (!validateSlug(formData.slug)) {
      return;
    }

    setIsCheckingSlug(true);
    const isUnique = await checkSlugUniqueness(formData.slug, editingPage?.id);
    setIsCheckingSlug(false);

    if (!isUnique) {
      toast.error('URL (Slug) sudah digunakan oleh halaman lain');
      return;
    }

    let finalContent = formData.content;
    let layoutData = blocks;
    
    // If using builder, generate HTML from blocks
    if (formData.page_type === 'builder') {
      // Pass the actual blocks to ensure any last-minute changes are captured
      finalContent = generatePageHTML(blocks, formData.title, formData.meta_description || '', designSettings);
    } 
    // If using landing (manual HTML), combine HTML, CSS, and JavaScript
    else if (formData.page_type === 'landing' && (htmlContent || cssContent || jsContent)) {
      finalContent = `<!DOCTYPE html>
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
    }

    try {
      const pageData = {
        title: formData.title,
        slug: formData.slug,
        content: finalContent,
        image_url: formData.image_url,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        meta_keywords: formData.meta_keywords,
        is_active: formData.is_active,
        page_type: formData.page_type,
        layout_data: layoutData,
        design_data: designSettings,
      };

      if (editingPage) {
        const { error } = await supabase
          .from('static_pages' as any)
          .update(pageData)
          .eq('id', editingPage.id);

        if (error) throw error;
        
        // Phase 6: Versioning & Recovery
        // Save a snapshot to page_versions table
        try {
          const { data: userData } = await supabase.auth.getUser();
          await supabase.from('page_versions' as any).insert([{
            page_id: editingPage.id,
            content: finalContent,
            layout_data: layoutData,
            design_data: designSettings,
            version_name: `Versi ${new Date().toLocaleString('id-ID')}`,
            created_by: userData.user?.id
          }]);
        } catch (vError) {
          console.warn('Failed to save version snapshot:', vError);
        }
        
        toast.success('Halaman berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('static_pages' as any)
          .insert([pageData]);

        if (error) throw error;
        toast.success('Halaman berhasil dibuat');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPages();
    } catch (error: any) {
      console.error('Error saving page:', error);
      toast.error(error.message || 'Gagal menyimpan halaman');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus halaman ini?')) return;

    try {
      const { error } = await supabase
        .from('static_pages' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Halaman berhasil dihapus');
      fetchPages();
    } catch (error: any) {
      console.error('Error deleting page:', error);
      toast.error('Gagal menghapus halaman');
    }
  };

  const toggleActive = async (page: Page) => {
    try {
      const { error } = await supabase
        .from('static_pages' as any)
        .update({ is_active: !page.is_active })
        .eq('id', page.id);

      if (error) throw error;
      toast.success(page.is_active ? 'Halaman dinonaktifkan' : 'Halaman diaktifkan');
      fetchPages();
    } catch (error: any) {
      console.error('Error toggling active:', error);
      toast.error('Gagal mengubah status halaman');
    }
  };

  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCharCountColor = (count: number, min: number, max: number) => {
    if (count === 0) return 'text-muted-foreground';
    if (count >= min && count <= max) return 'text-green-600';
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-6">
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Manajemen Halaman
          </TabsTrigger>
          <TabsTrigger value="navigation" className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            Navigasi Menu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari halaman..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" /> Buat Halaman Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                      {editingPage ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      {editingPage ? 'Edit Halaman' : 'Buat Halaman Baru'}
                    </DialogTitle>
                  </DialogHeader>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="content" className="flex items-center gap-2">
                        <Layout className="h-4 w-4" /> Konten
                      </TabsTrigger>
                      <TabsTrigger value="seo" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> SEO & Meta
                      </TabsTrigger>
                      <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Pengaturan
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-6 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="title" className="text-base font-semibold">Judul Halaman</Label>
                            <Input
                              id="title"
                              placeholder="Contoh: Paket Umroh Ramadhan 2024"
                              className="text-lg h-12"
                              value={formData.title}
                              onChange={handleTitleChange}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-base font-semibold">Tipe Editor</Label>
                            <div className="grid grid-cols-3 gap-3">
                              <Button
                                type="button"
                                variant={formData.page_type === 'builder' ? 'default' : 'outline'}
                                className="flex flex-col h-auto py-3 gap-1"
                                onClick={() => setFormData(prev => ({ ...prev, page_type: 'builder' }))}
                              >
                                <Layout className="h-5 w-5" />
                                <span className="text-xs">Visual Builder</span>
                              </Button>
                              <Button
                                type="button"
                                variant={formData.page_type === 'standard' ? 'default' : 'outline'}
                                className="flex flex-col h-auto py-3 gap-1"
                                onClick={() => setFormData(prev => ({ ...prev, page_type: 'standard' }))}
                              >
                                <FileText className="h-5 w-5" />
                                <span className="text-xs">Rich Text</span>
                              </Button>
                              <Button
                                type="button"
                                variant={formData.page_type === 'landing' ? 'default' : 'outline'}
                                className="flex flex-col h-auto py-3 gap-1"
                                onClick={() => setFormData(prev => ({ ...prev, page_type: 'landing' }))}
                              >
                                <Code className="h-5 w-5" />
                                <span className="text-xs">Custom HTML</span>
                              </Button>
                            </div>
                          </div>

                          <div className="pt-4 border-t">
                            {formData.page_type === 'builder' ? (
                              <VisualBlockBuilder 
                                blocks={blocks} 
                                onBlocksChange={setBlocks}
                                designSettings={designSettings}
                                onDesignSettingsChange={setDesignSettings}
                                pageTitle={formData.title}
                                metaTitle={formData.meta_title}
                                metaDescription={formData.meta_description}
                                keywords={formData.meta_keywords}
                                onMetaTitleChange={(v) => setFormData(prev => ({ ...prev, meta_title: v }))}
                                onMetaDescriptionChange={(v) => setFormData(prev => ({ ...prev, meta_description: v }))}
                                onKeywordsChange={(v) => setFormData(prev => ({ ...prev, meta_keywords: v }))}
                              />
                            ) : formData.page_type === 'standard' ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-base font-semibold">Isi Konten</Label>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 gap-1 text-xs"
                                    onClick={() => setShowStandardPreview(!showStandardPreview)}
                                  >
                                    {showStandardPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    {showStandardPreview ? 'Tutup Preview' : 'Lihat Preview'}
                                  </Button>
                                </div>
                                
                                {showStandardPreview ? (
                                  <div className="border rounded-lg p-6 bg-white min-h-[400px] prose prose-sm max-w-none dark:prose-invert">
                                    <div dangerouslySetInnerHTML={{ __html: formData.content }} />
                                  </div>
                                ) : (
                                  <ReactQuill
                                    theme="snow"
                                    value={formData.content}
                                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                    modules={quillModules}
                                    className="h-[400px] mb-12"
                                  />
                                )}
                              </div>
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
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-4 p-4 bg-muted/30 rounded-xl border">
                            <Label className="text-base font-bold">Informasi Publikasi</Label>
                            
                            <div className="space-y-2">
                              <Label htmlFor="slug" className="flex items-center justify-between text-xs">
                                URL (Slug)
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  onClick={() => setIsSlugLocked(!isSlugLocked)}
                                >
                                  {isSlugLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                </Button>
                              </Label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">/</span>
                                <Input
                                  id="slug"
                                  placeholder="url-halaman"
                                  className="pl-6 h-9 text-sm"
                                  value={formData.slug}
                                  onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                                  disabled={isSlugLocked}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                              />
                              <Label htmlFor="is_active" className="text-sm">Publikasikan halaman</Label>
                            </div>
                          </div>

                          <div className="space-y-4 p-4 bg-muted/30 rounded-xl border">
                            <Label className="text-base font-bold">Thumbnail</Label>
                            {formData.image_url ? (
                              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group border">
                                <img
                                  src={formData.image_url}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-lg bg-muted/30 text-muted-foreground">
                                <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-xs font-medium">Belum ada thumbnail</p>
                              </div>
                            )}
                            
                            <div className="flex gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                                className="cursor-pointer text-xs h-9"
                              />
                              {isUploading && (
                                <Button disabled variant="outline" size="sm">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="seo" className="pt-4">
                      <SEOHelper 
                        pageTitle={formData.title}
                        metaTitle={formData.meta_title || ''}
                        metaDescription={formData.meta_description || ''}
                        keywords={formData.meta_keywords || ''}
                        onMetaTitleChange={(val) => setFormData(prev => ({ ...prev, meta_title: val }))}
                        onMetaDescriptionChange={(val) => setFormData(prev => ({ ...prev, meta_description: val }))}
                        onKeywordsChange={(val) => setFormData(prev => ({ ...prev, meta_keywords: val }))}
                      />
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Label className="text-base font-bold">Informasi Tambahan</Label>
                          <div className="p-4 border rounded-lg space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">ID Halaman:</span>
                              <span className="font-mono text-xs">{editingPage?.id || 'Baru'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Dibuat:</span>
                              <span>{editingPage ? new Date(editingPage.created_at).toLocaleDateString('id-ID') : '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Terakhir Diubah:</span>
                              <span>{editingPage ? new Date(editingPage.updated_at).toLocaleDateString('id-ID') : '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <DialogFooter className="mt-6 border-t pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleSave} disabled={isCheckingSlug}>
                      {isCheckingSlug ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Memeriksa...
                        </>
                      ) : (
                        editingPage ? 'Simpan Perubahan' : 'Buat Halaman'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Daftar Halaman
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Memuat data halaman...</p>
                </div>
              ) : filteredPages.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl">
                  <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium">Belum ada halaman</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mt-1">
                    Mulai buat halaman statis pertama Anda untuk memberikan informasi kepada pengguna.
                  </p>
                  <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="mt-6">
                    <Plus className="h-4 w-4 mr-2" /> Buat Halaman
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[300px]">Judul & URL</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Terakhir Diubah</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPages.map((page) => (
                        <TableRow key={page.id} className="group">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {page.title}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                  /{page.slug}
                                </code>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`https://arahumroh.id/${page.slug}`);
                                    toast.success('URL disalin');
                                  }}
                                >
                                  <Copy className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize font-normal">
                              {page.page_type === 'standard' ? 'Rich Text' : page.page_type === 'builder' ? 'Visual Builder' : 'Custom HTML'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div 
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={() => toggleActive(page)}
                            >
                              <Switch checked={page.is_active} />
                              <span className="text-xs text-muted-foreground">
                                {page.is_active ? 'Aktif' : 'Draft'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(page.updated_at).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(page)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(page.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <a href={`/${page.slug}`} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation">
          <NavigationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
