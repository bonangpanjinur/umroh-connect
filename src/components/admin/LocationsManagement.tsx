import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  name_arabic: string | null;
  description: string | null;
  category: string;
  city: string;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  image_url: string | null;
  is_active: boolean;
  priority: number;
}

const categoryOptions = [
  { value: 'masjid', label: '🕌 Masjid' },
  { value: 'landmark', label: '🏛️ Landmark' },
  { value: 'hospital', label: '🏥 Rumah Sakit' },
  { value: 'embassy', label: '🏢 Kedutaan' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'restaurant', label: '🍽️ Restoran' },
  { value: 'shopping', label: '🛒 Belanja' },
  { value: 'other', label: '📍 Lainnya' },
];

/**
 * Parse Google Maps URL to extract latitude and longitude.
 * Supports formats:
 * - https://maps.google.com/?q=21.4225,39.8262
 * - https://www.google.com/maps/place/.../@21.4225,39.8262,...
 * - https://goo.gl/maps/... (short links won't work, user needs full URL)
 * - https://maps.app.goo.gl/... 
 * - Plain coordinates: 21.4225,39.8262
 */
const parseGoogleMapsUrl = (url: string): { lat: number; lng: number } | null => {
  if (!url) return null;
  
  // Try plain coordinates first: "21.4225,39.8262" or "21.4225, 39.8262"
  const plainMatch = url.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (plainMatch) {
    return { lat: parseFloat(plainMatch[1]), lng: parseFloat(plainMatch[2]) };
  }

  // Try @lat,lng pattern (Google Maps place URLs)
  const atMatch = url.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // Try ?q=lat,lng pattern
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }

  // Try /place/lat,lng pattern
  const placeMatch = url.match(/\/place\/(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (placeMatch) {
    return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
  }

  // Try ll=lat,lng pattern
  const llMatch = url.match(/ll=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (llMatch) {
    return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
  }

  return null;
};

export const LocationsManagement = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [filterCity, setFilterCity] = useState<string>('all');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [parsedCoords, setParsedCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    name_arabic: '',
    description: '',
    category: 'masjid',
    city: 'Makkah',
    address: '',
    phone: '',
    website: '',
    opening_hours: '',
    image_url: '',
    priority: 0,
    is_active: true,
  });

  const fetchLocations = async () => {
    let query = supabase
      .from('important_locations')
      .select('*')
      .order('priority', { ascending: false });

    if (filterCity !== 'all') {
      query = query.eq('city', filterCity);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching locations:', error);
      return;
    }

    setLocations(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLocations();
  }, [filterCity]);

  const resetForm = () => {
    setFormData({
      name: '',
      name_arabic: '',
      description: '',
      category: 'masjid',
      city: 'Makkah',
      address: '',
      phone: '',
      website: '',
      opening_hours: '',
      image_url: '',
      priority: 0,
      is_active: true,
    });
    setEditingLocation(null);
    setGoogleMapsUrl('');
    setParsedCoords(null);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      name_arabic: location.name_arabic || '',
      description: location.description || '',
      category: location.category,
      city: location.city,
      address: location.address || '',
      phone: location.phone || '',
      website: location.website || '',
      opening_hours: location.opening_hours || '',
      image_url: location.image_url || '',
      priority: location.priority,
      is_active: location.is_active,
    });
    setParsedCoords({ lat: location.latitude, lng: location.longitude });
    setGoogleMapsUrl(`${location.latitude},${location.longitude}`);
    setIsDialogOpen(true);
  };

  const handleGoogleMapsUrlChange = (value: string) => {
    setGoogleMapsUrl(value);
    const coords = parseGoogleMapsUrl(value);
    setParsedCoords(coords);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Nama lokasi wajib diisi');
      return;
    }

    if (!parsedCoords) {
      toast.error('URL Google Maps tidak valid atau koordinat belum terdeteksi');
      return;
    }

    const payload = {
      name: formData.name,
      name_arabic: formData.name_arabic || null,
      description: formData.description || null,
      category: formData.category,
      city: formData.city,
      latitude: parsedCoords.lat,
      longitude: parsedCoords.lng,
      address: formData.address || null,
      phone: formData.phone || null,
      website: formData.website || null,
      opening_hours: formData.opening_hours || null,
      image_url: formData.image_url || null,
      priority: formData.priority,
      is_active: formData.is_active,
    };

    if (editingLocation) {
      const { error } = await supabase
        .from('important_locations')
        .update(payload)
        .eq('id', editingLocation.id);

      if (error) {
        toast.error('Gagal mengupdate lokasi: ' + error.message);
        return;
      }
      toast.success('Lokasi berhasil diupdate');
    } else {
      const { error } = await supabase
        .from('important_locations')
        .insert(payload);

      if (error) {
        toast.error('Gagal menambah lokasi: ' + error.message);
        return;
      }
      toast.success('Lokasi berhasil ditambahkan');
    }

    setIsDialogOpen(false);
    resetForm();
    fetchLocations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus lokasi ini?')) return;

    const { error } = await supabase
      .from('important_locations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Gagal menghapus lokasi');
      return;
    }

    toast.success('Lokasi berhasil dihapus');
    fetchLocations();
  };

  const getCategoryLabel = (category: string) => {
    return categoryOptions.find(c => c.value === category)?.label || category;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lokasi Penting</CardTitle>
        <div className="flex items-center gap-4">
          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter Kota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kota</SelectItem>
              <SelectItem value="Makkah">Makkah</SelectItem>
              <SelectItem value="Madinah">Madinah</SelectItem>
              <SelectItem value="Jeddah">Jeddah</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Lokasi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nama</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Masjidil Haram"
                    />
                  </div>
                  <div>
                    <Label>Nama (Arab)</Label>
                    <Input
                      value={formData.name_arabic}
                      onChange={(e) => setFormData({ ...formData, name_arabic: e.target.value })}
                      placeholder="المسجد الحرام"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Kategori</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Kota</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(v) => setFormData({ ...formData, city: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Makkah">Makkah</SelectItem>
                        <SelectItem value="Madinah">Madinah</SelectItem>
                        <SelectItem value="Jeddah">Jeddah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Google Maps URL input */}
                <div>
                  <Label>URL Google Maps / Koordinat</Label>
                  <Input
                    value={googleMapsUrl}
                    onChange={(e) => handleGoogleMapsUrlChange(e.target.value)}
                    placeholder="Tempel URL Google Maps atau ketik koordinat: 21.4225,39.8262"
                  />
                  {googleMapsUrl && (
                    <div className="mt-1.5">
                      {parsedCoords ? (
                        <p className="text-xs text-primary flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Koordinat terdeteksi: {parsedCoords.lat.toFixed(6)}, {parsedCoords.lng.toFixed(6)}
                        </p>
                      ) : (
                        <p className="text-xs text-destructive">
                          Koordinat tidak terdeteksi. Pastikan URL Google Maps valid atau gunakan format: lat,lng
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi singkat lokasi..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Alamat</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Alamat lengkap..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Telepon</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+966..."
                    />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Jam Operasional</Label>
                    <Input
                      value={formData.opening_hours}
                      onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                      placeholder="24 jam / 08:00 - 22:00"
                    />
                  </div>
                  <div>
                    <Label>Prioritas</Label>
                    <Input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <Label>Aktif</Label>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingLocation ? 'Update Lokasi' : 'Simpan Lokasi'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Memuat...</p>
        ) : locations.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Belum ada lokasi</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Kota</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{location.name}</p>
                        {location.name_arabic && (
                          <p className="text-sm text-muted-foreground" dir="rtl">
                            {location.name_arabic}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryLabel(location.category)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{location.city}</Badge>
                  </TableCell>
                  <TableCell>{location.priority}</TableCell>
                  <TableCell>
                    <Badge variant={location.is_active ? 'default' : 'secondary'}>
                      {location.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(location)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(location.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};