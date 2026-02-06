
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Use untyped supabase for website_templates (not in generated types)
const db = supabase as any;
import { WebsiteTemplate } from '@/types/database';
import { 
  Plus, Edit, Trash2, Check, X, Layout, 
  Loader2, AlertCircle, Image as ImageIcon, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const WebsiteTemplatesManagement = () => {
  const [templates, setTemplates] = useState<WebsiteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<WebsiteTemplate> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await db
        .from('website_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast.error('Gagal memuat daftar template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate?.name || !editingTemplate?.slug) {
      toast.error('Nama dan Slug wajib diisi');
      return;
    }

    try {
      setSaving(true);
      if (editingTemplate.id) {
        // Update
        const { error } = await db
          .from('website_templates')
          .update({
            name: editingTemplate.name,
            slug: editingTemplate.slug,
            description: editingTemplate.description,
            thumbnail_url: editingTemplate.thumbnail_url,
            is_premium: editingTemplate.is_premium,
            is_active: editingTemplate.is_active,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template berhasil diperbarui');
      } else {
        // Create
        const { error } = await db
          .from('website_templates')
          .insert([editingTemplate]);

        if (error) throw error;
        toast.success('Template baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || 'Gagal menyimpan template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return;

    try {
      const { error } = await db
        .from('website_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template berhasil dihapus');
      fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Gagal menghapus template');
    }
  };

  const toggleActive = async (template: WebsiteTemplate) => {
    try {
      const { error } = await db
        .from('website_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      setTemplates(templates.map(t => t.id === template.id ? { ...t, is_active: !t.is_active } : t));
      toast.success(`Template ${!template.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast.error('Gagal mengubah status template');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat data template...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Template Website</h2>
          <p className="text-muted-foreground">Kelola desain website yang tersedia untuk para agent.</p>
        </div>
        <Button onClick={() => {
          setEditingTemplate({ is_active: true, is_premium: false });
          setIsModalOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden flex flex-col">
            <div className="aspect-video bg-muted relative group">
              {template.thumbnail_url ? (
                <img 
                  src={template.thumbnail_url} 
                  alt={template.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                {template.is_premium && (
                  <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Premium</Badge>
                )}
                <Badge variant={template.is_active ? "success" : "secondary" as any}>
                  {template.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{template.name}</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{template.slug}</code>
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {template.description || 'Tidak ada deskripsi.'}
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto pt-4 border-t flex justify-between gap-2">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={template.is_active} 
                  onCheckedChange={() => toggleActive(template)}
                />
                <span className="text-xs text-muted-foreground">Status</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => {
                  setEditingTemplate(template);
                  setIsModalOpen(true);
                }}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
          <Layout className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Belum ada template yang ditambahkan.</p>
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <form onSubmit={handleSave}>
              <CardHeader>
                <CardTitle>{editingTemplate?.id ? 'Edit Template' : 'Tambah Template Baru'}</CardTitle>
                <CardDescription>Isi detail template di bawah ini.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Template</Label>
                  <Input 
                    id="name" 
                    placeholder="Contoh: Gold Luxury" 
                    value={editingTemplate?.name || ''} 
                    onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (ID Kodingan)</Label>
                  <Input 
                    id="slug" 
                    placeholder="Contoh: gold-luxury" 
                    value={editingTemplate?.slug || ''} 
                    onChange={e => setEditingTemplate({...editingTemplate, slug: e.target.value})}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Slug harus unik dan sesuai dengan yang didefinisikan di TemplateRenderer.tsx</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Input 
                    id="description" 
                    placeholder="Deskripsi singkat template..." 
                    value={editingTemplate?.description || ''} 
                    onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">URL Thumbnail</Label>
                  <Input 
                    id="thumbnail" 
                    placeholder="https://..." 
                    value={editingTemplate?.thumbnail_url || ''} 
                    onChange={e => setEditingTemplate({...editingTemplate, thumbnail_url: e.target.value})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Template Premium</Label>
                    <p className="text-xs text-muted-foreground">Hanya tersedia untuk agent dengan paket PRO.</p>
                  </div>
                  <Switch 
                    checked={editingTemplate?.is_premium || false} 
                    onCheckedChange={checked => setEditingTemplate({...editingTemplate, is_premium: checked})}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t pt-6">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Simpan Template
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WebsiteTemplatesManagement;
