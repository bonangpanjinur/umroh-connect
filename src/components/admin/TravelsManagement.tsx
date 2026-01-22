import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAllTravels, useVerifyTravel, useDeleteTravel } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Search, Building2, CheckCircle, XCircle, Star, Trash2 } from 'lucide-react';
import { AddTravelForm } from './AddTravelForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const TravelsManagement = () => {
  const { data: travels, isLoading } = useAllTravels();
  const verifyTravel = useVerifyTravel();
  const deleteTravel = useDeleteTravel();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTravels = travels?.filter(travel =>
    travel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    travel.phone?.includes(searchTerm)
  );

  const handleVerify = async (id: string, verified: boolean) => {
    try {
      await verifyTravel.mutateAsync({ id, verified });
      toast.success(verified ? 'Travel berhasil diverifikasi' : 'Verifikasi dicabut');
    } catch (error) {
      toast.error('Gagal mengupdate verifikasi');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTravel.mutateAsync(id);
      toast.success('Travel berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus travel');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Manajemen Travel Agency
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <AddTravelForm />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Travel</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTravels?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Tidak ada travel ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredTravels?.map((travel) => (
                  <TableRow key={travel.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {travel.logo_url ? (
                          <img 
                            src={travel.logo_url} 
                            alt={travel.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{travel.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {travel.address || 'Alamat belum diisi'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {travel.owner?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{travel.phone || '-'}</p>
                        <p className="text-muted-foreground">{travel.whatsapp || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{travel.rating || 0}</span>
                        <span className="text-muted-foreground">({travel.review_count || 0})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {travel.verified ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Belum Verified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(travel.created_at), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {travel.verified ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerify(travel.id, false)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cabut
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleVerify(travel.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verifikasi
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Travel</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus "{travel.name}"? 
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(travel.id)}>
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
