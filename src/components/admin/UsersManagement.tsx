import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAllUsers, useUpdateUserRole, useSuspendUser } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Search, UserCog, Ban, CheckCircle, AlertTriangle, Shield, User } from 'lucide-react';
import { AppRole, Profile } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export const UsersManagement = () => {
  const { data: users, isLoading } = useAllUsers();
  const updateRole = useUpdateUserRole();
  const suspendUser = useSuspendUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; user: Profile | null; action: 'suspend' | 'unsuspend' }>({
    open: false,
    user: null,
    action: 'suspend'
  });
  const [suspensionReason, setSuspensionReason] = useState('');

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, role: AppRole) => {
    try {
      await updateRole.mutateAsync({ user_id: userId, role });
      toast.success('Role berhasil diupdate');
    } catch (error) {
      toast.error('Gagal mengupdate role');
    }
  };

  const handleSuspend = async () => {
    if (!suspendDialog.user) return;
    
    try {
      const isSuspending = suspendDialog.action === 'suspend';
      await suspendUser.mutateAsync({
        user_id: suspendDialog.user.user_id,
        is_suspended: isSuspending,
        suspension_reason: isSuspending ? suspensionReason : null
      });
      toast.success(isSuspending ? 'User berhasil disuspend' : 'Suspend berhasil dicabut');
      setSuspendDialog({ open: false, user: null, action: 'suspend' });
      setSuspensionReason('');
    } catch (error) {
      toast.error('Gagal memproses suspend');
    }
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
      case 'agent':
        return <Badge variant="default" className="gap-1"><UserCog className="h-3 w-3" />Agent</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><User className="h-3 w-3" />Jamaah</Badge>;
    }
  };

  const getStatusBadge = (user: Profile) => {
    if (user.is_suspended) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Ban className="h-3 w-3" />
          Suspended
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
        <CheckCircle className="h-3 w-3" />
        Aktif
      </Badge>
    );
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

  const agentCount = users?.filter(u => u.role === 'agent').length || 0;
  const suspendedCount = users?.filter(u => u.is_suspended).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Manajemen Pengguna
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
              <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="jamaah">Jamaah</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="bg-secondary px-3 py-1.5 rounded-lg">
              Total: <span className="font-semibold">{users?.length || 0}</span>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg">
              Agent: <span className="font-semibold">{agentCount}</span>
            </div>
            {suspendedCount > 0 && (
              <div className="bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg">
                Suspended: <span className="font-semibold">{suspendedCount}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Tidak ada pengguna ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((user) => (
                  <TableRow key={user.id} className={user.is_suspended ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.is_suspended && <Ban className="h-4 w-4 text-destructive" />}
                        {user.full_name || 'Belum diisi'}
                      </div>
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(user)}
                        {user.is_suspended && user.suspension_reason && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={user.suspension_reason}>
                            {user.suspension_reason}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.user_id, value as AppRole)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jamaah">Jamaah</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {user.is_suspended ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSuspendDialog({ open: true, user, action: 'unsuspend' })}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aktifkan
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSuspendDialog({ open: true, user, action: 'suspend' })}
                            className="text-destructive border-destructive hover:bg-destructive/10"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialog.open} onOpenChange={(open) => !open && setSuspendDialog({ open: false, user: null, action: 'suspend' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {suspendDialog.action === 'suspend' ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Suspend User
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Aktifkan User
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {suspendDialog.action === 'suspend' 
                ? `User "${suspendDialog.user?.full_name || 'Unknown'}" akan disuspend dan tidak dapat mengakses fitur tertentu.`
                : `User "${suspendDialog.user?.full_name || 'Unknown'}" akan diaktifkan kembali.`
              }
            </DialogDescription>
          </DialogHeader>
          
          {suspendDialog.action === 'suspend' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Suspend</Label>
              <Textarea
                id="reason"
                placeholder="Tuliskan alasan suspend..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false, user: null, action: 'suspend' })}>
              Batal
            </Button>
            <Button
              variant={suspendDialog.action === 'suspend' ? 'destructive' : 'default'}
              onClick={handleSuspend}
              disabled={suspendUser.isPending}
            >
              {suspendUser.isPending ? 'Memproses...' : suspendDialog.action === 'suspend' ? 'Suspend' : 'Aktifkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
