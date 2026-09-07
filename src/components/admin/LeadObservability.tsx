import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Activity, AlertTriangle, CheckCircle2, Clock3, RefreshCw, RotateCcw, Users } from 'lucide-react';

type Metrics = { leads: Record<string, number>; deliveries: Record<string, number>; installations: Record<string, number>; sync_events: Record<string, number>; generated_at: string };
type Delivery = { id: string; status: string; attempts: number; last_error?: string | null; updated_at: string };
type Lead = { id: string; full_name: string; phone: string; email?: string | null; status: string; created_at: string; tenant_registry?: { name?: string; slug?: string } | null; central_catalog_products?: { name?: string } | null; central_lead_deliveries?: Delivery[] };

const invoke = async (payload: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('lead-admin', { body: payload });
  if (error) throw error;
  if (data?.error) throw new Error(data.error.message || data.error.code);
  return data;
};

const Metric = ({ title, value, icon: Icon, tone = 'text-primary' }: { title: string; value: number; icon: typeof Activity; tone?: string }) => <Card><CardContent className="flex items-center gap-3 p-4"><Icon className={`h-5 w-5 ${tone}`} /><div><p className="text-xs text-muted-foreground">{title}</p><p className="text-2xl font-bold">{value}</p></div></CardContent></Card>;

export const LeadObservability = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [metricData, leadData] = await Promise.all([invoke({ action: 'metrics' }), invoke({ action: 'list', limit: 100 })]);
      setMetrics(metricData.data); setLeads(leadData.data || []);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Gagal memuat observability lead'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const retry = async (deliveryId: string) => {
    setRetrying(deliveryId);
    try { await invoke({ action: 'retry', delivery_id: deliveryId }); toast.success('Delivery dijadwalkan untuk retry'); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Retry gagal'); }
    finally { setRetrying(null); }
  };

  const pending = metrics?.deliveries?.pending || 0;
  const failed = (metrics?.deliveries?.rejected || 0) + (metrics?.deliveries?.dead_letter || 0);
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold">Lead Observability</h2><p className="text-muted-foreground">Pantau intake, routing, delivery, dan kesehatan installation travel.</p></div><Button variant="outline" onClick={() => void load()} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button></div>
    {loading ? <Card><CardContent className="p-6 text-muted-foreground">Memuat dashboard...</CardContent></Card> : <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric title="Total lead" value={metrics?.leads?.total || 0} icon={Users} /><Metric title="Pending delivery" value={pending} icon={Clock3} tone="text-amber-600" /><Metric title="Accepted" value={metrics?.deliveries?.accepted || 0} icon={CheckCircle2} tone="text-green-600" /><Metric title="Rejected / dead-letter" value={failed} icon={AlertTriangle} tone="text-destructive" /></div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Delivery lead terbaru</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Lead</TableHead><TableHead>Tenant</TableHead><TableHead>Produk</TableHead><TableHead>Lead status</TableHead><TableHead>Delivery</TableHead><TableHead>Error</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{leads.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Belum ada lead.</TableCell></TableRow> : leads.map((lead) => (lead.central_lead_deliveries || []).map((delivery) => <TableRow key={delivery.id}><TableCell><p className="font-medium">{lead.full_name}</p><p className="text-xs text-muted-foreground">{lead.phone}</p></TableCell><TableCell>{lead.tenant_registry?.name || lead.tenant_registry?.slug || '-'}</TableCell><TableCell>{lead.central_catalog_products?.name || '-'}</TableCell><TableCell><Badge variant="outline">{lead.status}</Badge></TableCell><TableCell><Badge variant={delivery.status === 'accepted' ? 'default' : delivery.status === 'dead_letter' || delivery.status === 'rejected' ? 'destructive' : 'secondary'}>{delivery.status}</Badge><p className="mt-1 text-xs text-muted-foreground">attempt {delivery.attempts}</p></TableCell><TableCell className="max-w-[220px] truncate text-xs text-destructive">{delivery.last_error || '-'}</TableCell><TableCell>{['rejected', 'dead_letter'].includes(delivery.status) && <Button size="sm" variant="outline" disabled={retrying === delivery.id} onClick={() => void retry(delivery.id)}><RotateCcw className="mr-1 h-3 w-3" />Retry</Button>}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
      <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle className="text-sm">Installation</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{metrics?.installations?.connected || 0} <span className="text-sm font-normal text-muted-foreground">connected</span></p><p className="text-sm text-muted-foreground">{metrics?.installations?.degraded || 0} degraded · {metrics?.installations?.disabled || 0} disabled</p></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Lead pipeline</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{metrics?.leads?.queued || 0}</p><p className="text-sm text-muted-foreground">queued · {metrics?.leads?.accepted || 0} accepted</p></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Sync events</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{metrics?.sync_events?.processed || 0}</p><p className="text-sm text-muted-foreground">processed · {metrics?.sync_events?.failed || 0} failed · generated {metrics?.generated_at ? new Date(metrics.generated_at).toLocaleTimeString('id-ID') : '-'}</p></CardContent></Card></div>
    </>}
  </div>;
};
