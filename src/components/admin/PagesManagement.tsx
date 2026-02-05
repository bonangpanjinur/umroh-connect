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
  Code, ExternalLink, Settings, Info, AlertCircle, Layout
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHtmlEditor } from './PageHtmlEditor';
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

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error('Judul dan URL harus diisi');
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
    
    // If using builder/landing, combine HTML, CSS, and JavaScript
    if ((formData.page_type === 'builder' || formData.page_type === 'landing') && (htmlContent || cssContent || jsContent)) {
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
      };

      if (editingPage) {
        const { error } = await supabase
          .from('static_pages' as any)
          .update(pageData)
          .eq('id', editingPage.id);

        if (error) throw error;
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
      console.error('Error toggling page status:', error);
      toast.error('Gagal mengubah status halaman');
    }
  };

  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCharCountColor = (current: number, min: number, max: number) => {
    if (current === 0) return 'text-muted-foreground';
    if (current >= min && current <= max) return 'text-green-600';
    return 'text-amber-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Halaman</h2>
          <p className="text-muted-foreground">Kelola halaman statis dan landing page aplikasi</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Cari halaman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <div className="absolute left-2.5 top-2.5 text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="gap-2">
                <Plus className="h-4 w-4" />
                Halaman Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPage ? 'Edit Halaman' : 'Buat Halaman Baru'}</DialogTitle>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content" className="gap-2">
                    <Layout className="h-4 w-4" /> Editor Konten
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-2">
                    <Settings className="h-4 w-4" /> Pengaturan & SEO
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 mt-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-bold">Metode Editor</Label>
                        <Badge variant="secondary" className="font-normal">
                          {formData.page_type === 'standard' ? 'Visual Editor' : 'Code Builder'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Pilih tipe konten yang ingin Anda buat</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {formData.page_type === 'standard' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowStandardPreview(!showStandardPreview)}
                          className="gap-2"
                        >
                          {showStandardPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {showStandardPreview ? 'Tutup Preview' : 'Lihat Preview'}
                        </Button>
                      )}
                      <Select 
                        value={formData.page_type} 
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, page_type: value }))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Rich Text (Mudah)</SelectItem>
                          <SelectItem value="builder">HTML Builder (Custom)</SelectItem>
                          <SelectItem value="landing">Full Landing Page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {formData.page_type === 'standard' ? (
                      <div className="grid grid-cols-1 gap-4">
                        <div className={showStandardPreview ? 'hidden md:block' : 'block'}>
                          <div className="bg-white dark:bg-slate-950 rounded-md border min-h-[400px]">
                            <ReactQuill
                              theme="snow"
                              value={formData.content}
                              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                              modules={quillModules}
                              className="h-[350px] mb-12"
                            />
                          </div>
                        </div>
                        
                        {showStandardPreview && (
                          <div className="border rounded-lg bg-white dark:bg-slate-950 min-h-[400px] overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                  <div className="w-3 h-3 rounded-full bg-red-400" />
                                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                                  <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <span className="text-xs font-medium ml-2">Live Preview</span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setShowStandardPreview(false)}>
                                <EyeOff className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="p-8 max-h-[500px] overflow-y-auto">
                              <article className="prose prose-sm dark:prose-invert max-w-none">
                                <h1 className="text-3xl font-bold mb-4">{formData.title || 'Judul Halaman'}</h1>
                                {formData.image_url && (
                                  <img
                                    src={formData.image_url}
                                    alt={formData.title}
                                    className="w-full h-64 object-cover rounded-xl mb-8"
                                  />
                                )}
                                <div dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-muted-foreground italic">Belum ada konten...</p>' }} />
                              </article>
                            </div>
                          </div>
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
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-bold">Informasi Dasar</Label>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="title">Judul Halaman</Label>
                            <Input
                              id="title"
                              placeholder="Masukkan judul halaman"
                              value={formData.title}
                              onChange={handleTitleChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="slug" className="flex items-center justify-between">
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
                                className="pl-6"
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
                            <Label htmlFor="is_active">Publikasikan halaman ini</Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t">
                        <Label className="text-base font-bold">Thumbnail & Media</Label>
                        <div className="space-y-3">
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
                              className="cursor-pointer text-xs"
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

                    <div className="space-y-4">
                      <Label className="text-base font-bold">Optimasi SEO</Label>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-2">
                        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                          Informasi ini akan muncul di hasil pencarian Google dan saat halaman dibagikan di media sosial.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="meta_title" className="text-xs">Meta Title</Label>
                          <span className={`text-[10px] font-medium ${getCharCountColor(formData.meta_title?.length || 0, 50, 60)}`}>
                            {formData.meta_title?.length || 0}/60
                          </span>
                        </div>
                        <Input
                          id="meta_title"
                          placeholder="Judul untuk search engine"
                          value={formData.meta_title || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="meta_description" className="text-xs">Meta Description</Label>
                          <span className={`text-[10px] font-medium ${getCharCountColor(formData.meta_description?.length || 0, 150, 160)}`}>
                            {formData.meta_description?.length || 0}/160
                          </span>
                        </div>
                        <Textarea
                          id="meta_description"
                          placeholder="Deskripsi singkat untuk hasil pencarian"
                          rows={3}
                          value={formData.meta_description || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="meta_keywords" className="text-xs">Keywords</Label>
                        <Input
                          id="meta_keywords"
                          placeholder="umroh, paket hemat, travel"
                          value={formData.meta_keywords || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                          className="h-8 text-sm"
                        />
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
                          {page.page_type === 'standard' ? 'Rich Text' : page.page_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div 
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => toggleActive(page)}
                        >
                          <div className={`w-2 h-2 rounded-full ${page.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-300'}`} />
                          <span className="text-sm font-medium">
                            {page.is_active ? 'Aktif' : 'Draf'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(page.updated_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a href={`/page/${page.slug}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(page)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(page.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  );
};

export default PagesManagement;
