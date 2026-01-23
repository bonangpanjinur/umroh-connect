import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Star, Clock, Trash2, Eye, Search, Filter,
  TrendingUp, Package, Building2, Calendar, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useFeaturedStats, useCancelFeaturedPackage } from '@/hooks/useFeaturedPackages';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface FeaturedPackageAdmin {
  id: string;
  package_id: string;
  travel_id: string;
  position: string;
  priority: number;
  credits_used: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  package: {
    name: string;
    package_type: string;
  };
  travel: {
    name: string;
    logo_url: string | null;
  };
}

const positionLabels: Record<string, { label: string; color: string }> = {
  home: { label: 'Beranda', color: 'bg-amber-100 text-amber-800' },
  category: { label: 'Kategori', color: 'bg-blue-100 text-blue-800' },
  search: { label: 'Pencarian', color: 'bg-purple-100 text-purple-800' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktif', color: 'bg-green-100 text-green-800' },
  expired: { label: 'Berakhir', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
};

export const FeaturedManagement = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<FeaturedPackageAdmin | null>(null);

  const { data: stats, isLoading: statsLoading } = useFeaturedStats();
  const cancelFeatured = useCancelFeaturedPackage();

  // Fetch all featured packages for admin
  const { data: featuredPackages, isLoading, refetch } = useQuery({
    queryKey: ['admin-featured-packages', statusFilter, positionFilter],
    queryFn: async () => {
      let query = supabase
        .from('featured_packages')
        .select(`
          *,
          package:packages(name, package_type),
          travel:travels(name, logo_url)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (positionFilter !== 'all') {
        query = query.eq('position', positionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as FeaturedPackageAdmin[];
    },
  });

  // Filter by search
  const filteredPackages = featuredPackages?.filter(fp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      fp.package?.name?.toLowerCase().includes(query) ||
      fp.travel?.name?.toLowerCase().includes(query)
    );
  }) || [];

  const handleCancel = async () => {
    if (!deleteTarget) return;

    try {
      await cancelFeatured.mutateAsync(deleteTarget.id);
      toast({
        title: 'Berhasil',
        description: 'Featured package berhasil dibatalkan',
      });
      setDeleteTarget(null);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Featured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold">{stats?.total || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktif Sekarang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{stats?.active || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Di Beranda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold">{stats?.homeActive || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kredit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{stats?.totalCreditsUsed || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari paket atau travel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="expired">Berakhir</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Posisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Posisi</SelectItem>
            <SelectItem value="home">Beranda</SelectItem>
            <SelectItem value="category">Kategori</SelectItem>
            <SelectItem value="search">Pencarian</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h4 className="font-medium mb-1">Belum Ada Featured Package</h4>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== 'all' || positionFilter !== 'all'
              ? 'Tidak ada data yang sesuai filter'
              : 'Featured package dari travel akan muncul di sini'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paket</TableHead>
                <TableHead>Travel</TableHead>
                <TableHead>Posisi</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Kredit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.map((fp) => {
                const expired = isExpired(fp.end_date);
                const currentStatus = expired && fp.status === 'active' ? 'expired' : fp.status;
                const statusInfo = statusLabels[currentStatus] || statusLabels.expired;
                const positionInfo = positionLabels[fp.position] || positionLabels.category;

                return (
                  <TableRow key={fp.id}>
                    <TableCell>
                      <div className="font-medium">{fp.package?.name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {fp.package?.package_type?.replace('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {fp.travel?.logo_url ? (
                          <img 
                            src={fp.travel.logo_url} 
                            alt={fp.travel.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-muted-foreground" />
                        )}
                        <span className="text-sm">{fp.travel?.name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={positionInfo.color}>
                        {positionInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(fp.start_date), 'dd MMM', { locale: localeId })} -
                        {format(new Date(fp.end_date), 'dd MMM yyyy', { locale: localeId })}
                      </div>
                      {!expired && fp.status === 'active' && (
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(fp.end_date), { 
                            addSuffix: true, 
                            locale: localeId 
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{fp.credits_used}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {fp.status === 'active' && !expired && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(fp)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Featured Package?</AlertDialogTitle>
            <AlertDialogDescription>
              Paket <strong>{deleteTarget?.package?.name}</strong> dari{' '}
              <strong>{deleteTarget?.travel?.name}</strong> akan dihapus dari posisi unggulan.
              Kredit yang sudah digunakan tidak akan dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Batalkan Featured
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
