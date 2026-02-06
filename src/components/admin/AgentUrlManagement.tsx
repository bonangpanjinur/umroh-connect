import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { useAllAgentWebsiteSettings, useUpdateAgentWebsiteSettings } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { Search, Globe, CheckCircle, XCircle, ExternalLink, Clock, AlertCircle } from 'lucide-react';

export const AgentUrlManagement = () => {
  const { data: settings, isLoading } = useAllAgentWebsiteSettings();
  const updateSettings = useUpdateAgentWebsiteSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; setting: any }>({
    open: false,
    setting: null
  });
  const [adminNotes, setAdminNotes] = useState('');

  const filteredSettings = settings?.filter((s: any) => {
    const name = s.profile?.full_name?.toLowerCase() || '';
    const slug = s.custom_slug?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return name.includes(search) || slug.includes(search);
  });

  const handleApprove = async (setting: any) => {
    try {
      await updateSettings.mutateAsync({
        user_id: setting.user_id,
        slug_status: 'approved',
        slug: setting.custom_slug, // Set the actual slug to the requested custom_slug
        admin_notes: 'URL disetujui oleh admin'
      });
      toast.success('URL berhasil disetujui');
    } catch (error) {
      toast.error('Gagal menyetujui URL');
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.setting) return;
    
    try {
      await updateSettings.mutateAsync({
        user_id: rejectDialog.setting.user_id,
        slug_status: 'rejected',
        admin_notes: adminNotes
      });
      toast.success('URL ditolak');
      setRejectDialog({ open: false, setting: null });
      setAdminNotes('');
    } catch (error) {
      toast.error('Gagal menolak URL');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Disetujui
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" /> Ditolak
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Manajemen URL Custom Agent
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari agent atau URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Requested URL</TableHead>
                  <TableHead>Current URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan Admin</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSettings?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada pengajuan URL ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSettings?.map((setting: any) => (
                    <TableRow key={setting.user_id}>
                      <TableCell>
                        <div className="font-medium">{setting.profile?.full_name || 'Unknown Agent'}</div>
                        <div className="text-xs text-muted-foreground">{setting.profile?.phone || '-'}</div>
                      </TableCell>
                      <TableCell>
                      {setting.custom_slug ? (
                          <div className="flex items-center gap-1 text-primary font-mono text-xs">
                            /travel/{setting.custom_slug}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">Belum request</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          {setting.slug ? `/travel/${setting.slug}` : '-'}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(setting.slug_status)}</TableCell>
                      <TableCell>
                        <div className="text-sm max-w-[200px] truncate" title={setting.admin_notes}>
                          {setting.admin_notes || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {setting.slug_status === 'pending' && setting.custom_slug && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleApprove(setting)}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-destructive border-destructive/20 hover:bg-destructive/5"
                                onClick={() => {
                                  setRejectDialog({ open: true, setting });
                                  setAdminNotes('');
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {setting.slug_status === 'approved' && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={`/travel/${setting.slug}`} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
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
      </Card>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, setting: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pengajuan URL</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk agent {rejectDialog.setting?.profile?.full_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-sm font-medium">Alasan Penolakan</label>
            <Textarea 
              placeholder="Contoh: URL sudah digunakan atau mengandung kata yang tidak diperbolehkan."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, setting: null })}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!adminNotes}>Tolak URL</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
