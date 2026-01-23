import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Upload, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAllPrayerCategories,
  useAllPrayers,
  useCreatePrayerCategory,
  useUpdatePrayerCategory,
  useDeletePrayerCategory,
  useCreatePrayer,
  useUpdatePrayer,
  useDeletePrayer,
  useUploadPrayerAudio,
  PrayerCategory,
  Prayer
} from '@/hooks/usePrayers';

export const PrayersManagement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kelola Doa</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="prayers">
          <TabsList className="mb-4">
            <TabsTrigger value="prayers">Doa</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
          </TabsList>
          
          <TabsContent value="prayers">
            <PrayersTab />
          </TabsContent>
          
          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Prayers Tab
const PrayersTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);
  
  const { data: prayers, isLoading } = useAllPrayers();
  const { data: categories } = useAllPrayerCategories();
  const createPrayer = useCreatePrayer();
  const updatePrayer = useUpdatePrayer();
  const deletePrayer = useDeletePrayer();
  const uploadAudio = useUploadPrayerAudio();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      title: formData.get('title') as string,
      title_arabic: formData.get('title_arabic') as string || null,
      arabic_text: formData.get('arabic_text') as string,
      transliteration: formData.get('transliteration') as string || null,
      translation: formData.get('translation') as string || null,
      source: formData.get('source') as string || null,
      benefits: formData.get('benefits') as string || null,
      category_id: formData.get('category_id') as string || null,
      priority: parseInt(formData.get('priority') as string) || 0,
      is_active: formData.get('is_active') === 'on',
      audio_url: editingPrayer?.audio_url || null
    };

    // Handle audio upload
    const audioFile = (e.currentTarget.elements.namedItem('audio') as HTMLInputElement)?.files?.[0];
    
    if (editingPrayer) {
      if (audioFile) {
        const audioUrl = await uploadAudio.mutateAsync({ file: audioFile, prayerId: editingPrayer.id });
        data.audio_url = audioUrl;
      }
      await updatePrayer.mutateAsync({ id: editingPrayer.id, ...data });
    } else {
      const newPrayer = await createPrayer.mutateAsync(data);
      if (audioFile) {
        const audioUrl = await uploadAudio.mutateAsync({ file: audioFile, prayerId: newPrayer.id });
        await updatePrayer.mutateAsync({ id: newPrayer.id, audio_url: audioUrl });
      }
    }

    setIsDialogOpen(false);
    setEditingPrayer(null);
  };

  const handleEdit = (prayer: Prayer) => {
    setEditingPrayer(prayer);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus doa ini?')) {
      await deletePrayer.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingPrayer(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Doa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPrayer ? 'Edit Doa' : 'Tambah Doa Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Judul</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    defaultValue={editingPrayer?.title}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="title_arabic">Judul Arab</Label>
                  <Input 
                    id="title_arabic" 
                    name="title_arabic" 
                    defaultValue={editingPrayer?.title_arabic || ''}
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="arabic_text">Teks Arab</Label>
                <Textarea 
                  id="arabic_text" 
                  name="arabic_text" 
                  defaultValue={editingPrayer?.arabic_text}
                  dir="rtl"
                  className="font-arabic text-lg"
                  required 
                />
              </div>

              <div>
                <Label htmlFor="transliteration">Transliterasi</Label>
                <Textarea 
                  id="transliteration" 
                  name="transliteration" 
                  defaultValue={editingPrayer?.transliteration || ''}
                />
              </div>

              <div>
                <Label htmlFor="translation">Terjemahan</Label>
                <Textarea 
                  id="translation" 
                  name="translation" 
                  defaultValue={editingPrayer?.translation || ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Sumber</Label>
                  <Input 
                    id="source" 
                    name="source" 
                    defaultValue={editingPrayer?.source || ''}
                    placeholder="HR. Bukhari, dll"
                  />
                </div>
                <div>
                  <Label htmlFor="category_id">Kategori</Label>
                  <Select name="category_id" defaultValue={editingPrayer?.category_id || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="benefits">Keutamaan</Label>
                <Textarea 
                  id="benefits" 
                  name="benefits" 
                  defaultValue={editingPrayer?.benefits || ''}
                />
              </div>

              <div>
                <Label htmlFor="audio">Audio Doa</Label>
                <Input 
                  id="audio" 
                  name="audio" 
                  type="file"
                  accept="audio/*"
                />
                {editingPrayer?.audio_url && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Audio sudah ada. Upload baru untuk mengganti.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Prioritas</Label>
                  <Input 
                    id="priority" 
                    name="priority" 
                    type="number"
                    defaultValue={editingPrayer?.priority || 0}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch 
                    id="is_active" 
                    name="is_active"
                    defaultChecked={editingPrayer?.is_active ?? true}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createPrayer.isPending || updatePrayer.isPending}>
                  {editingPrayer ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Audio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Memuat...
                </TableCell>
              </TableRow>
            ) : prayers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Belum ada doa
                </TableCell>
              </TableRow>
            ) : (
              prayers?.map((prayer) => (
                <TableRow key={prayer.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{prayer.title}</p>
                      {prayer.title_arabic && (
                        <p className="text-sm text-muted-foreground font-arabic">{prayer.title_arabic}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {prayer.category?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {prayer.audio_url ? (
                      <Badge variant="outline" className="text-green-600">
                        <Volume2 className="w-3 h-3 mr-1" />
                        Ada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Tidak ada
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={prayer.is_active ? 'default' : 'secondary'}>
                      {prayer.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(prayer)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(prayer.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Categories Tab
const CategoriesTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PrayerCategory | null>(null);
  
  const { data: categories, isLoading } = useAllPrayerCategories();
  const createCategory = useCreatePrayerCategory();
  const updateCategory = useUpdatePrayerCategory();
  const deleteCategory = useDeletePrayerCategory();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get('name') as string,
      name_arabic: formData.get('name_arabic') as string || null,
      description: formData.get('description') as string || null,
      icon: formData.get('icon') as string || null,
      priority: parseInt(formData.get('priority') as string) || 0,
      is_active: formData.get('is_active') === 'on'
    };

    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, ...data });
    } else {
      await createCategory.mutateAsync(data);
    }

    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleEdit = (category: PrayerCategory) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus kategori ini?')) {
      await deleteCategory.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingCategory(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingCategory?.name}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="name_arabic">Nama Arab</Label>
                <Input 
                  id="name_arabic" 
                  name="name_arabic" 
                  defaultValue={editingCategory?.name_arabic || ''}
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={editingCategory?.description || ''}
                />
              </div>
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Select name="icon" defaultValue={editingCategory?.icon || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kaaba">🕋 Kaaba</SelectItem>
                    <SelectItem value="sun">☀️ Matahari</SelectItem>
                    <SelectItem value="plane">✈️ Pesawat</SelectItem>
                    <SelectItem value="sparkles">✨ Sparkles</SelectItem>
                    <SelectItem value="book">📖 Buku</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Prioritas</Label>
                  <Input 
                    id="priority" 
                    name="priority" 
                    type="number"
                    defaultValue={editingCategory?.priority || 0}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch 
                    id="is_active" 
                    name="is_active"
                    defaultChecked={editingCategory?.is_active ?? true}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                  {editingCategory ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Memuat...
                </TableCell>
              </TableRow>
            ) : categories?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Belum ada kategori
                </TableCell>
              </TableRow>
            ) : (
              categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.name_arabic && (
                        <p className="text-sm text-muted-foreground font-arabic">{category.name_arabic}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {category.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? 'default' : 'secondary'}>
                      {category.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(category.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PrayersManagement;
