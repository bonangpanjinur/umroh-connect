import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const db = supabase as any;
import { WebsiteTemplate } from '@/types/database';
import { 
  Plus, Edit, Trash2, Check, Layout, 
  Loader2, Image as ImageIcon, Eye, Sparkles, 
  Monitor, Smartphone, Palette, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

import defaultPreview from '@/assets/templates/default-preview.jpg';
import goldLuxuryPreview from '@/assets/templates/gold-luxury-preview.jpg';

const TEMPLATE_PREVIEWS: Record<string, string> = {
  'default': defaultPreview,
  'gold-luxury': goldLuxuryPreview,
};

const TEMPLATE_FEATURES: Record<string, string[]> = {
  'default': [
    'Hero section modern dengan statistik',
    'Grid paket responsif',
    'Bagian fitur & keunggulan',
    'Statistik counter animasi',
    'Form kontak WhatsApp',
    'Footer dengan social media',
  ],
  'gold-luxury': [
    'Desain mewah gold & hitam',
    'Hero fullscreen sinematik',
    'Tipografi serif elegan',
    'Animasi diamond icon',
    'Testimonial quote section',
    'Branding VIP premium',
  ],
};

const WebsiteTemplatesManagement = () => {
  const [templates, setTemplates] = useState<WebsiteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<WebsiteTemplate> | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<WebsiteTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await db
        .from('website_templates')
        .select('*')
        .order('created_at', { ascending: true });
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
      const { error } = await db.from('website_templates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Template berhasil dihapus');
      fetchTemplates();
    } catch (error: any) {
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
      toast.error('Gagal mengubah status template');
    }
  };

  const getPreviewImage = (template: WebsiteTemplate) => {
    return TEMPLATE_PREVIEWS[template.slug] || template.thumbnail_url || null;
  };

  const getFeatures = (template: WebsiteTemplate) => {
    return TEMPLATE_FEATURES[template.slug] || [];
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            Manajemen Template Website
          </h2>
          <p className="text-muted-foreground mt-1">Kelola desain website yang tersedia untuk agent travel.</p>
        </div>
        <Button onClick={() => {
          setEditingTemplate({ is_active: true, is_premium: false });
          setIsModalOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Template
        </Button>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {templates.map((template) => {
          const preview = getPreviewImage(template);
          const features = getFeatures(template);

          return (
            <Card key={template.id} className="overflow-hidden border-2 hover:border-primary/30 transition-colors">
              {/* Preview Image */}
              <div className="relative aspect-video bg-muted group cursor-pointer" onClick={() => setPreviewTemplate(template)}>
                {preview ? (
                  <img src={preview} alt={template.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted to-muted/50">
                    <Layout className="w-16 h-16 text-muted-foreground/20" />
                    <span className="text-sm text-muted-foreground">Belum ada preview</span>
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Button size="sm" variant="secondary" className="rounded-full shadow-lg">
                    <Eye className="w-4 h-4 mr-2" /> Preview Detail
                  </Button>
                </div>

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {template.is_premium ? (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none shadow-md">
                      <Sparkles className="w-3 h-3 mr-1" /> Premium
                    </Badge>
                  ) : (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white border-none shadow-md">
                      <Star className="w-3 h-3 mr-1" /> Gratis
                    </Badge>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant={template.is_active ? 'default' : 'secondary'} className={template.is_active ? 'bg-primary shadow-md' : ''}>
                    {template.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description || 'Tidak ada deskripsi.'}
                    </CardDescription>
                  </div>
                  <code className="text-xs bg-muted px-2.5 py-1.5 rounded-md font-mono text-muted-foreground shrink-0">
                    {template.slug}
                  </code>
                </div>
              </CardHeader>

              {/* Features List */}
              {features.length > 0 && (
                <CardContent className="pt-0 pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              {/* Actions */}
              <CardFooter className="border-t pt-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={template.is_active} 
                    onCheckedChange={() => toggleActive(template)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {template.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingTemplate(template);
                    setIsModalOpen(true);
                  }}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
          <Layout className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">Belum ada template</p>
          <p className="text-sm text-muted-foreground mb-6">Tambahkan template pertama untuk agent.</p>
          <Button onClick={() => {
            setEditingTemplate({ is_active: true, is_premium: false });
            setIsModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Template
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {previewTemplate?.name}
              {previewTemplate?.is_premium && (
                <Badge className="bg-amber-500 text-white border-none">
                  <Sparkles className="w-3 h-3 mr-1" /> Premium
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-6">
              {/* Desktop Preview */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Preview Desktop</span>
                </div>
                <div className="border rounded-xl overflow-hidden shadow-lg">
                  {getPreviewImage(previewTemplate) ? (
                    <img src={getPreviewImage(previewTemplate)!} alt={previewTemplate.name} className="w-full" />
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              {getFeatures(previewTemplate).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Fitur Template</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {getFeatures(previewTemplate).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm p-2.5 bg-muted/50 rounded-lg">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <p className="text-2xl font-bold text-primary">
                    {previewTemplate.is_premium ? 'PRO' : 'FREE'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Tipe Akses</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <p className="text-2xl font-bold">
                    <Monitor className="w-6 h-6 mx-auto text-primary" />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Responsif</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <p className="text-2xl font-bold">
                    <Smartphone className="w-6 h-6 mx-auto text-primary" />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Mobile Ready</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingTemplate?.id ? 'Edit Template' : 'Tambah Template Baru'}</DialogTitle>
              <DialogDescription>Isi detail template di bawah ini.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
                <Textarea 
                  id="description" 
                  placeholder="Deskripsi singkat template..." 
                  value={editingTemplate?.description || ''} 
                  onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnail">URL Thumbnail (Opsional)</Label>
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
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Simpan Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebsiteTemplatesManagement;
