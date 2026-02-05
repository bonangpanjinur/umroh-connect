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
  Code, ExternalLink, Settings, Info, AlertCircle
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
    if (current < min) return 'text-amber-500';
    if (current <= max) return 'text-green-500';
    return 'text-destructive';
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPage ? 'Edit Halaman' : 'Buat Halaman Baru'}</DialogTitle>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="content" className="gap-2">
                    <FileText className="h-4 w-4" /> Konten
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="gap-2">
                    <Settings className="h-4 w-4" /> SEO
                  </TabsTrigger>
                  <TabsTrigger value="image" className="gap-2">
                    <ImageIcon className="h-4 w-4" /> Media
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="h-4 w-4" /> Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="flex gap-2">
                        <div className="relative flex-1">
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
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                    <div className="space-y-0.5">
                      <Label>Tipe Editor</Label>
                      <p className="text-xs text-muted-foreground">Pilih metode pembuatan konten</p>
                    </div>
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

                  <div className="space-y-2">
                    <Label>Konten Halaman</Label>
                    {formData.page_type === 'standard' ? (
                      <div className="bg-white dark:bg-slate-950 rounded-md border min-h-[300px]">
                        <ReactQuill
                          theme="snow"
                          value={formData.content}
                          onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                          modules={quillModules}
                          className="h-[250px] mb-12"
                        />
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

                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Aktifkan halaman ini</Label>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4 mt-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Optimalkan SEO agar halaman Anda lebih mudah ditemukan di mesin pencari seperti Google.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="meta_title">Meta Title</Label>
                      <span className={`text-xs font-medium ${getCharCountColor(formData.meta_title?.length || 0, 50, 60)}`}>
                        {formData.meta_title?.length || 0}/60
                      </span>
                    </div>
                    <Input
                      id="meta_title"
                      placeholder="Judul untuk search engine"
                      value={formData.meta_title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="meta_description">Meta Description</Label>
                      <span className={`text-xs font-medium ${getCharCountColor(formData.meta_description?.length || 0, 150, 160)}`}>
                        {formData.meta_description?.length || 0}/160
                      </span>
                    </div>
                    <Textarea
                      id="meta_description"
                      placeholder="Deskripsi singkat untuk hasil pencarian"
                      rows={4}
                      value={formData.meta_description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_keywords">Keywords</Label>
                    <Input
                      id="meta_keywords"
                      placeholder="umroh, paket hemat, travel (pisahkan dengan koma)"
                      value={formData.meta_keywords || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Thumbnail Halaman</Label>
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
                        <ImageIcon className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">Belum ada gambar terpilih</p>
                        <p className="text-xs mt-1">Disarankan ukuran 1200x630px</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="cursor-pointer"
                        />
                      </div>
                      {isUploading && (
                        <Button disabled variant="outline">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Proses...
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <div className="border rounded-lg bg-white dark:bg-slate-950 min-h-[400px] overflow-hidden">
                    <div className="bg-muted/50 p-2 border-b flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="bg-background text-[10px] px-3 py-1 rounded border flex-1 text-center truncate">
                        arahumroh.id/{formData.slug || 'url-halaman'}
                      </div>
                    </div>
                    <div className="p-6 max-h-[500px] overflow-y-auto">
                      {formData.page_type === 'standard' ? (
                        <article className="prose prose-sm dark:prose-invert max-w-none">
                          <h1 className="text-3xl font-bold mb-4">{formData.title || 'Judul Halaman'}</h1>
                          {formData.image_url && (
                            <img
                              src={formData.image_url}
                              alt={formData.title}
                              className="w-full h-48 object-cover rounded-lg mb-6"
                            />
                          )}
                          <div dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-muted-foreground italic">Konten kosong...</p>' }} />
                        </article>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                          <Code className="h-12 w-12 mb-4 opacity-20" />
                          <p>Preview untuk tipe HTML Builder tersedia di tab Konten.</p>
                        </div>
                      )}
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
            <div className="rounded-md border">
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
