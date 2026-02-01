import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Upload, Loader2, Eye, EyeOff, Copy, Lock, Unlock, Search, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

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
  });

  const fetchPages = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pages:', error);
      toast.error('Gagal memuat halaman');
      return;
    }

    setPages(data || []);
    setIsLoading(false);
  };

  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    });
    setEditingPage(null);
    setActiveTab('content');
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
      slug: !editingPage ? generateSlug(title) : prev.slug,
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
    });
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
        .from('page-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('page-images')
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

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error('Judul dan URL harus diisi');
      return;
    }

    try {
      if (editingPage) {
        // Update existing page
        const { error } = await supabase
          .from('pages')
          .update({
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            image_url: formData.image_url,
            meta_title: formData.meta_title,
            meta_description: formData.meta_description,
            meta_keywords: formData.meta_keywords,
            is_active: formData.is_active,
          })
          .eq('id', editingPage.id);

        if (error) throw error;
        toast.success('Halaman berhasil diperbarui');
      } else {
        // Create new page
        const { error } = await supabase
          .from('pages')
          .insert([{
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            image_url: formData.image_url,
            meta_title: formData.meta_title,
            meta_description: formData.meta_description,
            meta_keywords: formData.meta_keywords,
            is_active: formData.is_active,
          }]);

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
        .from('pages')
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
        .from('pages')
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

  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    toast.success('URL disalin ke clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Halaman</h2>
          <p className="text-muted-foreground">Kelola halaman statis aplikasi</p>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-search"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="gap-2">
              <Plus className="h-4 w-4" />
              Buat Halaman Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPage ? 'Edit Halaman' : 'Buat Halaman Baru'}
              </DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Konten</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="image">Gambar</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Halaman *</Label>
                  <Input
                    id="title"
                    placeholder="Masukkan judul halaman"
                    value={formData.title}
                    onChange={handleTitleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Halaman *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      placeholder="halaman-url"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        slug: generateSlug(e.target.value),
                      }))}
                      disabled={editingPage && isSlugLocked}
                    />
                    {editingPage && (
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => setIsSlugLocked(!isSlugLocked)}
                        title={isSlugLocked ? "Buka kunci URL" : "Kunci URL"}
                      >
                        {isSlugLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => copySlug(formData.slug)}
                      title="Salin URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    URL halaman akan menjadi: /{formData.slug}
                    {editingPage && !isSlugLocked && (
                      <span className="text-destructive block mt-1 font-medium">
                        Peringatan: Mengubah URL dapat merusak link yang sudah ada!
                      </span>
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Konten Halaman</Label>
                  <Textarea
                    id="content"
                    placeholder="Masukkan konten halaman (mendukung HTML)"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      content: e.target.value,
                    }))}
                    rows={8}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Aktifkan Halaman</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      is_active: checked,
                    }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    placeholder="Judul untuk search engine (50-60 karakter)"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      meta_title: e.target.value,
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.meta_title.length}/60 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    placeholder="Deskripsi untuk search engine (150-160 karakter)"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      meta_description: e.target.value,
                    }))}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.meta_description.length}/160 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_keywords">Meta Keywords</Label>
                  <Input
                    id="meta_keywords"
                    placeholder="Kata kunci dipisahkan dengan koma"
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      meta_keywords: e.target.value,
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Contoh: umroh, haji, panduan
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Gambar Halaman</Label>
                  {formData.image_url ? (
                    <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden group">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus Gambar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-muted/50 text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-sm">Belum ada gambar</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="cursor-pointer"
                      />
                    </label>
                    {isUploading && (
                      <Button disabled>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Mengunggah...
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-lg p-6 bg-card min-h-[300px] max-h-[500px] overflow-y-auto">
                  <h1 className="text-3xl font-bold mb-4">{formData.title || 'Judul Halaman'}</h1>
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt={formData.title}
                      className="w-full aspect-video object-cover rounded-lg mb-6"
                    />
                  )}
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-muted-foreground italic">Belum ada konten...</p>' }}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSave}>
                {editingPage ? 'Perbarui' : 'Buat'} Halaman
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : pages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada halaman. Buat halaman baru untuk memulai.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Halaman ({pages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead>Judul</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Terakhir Diperbarui</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Tidak ada halaman yang ditemukan untuk "{searchQuery}"
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">{page.title}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          /{page.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={page.is_active}
                            onCheckedChange={() => toggleActive(page)}
                          />
                          <Badge variant={page.is_active ? "default" : "secondary"}>
                            {page.is_active ? 'Aktif' : 'Draft'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(page.updated_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(page)}
                            title={page.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {page.is_active ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(page)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};
