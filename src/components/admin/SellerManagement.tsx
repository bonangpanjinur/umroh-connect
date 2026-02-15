import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Store, Users } from 'lucide-react';

const SellerManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  // Fetch applications
  const { data: applications = [], isLoading: loadingApps } = useQuery({
    queryKey: ['admin-seller-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch active sellers
  const { data: sellers = [], isLoading: loadingSellers } = useQuery({
    queryKey: ['admin-seller-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Approve application
  const approveMutation = useMutation({
    mutationFn: async (app: any) => {
      // Update application
      const { error: appError } = await supabase
        .from('seller_applications')
        .update({
          status: 'approved',
          admin_notes: adminNotes[app.id] || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', app.id);
      if (appError) throw appError;

      // Create seller profile
      const { error: profileError } = await supabase
        .from('seller_profiles')
        .insert({
          user_id: app.user_id,
          shop_name: app.shop_name,
          shop_description: app.description,
          phone: app.phone,
          whatsapp: app.whatsapp,
          address: app.address,
        });
      if (profileError) throw profileError;

      // Add seller role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: app.user_id, role: 'seller' });
      if (roleError && !roleError.message.includes('duplicate')) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-seller-profiles'] });
      toast({ title: 'Seller disetujui! ✅' });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal menyetujui', description: error.message, variant: 'destructive' });
    },
  });

  // Reject application
  const rejectMutation = useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase
        .from('seller_applications')
        .update({
          status: 'rejected',
          admin_notes: adminNotes[appId] || 'Tidak memenuhi kriteria',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', appId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller-applications'] });
      toast({ title: 'Aplikasi ditolak' });
    },
  });

  const pendingApps = applications.filter((a: any) => a.status === 'pending');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications" className="gap-1.5">
            <Store className="h-4 w-4" />
            Pendaftaran
            {pendingApps.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {pendingApps.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sellers" className="gap-1.5">
            <Users className="h-4 w-4" />
            Seller Aktif
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4 mt-4">
          {loadingApps ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : applications.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada pendaftaran</CardContent></Card>
          ) : (
            applications.map((app: any) => (
              <Card key={app.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{app.shop_name}</h3>
                      <p className="text-sm text-muted-foreground">{app.phone} • {new Date(app.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    <Badge variant={app.status === 'pending' ? 'default' : app.status === 'approved' ? 'outline' : 'destructive'}>
                      {app.status}
                    </Badge>
                  </div>
                  {app.description && <p className="text-sm">{app.description}</p>}
                  {app.status === 'pending' && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Catatan admin (opsional)"
                        value={adminNotes[app.id] || ''}
                        onChange={e => setAdminNotes(n => ({ ...n, [app.id]: e.target.value }))}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveMutation.mutate(app)} disabled={approveMutation.isPending}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Setujui
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(app.id)} disabled={rejectMutation.isPending}>
                          <XCircle className="h-4 w-4 mr-1" /> Tolak
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sellers" className="space-y-4 mt-4">
          {loadingSellers ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : sellers.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada seller aktif</CardContent></Card>
          ) : (
            sellers.map((seller: any) => (
              <Card key={seller.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{seller.shop_name}</h3>
                      <p className="text-sm text-muted-foreground">{seller.city || '-'} • Rating: {seller.rating || 0}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {seller.is_verified && <Badge className="bg-green-500">Verified</Badge>}
                      <Badge variant={seller.is_active ? 'default' : 'secondary'}>
                        {seller.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SellerManagement;
