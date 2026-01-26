import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAgentInquiries,
  useUpdateInquiryStatus,
  useDeleteInquiry,
  useInquiryStats,
  PackageInquiry,
} from '@/hooks/useInquiries';
import { useAgentTravel } from '@/hooks/useAgentData';
import {
  Search,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Loader2,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  contacted: { label: 'Dihubungi', color: 'bg-blue-100 text-blue-800', icon: Phone },
  converted: { label: 'Jadi Booking', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export const InquiriesManagement = () => {
  const { data: travel } = useAgentTravel();
  const travelId = travel?.id;
  
  const { data: inquiries, isLoading } = useAgentInquiries(travelId);
  const { data: stats } = useInquiryStats(travelId);
  const updateStatus = useUpdateInquiryStatus();
  const deleteInquiry = useDeleteInquiry();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<PackageInquiry | null>(null);
  const [agentNotes, setAgentNotes] = useState('');

  const filteredInquiries = inquiries?.filter((inquiry) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      inquiry.full_name.toLowerCase().includes(searchLower) ||
      inquiry.phone.includes(searchLower) ||
      inquiry.package?.name?.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (inquiry: PackageInquiry, newStatus: PackageInquiry['status']) => {
    try {
      await updateStatus.mutateAsync({
        inquiryId: inquiry.id,
        status: newStatus,
        agentNotes: inquiry.agent_notes || undefined,
      });
      toast.success('Status berhasil diupdate');
    } catch (error) {
      toast.error('Gagal mengupdate status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    
    try {
      await updateStatus.mutateAsync({
        inquiryId: selectedInquiry.id,
        status: selectedInquiry.status,
        agentNotes,
      });
      toast.success('Catatan berhasil disimpan');
      setSelectedInquiry(null);
    } catch (error) {
      toast.error('Gagal menyimpan catatan');
    }
  };

  const handleDelete = async (inquiryId: string) => {
    if (!confirm('Yakin ingin menghapus inquiry ini?')) return;
    
    try {
      await deleteInquiry.mutateAsync(inquiryId);
      toast.success('Inquiry berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus inquiry');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Inquiry</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                  <p className="text-xs text-yellow-600">Menunggu</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.converted}</p>
                  <p className="text-xs text-green-600">Jadi Booking</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.thisWeek}</p>
                  <p className="text-xs text-blue-600">Minggu Ini</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="text-lg">Daftar Inquiry</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="contacted">Dihubungi</SelectItem>
                  <SelectItem value="converted">Jadi Booking</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead className="hidden md:table-cell">Jamaah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInquiries?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada inquiry
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInquiries?.map((inquiry) => {
                    const StatusIcon = statusConfig[inquiry.status].icon;
                    return (
                      <TableRow key={inquiry.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{inquiry.full_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <a
                                href={`https://wa.me/${inquiry.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary"
                              >
                                {inquiry.phone}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[150px]">
                              {inquiry.package?.name}
                            </p>
                            {inquiry.departure && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(inquiry.departure.departure_date), 'd MMM yyyy', { locale: id })}
                                {' · '}
                                {formatPrice(inquiry.departure.price)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {inquiry.number_of_people}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={inquiry.status}
                            onValueChange={(value) => handleStatusChange(inquiry, value as PackageInquiry['status'])}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <Badge className={`${statusConfig[inquiry.status].color} text-xs`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[inquiry.status].label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-1">
                                    <config.icon className="h-3 w-3" />
                                    {config.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {format(new Date(inquiry.created_at), 'd MMM yyyy HH:mm', { locale: id })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <a
                                href={`https://wa.me/${inquiry.phone.replace(/\D/g, '')}?text=Halo ${encodeURIComponent(inquiry.full_name)}, terima kasih atas minat Anda pada paket ${encodeURIComponent(inquiry.package?.name || 'umroh')} kami.`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInquiry(inquiry);
                                setAgentNotes(inquiry.agent_notes || '');
                              }}
                            >
                              Detail
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(inquiry.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Inquiry</DialogTitle>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nama</p>
                  <p className="font-medium">{selectedInquiry.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jumlah Jamaah</p>
                  <p className="font-medium">{selectedInquiry.number_of_people} orang</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Telepon</p>
                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="font-medium text-primary hover:underline"
                >
                  {selectedInquiry.phone}
                </a>
              </div>

              {selectedInquiry.email && (
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {selectedInquiry.email}
                  </a>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">Paket</p>
                <p className="font-medium">{selectedInquiry.package?.name}</p>
                {selectedInquiry.departure && (
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedInquiry.departure.departure_date), 'd MMM yyyy', { locale: id })}
                    {' · '}
                    {formatPrice(selectedInquiry.departure.price)}
                  </p>
                )}
              </div>

              {selectedInquiry.message && (
                <div>
                  <p className="text-xs text-muted-foreground">Pesan</p>
                  <p className="text-sm bg-muted p-2 rounded">{selectedInquiry.message}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">Catatan Agen</p>
                <Textarea
                  placeholder="Tambahkan catatan untuk inquiry ini..."
                  value={agentNotes}
                  onChange={(e) => setAgentNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInquiry(null)}>
              Tutup
            </Button>
            <Button onClick={handleSaveNotes} disabled={updateStatus.isPending}>
              {updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
