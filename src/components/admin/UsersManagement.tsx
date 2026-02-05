import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAllUsers, useUpdateUserRole, useSuspendUser, useUpdateAgentWebsiteSettings } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Search, UserCog, Ban, CheckCircle, AlertTriangle, Shield, User, Globe, Save, Palette, Layout, Eye, Upload } from 'lucide-react';
import { AppRole, Profile } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { supabaseUntyped as supabase } from '@/lib/supabase';

export const UsersManagement = () => {
  const { data: users, isLoading } = useAllUsers();
  const updateRole = useUpdateUserRole();
  const suspendUser = useSuspendUser();
  const updateWebsiteSettings = useUpdateAgentWebsiteSettings();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; user: Profile | null; action: 'suspend' | 'unsuspend' }>({
    open: false,
    user: null,
    action: 'suspend'
  });
  const [suspensionReason, setSuspensionReason] = useState('');
  
  // Website Management State
  const [websiteDialog, setWebsiteDialog] = useState<{ open: boolean; user: Profile | null }>({
    open: false,
    user: null
  });
  const [websiteSettings, setWebsiteSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

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

  const fetchWebsiteSettings = async (userId: string) => {
    try {
      setLoadingSettings(true);
      const { data, error } = await supabase
        .from('agent_website_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWebsiteSettings(data);
      } else {
        // Default settings if none exist
        setWebsiteSettings({
          user_id: userId,
          primary_color: '#0284c7',
          show_stats: true,
          show_features: true,
          show_contact_form: true,
          is_published: false,
          features_json: [
            {title: "Resmi & Terpercaya", description: "Terdaftar resmi di Kementrian Agama dengan track record keberangkatan 100%."},
            {title: "Pembimbing Berpengalaman", description: "Didampingi oleh Muthawif dan pembimbing ibadah yang kompeten dan sabar."},
            {title: "Jadwal Pasti", description: "Kepastian tanggal keberangkatan dan maskapai terbaik untuk kenyamanan Anda."}
          ]
        });
      }
    } catch (error: any) {
      toast.error('Gagal mengambil pengaturan website');
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleOpenWebsiteManager = (user: Profile) => {
    setWebsiteDialog({ open: true, user });
    fetchWebsiteSettings(user.user_id);
  };

  const handleSaveWebsiteSettings = async () => {
    if (!websiteDialog.user) return;
    
    try {
      setSavingSettings(true);
      await updateWebsiteSettings.mutateAsync({
        user_id: websiteDialog.user.user_id,
        ...websiteSettings
      });
      toast.success('Pengaturan website berhasil disimpan');
      setWebsiteDialog({ open: false, user: null });
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan website');
    } finally {
      setSavingSettings(false);
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
                        {user.role === 'agent' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenWebsiteManager(user)}
                            className="text-primary border-primary/20 hover:bg-primary/5"
                          >
                            <Globe className="h-4 w-4 mr-1" />
                            Manage Website
                          </Button>
                        )}
                        
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

      {/* Website Management Dialog */}
      <Dialog open={websiteDialog.open} onOpenChange={(open) => !open && setWebsiteDialog({ open: false, user: null })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Website Configurator: {websiteDialog.user?.full_name}
            </DialogTitle>
            <DialogDescription>
              Kelola tampilan dan konten website agent secara langsung.
            </DialogDescription>
          </DialogHeader>

          {loadingSettings ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : websiteSettings ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
              {/* Controls */}
              <div className="space-y-6">
                <Tabs defaultValue="branding">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="content">Konten</TabsTrigger>
                    <TabsTrigger value="visibility">Tampilan</TabsTrigger>
                  </TabsList>

                  <TabsContent value="branding" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Warna Tema Utama</Label>
                      <div className="flex items-center gap-3">
                        <Input 
                          type="color" 
                          className="w-12 h-10 p-1" 
                          value={websiteSettings.primary_color || '#0284c7'}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, primary_color: e.target.value})}
                        />
                        <Input 
                          type="text" 
                          value={websiteSettings.primary_color || '#0284c7'}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, primary_color: e.target.value})}
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Hero Image URL</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="https://images.unsplash.com/..." 
                          value={websiteSettings.hero_image_url || ''}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, hero_image_url: e.target.value})}
                        />
                        <Button variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Hero Title</Label>
                      <Input 
                        placeholder="Wujudkan Ibadah Suci Bersama Kami" 
                        value={websiteSettings.hero_title || ''}
                        onChange={(e) => setWebsiteSettings({...websiteSettings, hero_title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hero Description</Label>
                      <Textarea 
                        placeholder="Deskripsi singkat tentang layanan travel..." 
                        value={websiteSettings.hero_description || ''}
                        onChange={(e) => setWebsiteSettings({...websiteSettings, hero_description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Fitur Unggulan (JSON)</Label>
                      <Textarea 
                        value={JSON.stringify(websiteSettings.features_json, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setWebsiteSettings({...websiteSettings, features_json: parsed});
                          } catch (err) {}
                        }}
                        className="font-mono text-xs"
                        rows={8}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="visibility" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border">
                      <div className="space-y-0.5">
                        <Label>Publikasikan Website</Label>
                        <p className="text-xs text-muted-foreground">Aktifkan agar website bisa diakses publik</p>
                      </div>
                      <Switch 
                        checked={websiteSettings.is_published}
                        onCheckedChange={(checked) => setWebsiteSettings({...websiteSettings, is_published: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border">
                      <div className="space-y-0.5">
                        <Label>Tampilkan Statistik</Label>
                        <p className="text-xs text-muted-foreground">Tampilkan angka pencapaian travel</p>
                      </div>
                      <Switch 
                        checked={websiteSettings.show_stats}
                        onCheckedChange={(checked) => setWebsiteSettings({...websiteSettings, show_stats: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border">
                      <div className="space-y-0.5">
                        <Label>Tampilkan Fitur</Label>
                        <p className="text-xs text-muted-foreground">Tampilkan poin-poin keunggulan</p>
                      </div>
                      <Switch 
                        checked={websiteSettings.show_features}
                        onCheckedChange={(checked) => setWebsiteSettings({...websiteSettings, show_features: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border">
                      <div className="space-y-0.5">
                        <Label>Tampilkan Form Kontak</Label>
                        <p className="text-xs text-muted-foreground">Tampilkan form untuk inquiry jamaah</p>
                      </div>
                      <Switch 
                        checked={websiteSettings.show_contact_form}
                        onCheckedChange={(checked) => setWebsiteSettings({...websiteSettings, show_contact_form: checked})}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Live Preview */}
              <div className="border rounded-xl overflow-hidden bg-slate-50 flex flex-col">
                <div className="bg-slate-200 px-4 py-2 flex items-center justify-between border-b">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live Preview</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto max-h-[500px]">
                  <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200 scale-90 origin-top">
                    {/* Mock Website Preview */}
                    <div className="h-12 border-b flex items-center px-4 justify-between">
                      <div className="w-20 h-4 bg-slate-100 rounded" />
                      <div className="flex gap-2">
                        <div className="w-8 h-3 bg-slate-100 rounded" />
                        <div className="w-8 h-3 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="p-6 space-y-4" style={{ borderTop: `4px solid ${websiteSettings.primary_color || '#0284c7'}` }}>
                      <div className="space-y-2">
                        <div className="h-8 w-3/4 rounded font-bold text-lg leading-tight" style={{ color: websiteSettings.primary_color || '#0284c7' }}>
                          {websiteSettings.hero_title || 'Wujudkan Ibadah Suci Bersama Kami'}
                        </div>
                        <div className="h-12 w-full bg-slate-50 rounded text-[10px] p-2 text-slate-500">
                          {websiteSettings.hero_description || 'Deskripsi singkat tentang layanan travel...'}
                        </div>
                      </div>
                      <div className="h-24 w-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs italic">
                        Hero Image Area
                      </div>
                      {websiteSettings.show_features && (
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="p-2 border rounded bg-slate-50 space-y-1">
                              <div className="w-4 h-4 rounded-full mx-auto" style={{ backgroundColor: `${websiteSettings.primary_color || '#0284c7'}20` }} />
                              <div className="h-2 w-full bg-slate-200 rounded" />
                            </div>
                          ))}
                        </div>
                      )}
                      {websiteSettings.show_stats && (
                        <div className="p-3 bg-slate-900 rounded-lg flex justify-around">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="text-center">
                              <div className="text-[10px] font-bold text-white">100+</div>
                              <div className="text-[6px] text-slate-400">Jamaah</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setWebsiteDialog({ open: false, user: null })}>
              Batal
            </Button>
            <Button onClick={handleSaveWebsiteSettings} disabled={savingSettings}>
              <Save className="h-4 w-4 mr-2" />
              {savingSettings ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
