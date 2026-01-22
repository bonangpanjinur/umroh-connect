import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Hotel, Plane, Star } from 'lucide-react';
import { useAllHotels, useCreateHotel, useUpdateHotel, useDeleteHotel, useAllAirlines, useCreateAirline, useUpdateAirline, useDeleteAirline } from '@/hooks/useMasterData';
import { Hotel as HotelType, Airline } from '@/types/database';

export const MasterDataManagement = () => {
  const [activeTab, setActiveTab] = useState('hotels');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hotel className="w-5 h-5" />
          Master Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="hotels" className="flex items-center gap-2">
              <Hotel className="w-4 h-4" />
              Hotels
            </TabsTrigger>
            <TabsTrigger value="airlines" className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Maskapai
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hotels">
            <HotelsTab />
          </TabsContent>

          <TabsContent value="airlines">
            <AirlinesTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Hotels Tab Component
const HotelsTab = () => {
  const { data: hotels, isLoading } = useAllHotels();
  const createHotel = useCreateHotel();
  const updateHotel = useUpdateHotel();
  const deleteHotel = useDeleteHotel();
  const [editHotel, setEditHotel] = useState<HotelType | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, isEdit: boolean) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const data = {
      name: formData.get('name') as string,
      city: formData.get('city') as 'Makkah' | 'Madinah',
      star_rating: Number(formData.get('star_rating')),
      distance_to_haram: formData.get('distance_to_haram') as string || null,
      is_active: formData.get('is_active') === 'on',
    };

    if (isEdit && editHotel) {
      await updateHotel.mutateAsync({ id: editHotel.id, ...data });
      setEditHotel(null);
    } else {
      await createHotel.mutateAsync(data);
      setIsAddOpen(false);
    }
  };

  const HotelForm = ({ hotel, isEdit }: { hotel?: HotelType | null; isEdit: boolean }) => (
    <form onSubmit={(e) => handleSubmit(e, isEdit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Hotel *</Label>
          <Input id="name" name="name" defaultValue={hotel?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Kota *</Label>
          <Select name="city" defaultValue={hotel?.city || 'Makkah'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Makkah">Makkah</SelectItem>
              <SelectItem value="Madinah">Madinah</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="star_rating">Bintang *</Label>
          <Select name="star_rating" defaultValue={String(hotel?.star_rating || 4)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">⭐⭐⭐ Bintang 3</SelectItem>
              <SelectItem value="4">⭐⭐⭐⭐ Bintang 4</SelectItem>
              <SelectItem value="5">⭐⭐⭐⭐⭐ Bintang 5</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="distance_to_haram">Jarak ke Haram</Label>
          <Input id="distance_to_haram" name="distance_to_haram" defaultValue={hotel?.distance_to_haram || ''} placeholder="100m" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="is_active" name="is_active" defaultChecked={hotel?.is_active ?? true} />
        <Label htmlFor="is_active">Aktif</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={createHotel.isPending || updateHotel.isPending}>
          {isEdit ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Hotel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Hotel Baru</DialogTitle>
            </DialogHeader>
            <HotelForm isEdit={false} />
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Kota</TableHead>
            <TableHead>Bintang</TableHead>
            <TableHead>Jarak</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hotels?.map((hotel) => (
            <TableRow key={hotel.id}>
              <TableCell className="font-medium">{hotel.name}</TableCell>
              <TableCell>{hotel.city}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {hotel.star_rating}
                </span>
              </TableCell>
              <TableCell>{hotel.distance_to_haram || '-'}</TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded-full ${hotel.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {hotel.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Dialog open={editHotel?.id === hotel.id} onOpenChange={(open) => !open && setEditHotel(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setEditHotel(hotel)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Hotel</DialogTitle>
                      </DialogHeader>
                      <HotelForm hotel={editHotel} isEdit={true} />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteHotel.mutate(hotel.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {(!hotels || hotels.length === 0) && (
        <div className="py-8 text-center text-muted-foreground">
          Belum ada data hotel
        </div>
      )}
    </div>
  );
};

// Airlines Tab Component
const AirlinesTab = () => {
  const { data: airlines, isLoading } = useAllAirlines();
  const createAirline = useCreateAirline();
  const updateAirline = useUpdateAirline();
  const deleteAirline = useDeleteAirline();
  const [editAirline, setEditAirline] = useState<Airline | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, isEdit: boolean) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const data = {
      name: formData.get('name') as string,
      code: formData.get('code') as string || null,
      logo_url: formData.get('logo_url') as string || null,
      is_active: formData.get('is_active') === 'on',
    };

    if (isEdit && editAirline) {
      await updateAirline.mutateAsync({ id: editAirline.id, ...data });
      setEditAirline(null);
    } else {
      await createAirline.mutateAsync(data);
      setIsAddOpen(false);
    }
  };

  const AirlineForm = ({ airline, isEdit }: { airline?: Airline | null; isEdit: boolean }) => (
    <form onSubmit={(e) => handleSubmit(e, isEdit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Maskapai *</Label>
          <Input id="name" name="name" defaultValue={airline?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Kode (IATA)</Label>
          <Input id="code" name="code" defaultValue={airline?.code || ''} placeholder="GA" maxLength={3} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="logo_url">URL Logo</Label>
        <Input id="logo_url" name="logo_url" defaultValue={airline?.logo_url || ''} placeholder="https://..." />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="is_active" name="is_active" defaultChecked={airline?.is_active ?? true} />
        <Label htmlFor="is_active">Aktif</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={createAirline.isPending || updateAirline.isPending}>
          {isEdit ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Maskapai
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Maskapai Baru</DialogTitle>
            </DialogHeader>
            <AirlineForm isEdit={false} />
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {airlines?.map((airline) => (
            <TableRow key={airline.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-muted-foreground" />
                  {airline.name}
                </div>
              </TableCell>
              <TableCell>{airline.code || '-'}</TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded-full ${airline.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {airline.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Dialog open={editAirline?.id === airline.id} onOpenChange={(open) => !open && setEditAirline(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setEditAirline(airline)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Maskapai</DialogTitle>
                      </DialogHeader>
                      <AirlineForm airline={editAirline} isEdit={true} />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteAirline.mutate(airline.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {(!airlines || airlines.length === 0) && (
        <div className="py-8 text-center text-muted-foreground">
          Belum ada data maskapai
        </div>
      )}
    </div>
  );
};
