import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  useDzikirTypes,
  useCreateDzikirType,
  useUpdateDzikirType,
  useDeleteDzikirType
} from '@/hooks/useDzikirTracking';

export const TasbihManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDzikir, setEditingDzikir] = useState<any>(null);
  
  const { data: dzikirTypes, isLoading } = useDzikirTypes(false);
  const createDzikir = useCreateDzikirType();
  const updateDzikir = useUpdateDzikirType();
  const deleteDzikir = useDeleteDzikirType();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get('name') as string,
      name_arabic: formData.get('name_arabic') as string || null,
      description: formData.get('description') as string || null,
      default_target: parseInt(formData.get('default_target') as string) || 33,
      category: formData.get('category') as string || 'Umum',
      priority: parseInt(formData.get('priority') as string) || 0,
      is_active: formData.get('is_active') === 'on',
    };

    if (editingDzikir) {
      await updateDzikir.mutateAsync({ id: editingDzikir.id, ...data });
    } else {
      await createDzikir.mutateAsync(data);
    }

    setIsDialogOpen(false);
    setEditingDzikir(null);
  };

  const handleEdit = (dzikir: any) => {
    setEditingDzikir(dzikir);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus tipe dzikir ini?')) {
      await deleteDzikir.mutateAsync(id);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manajemen Tasbih</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingDzikir(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Dzikir
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDzikir ? 'Edit Dzikir' : 'Tambah Dzikir Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Dzikir</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingDzikir?.name}
                  placeholder="Subhanallah"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_arabic">Nama Arab</Label>
                <Input 
                  id="name_arabic" 
                  name="name_arabic" 
                  defaultValue={editingDzikir?.name_arabic}
                  placeholder="سبحان الله"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={editingDzikir?.description}
                  placeholder="Keutamaan dzikir ini..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_target">Target Default</Label>
                  <Input 
                    id="default_target" 
                    name="default_target" 
                    type="number"
                    defaultValue={editingDzikir?.default_target || 33}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Input 
                    id="category" 
                    name="category" 
                    defaultValue={editingDzikir?.category || 'Umum'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioritas</Label>
                  <Input 
                    id="priority" 
                    name="priority" 
                    type="number"
                    defaultValue={editingDzikir?.priority || 0}
                  />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <Switch 
                    id="is_active" 
                    name="is_active"
                    defaultChecked={editingDzikir?.is_active ?? true}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createDzikir.isPending || updateDzikir.isPending}>
                  {editingDzikir ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : dzikirTypes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada data dzikir.
                  </TableCell>
                </TableRow>
              ) : (
                dzikirTypes?.map((dzikir) => (
                  <TableRow key={dzikir.id}>
                    <TableCell>
                      <div className="font-medium">{dzikir.name}</div>
                      {dzikir.name_arabic && (
                        <div className="text-sm text-primary font-arabic">{dzikir.name_arabic}</div>
                      )}
                    </TableCell>
                    <TableCell>{dzikir.default_target}x</TableCell>
                    <TableCell>{dzikir.category}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        dzikir.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {dzikir.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(dzikir)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(dzikir.id)}>
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
      </CardContent>
    </Card>
  );
};
