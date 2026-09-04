import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building2, Copy, KeyRound, RefreshCw, ShieldOff } from 'lucide-react';

type Installation = { id: string; base_url: string; environment: string; status: string; app_version?: string | null; last_heartbeat_at?: string | null };
type Tenant = { id: string; name: string; slug: string; custom_domain?: string | null; status: string; tenant_installations?: Installation[] };
type Credential = { key_id: string; secret: string; scopes: string[] };

const invoke = async (payload?: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('tenant-admin', { body: payload ?? { action: 'list' } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error.message || data.error.code);
  return data as { data: Tenant[] | { tenant: Tenant; installation: Installation; credential: Credential } | Record<string, unknown> };
};

export const TenantOnboarding = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [credential, setCredential] = useState<Credential | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', base_url: '', custom_domain: '' });

  const load = useCallback(async () => {
    try {
      const response = await invoke();
      setTenants((response.data as Tenant[]) || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memuat tenant');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createTenant = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await invoke({ action: 'create', ...form, environment: 'production' });
      const result = response.data as { credential: Credential };
      setCredential(result.credential);
      setForm({ name: '', slug: '', base_url: '', custom_domain: '' });
      await load();
      toast.success('Tenant dan installation berhasil dibuat');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Gagal membuat tenant'); }
    finally { setSaving(false); }
  };

  const mutateCredential = async (action: 'rotate' | 'revoke', installation_id: string) => {
    try {
      const response = await invoke({ action, installation_id });
      const data = response.data as { credential?: Credential };
      if (data.credential) setCredential(data.credential);
      await load();
      toast.success(action === 'rotate' ? 'Credential berhasil dirotasi' : 'Credential berhasil dicabut');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Operasi credential gagal'); }
  };

  const copy = async (value: string) => { await navigator.clipboard.writeText(value); toast.success('Disalin ke clipboard'); };

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Tenant Registry & Onboarding</h2><p className="text-muted-foreground">Hubungkan satu instalasi sistem travel ke satu tenant pusat.</p></div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Daftarkan instalasi travel</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createTenant} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Nama travel</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Travel Rahmah" /></div>
            <div className="space-y-2"><Label>Slug tenant</Label><Input required pattern="[a-z0-9-]+" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} placeholder="rahmah" /></div>
            <div className="space-y-2"><Label>Base URL instalasi</Label><Input required type="url" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://rahmah.com" /></div>
            <div className="space-y-2"><Label>Custom domain katalog (opsional)</Label><Input value={form.custom_domain} onChange={(e) => setForm({ ...form, custom_domain: e.target.value })} placeholder="rahmah.com" /></div>
            <div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Buat tenant dan credential'}</Button></div>
          </form>
        </CardContent>
      </Card>
      {credential && <Card className="border-amber-500/50"><CardHeader><CardTitle className="flex items-center gap-2 text-amber-700"><KeyRound className="h-5 w-5" />Credential ditampilkan satu kali</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Simpan secret berikut di backend instalasi travel. Secret tidak dapat dilihat kembali setelah panel ini ditutup.</p><div className="grid gap-2 md:grid-cols-2"><code className="rounded bg-muted p-3 text-sm break-all">Key: {credential.key_id}</code><code className="rounded bg-muted p-3 text-sm break-all">Secret: {credential.secret}</code></div><Button variant="outline" onClick={() => void copy(`X-Integration-Key: ${credential.key_id}\nSecret: ${credential.secret}`)}><Copy className="mr-2 h-4 w-4" />Salin credential</Button></CardContent></Card>}
      <Card><CardHeader><CardTitle>Installation terdaftar</CardTitle></CardHeader><CardContent>{loading ? <p className="text-muted-foreground">Memuat...</p> : tenants.length === 0 ? <p className="text-muted-foreground">Belum ada tenant.</p> : <div className="space-y-3">{tenants.map((tenant) => tenant.tenant_installations?.map((installation) => <div key={installation.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-medium">{tenant.name} <span className="text-muted-foreground">({tenant.slug})</span></p><p className="text-sm text-muted-foreground">{installation.base_url}</p><p className="text-xs text-muted-foreground">Heartbeat: {installation.last_heartbeat_at ? new Date(installation.last_heartbeat_at).toLocaleString('id-ID') : 'belum ada'}</p></div><div className="flex items-center gap-2"><Badge variant={installation.status === 'connected' ? 'default' : 'secondary'}>{installation.status}</Badge><Button size="sm" variant="outline" onClick={() => void mutateCredential('rotate', installation.id)}><RefreshCw className="mr-1 h-3 w-3" />Rotasi</Button><Button size="sm" variant="destructive" onClick={() => void mutateCredential('revoke', installation.id)}><ShieldOff className="mr-1 h-3 w-3" />Cabut</Button></div></div>))}</div>}</CardContent></Card>
    </div>
  );
};
