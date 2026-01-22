import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePackageCredits, useCreditTransactions, useAddCredits, useAllTravels } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CreditCard, Plus, ArrowUpCircle, ArrowDownCircle, Gift, RefreshCw, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const CreditsManagement = () => {
  const { data: credits, isLoading: creditsLoading } = usePackageCredits();
  const { data: transactions, isLoading: transactionsLoading } = useCreditTransactions();
  const { data: travels } = useAllTravels();
  const addCredits = useAddCredits();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTravelId, setSelectedTravelId] = useState('');
  const [amount, setAmount] = useState(1);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCredits = credits?.filter(c => 
    c.travel?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCredits = async () => {
    if (!selectedTravelId || amount <= 0) {
      toast.error('Pilih travel dan jumlah kredit');
      return;
    }

    try {
      await addCredits.mutateAsync({
        travel_id: selectedTravelId,
        amount,
        notes
      });
      toast.success('Kredit berhasil ditambahkan');
      setIsDialogOpen(false);
      setSelectedTravelId('');
      setAmount(1);
      setNotes('');
    } catch (error) {
      toast.error('Gagal menambahkan kredit');
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'usage':
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case 'bonus':
        return <Gift className="h-4 w-4 text-purple-500" />;
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge className="bg-green-500">Pembelian</Badge>;
      case 'usage':
        return <Badge variant="destructive">Penggunaan</Badge>;
      case 'bonus':
        return <Badge className="bg-purple-500">Bonus</Badge>;
      case 'refund':
        return <Badge variant="outline">Refund</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Tabs defaultValue="credits" className="space-y-4">
      <TabsList>
        <TabsTrigger value="credits">Saldo Kredit</TabsTrigger>
        <TabsTrigger value="transactions">Riwayat Transaksi</TabsTrigger>
      </TabsList>

      <TabsContent value="credits">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Kredit Paket per Travel
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama travel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Kredit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Kredit Bonus</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Pilih Travel</Label>
                        <Select value={selectedTravelId} onValueChange={setSelectedTravelId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih travel agency" />
                          </SelectTrigger>
                          <SelectContent>
                            {travels?.map((travel) => (
                              <SelectItem key={travel.id} value={travel.id}>
                                {travel.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Jumlah Kredit</Label>
                        <Input
                          type="number"
                          min={1}
                          value={amount}
                          onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      
                      <div>
                        <Label>Catatan</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Alasan penambahan kredit..."
                        />
                      </div>
                      
                      <Button onClick={handleAddCredits} className="w-full">
                        <Gift className="h-4 w-4 mr-2" />
                        Berikan Kredit Bonus
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {creditsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredCredits?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada data kredit
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Travel</TableHead>
                      <TableHead className="text-center">Sisa Kredit</TableHead>
                      <TableHead className="text-center">Terpakai</TableHead>
                      <TableHead>Pembelian Terakhir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCredits?.map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell className="font-medium">
                          {credit.travel?.name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={credit.credits_remaining > 0 ? 'default' : 'destructive'}>
                            {credit.credits_remaining}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {credit.credits_used}
                        </TableCell>
                        <TableCell>
                          {credit.last_purchase_date 
                            ? format(new Date(credit.last_purchase_date), 'dd MMM yyyy', { locale: id })
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="transactions">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Riwayat Transaksi Kredit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : transactions?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada transaksi
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Travel</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead className="text-center">Jumlah</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {tx.travel?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(tx.transaction_type)}
                            {getTransactionBadge(tx.transaction_type)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </span>
                        </TableCell>
                        <TableCell>
                          {tx.price ? formatCurrency(tx.price) : '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {tx.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
