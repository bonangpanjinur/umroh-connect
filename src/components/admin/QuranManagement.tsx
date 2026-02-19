import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, Database, BookOpen, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const API_BASE = 'https://api.alquran.cloud/v1';

export const QuranManagement = () => {
  const [activeTab, setActiveTab] = useState('status');
  const [syncing, setSyncing] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);

  // Fetch stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['quran-admin-stats'],
    queryFn: async () => {
      const { count } = await supabase.from('quran_ayahs').select('*', { count: 'exact', head: true });
      const { data: surahs } = await supabase.from('quran_surahs').select('number, name, english_name, total_verses').order('number');
      
      // Fetch all ayahs counts by surah using a simpler query
      const { data: existingAyahs } = await supabase
        .from('quran_ayahs')
        .select('surah_number');
      
      const counts: Record<number, number> = {};
      existingAyahs?.forEach(a => {
        counts[a.surah_number] = (counts[a.surah_number] || 0) + 1;
      });

      return {
        totalAyahs: count || 0,
        surahs: surahs || [],
        counts,
      };
    }
  });

  // Fetch Sync Logs
  const { data: logs, refetch: refetchLogs } = useQuery({
    queryKey: ['quran-sync-logs'],
    queryFn: async () => {
      const { data } = await supabase.from('quran_sync_logs').select('*').order('started_at', { ascending: false }).limit(10);
      return data || [];
    }
  });

  const handleSync = async (mode: 'full' | 'surah', surahNumber?: number) => {
    try {
      setSyncing(true);
      
      if (mode === 'surah') {
        const { error } = await supabase.functions.invoke('sync-quran-data', {
          body: { mode, surah_number: surahNumber }
        });
        if (error) throw error;
        toast.success(`Sinkronisasi Surat ${surahNumber} berhasil`);
      } else {
        // Full sync in batches of 10 surahs to avoid timeouts
        const batchSize = 10;
        const totalSurahs = 114;
        let completed = 0;
        
        toast.info('Memulai sinkronisasi penuh dalam 12 batch...');
        
        for (let i = 1; i <= totalSurahs; i += batchSize) {
          const end = Math.min(i + batchSize - 1, totalSurahs);
          const { error } = await supabase.functions.invoke('sync-quran-data', {
            body: { 
              mode: 'full', 
              start_surah: i, 
              end_surah: end 
            }
          });
          
          if (error) {
            console.error(`Error syncing batch ${i}-${end}:`, error);
            toast.error(`Gagal pada batch ${i}-${end}: ${error.message}`);
            // Continue with next batch instead of failing everything
          } else {
            completed += (end - i + 1);
            // Optional: update progress UI if you have a progress state
          }
        }
        toast.success('Sinkronisasi penuh selesai');
      }

      // Refresh data
      refetchStats();
      refetchLogs();
      setSyncing(false);

    } catch (err: any) {
      console.error('Sync error:', err);
      toast.error('Gagal sinkronisasi: ' + err.message);
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Al-Quran</h2>
          <p className="text-muted-foreground">Kelola data ayat, terjemahan, dan sinkronisasi.</p>
        </div>
        <Button onClick={() => handleSync('full')} disabled={syncing}>
          {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sinkronisasi Penuh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="status">Status & Log</TabsTrigger>
          <TabsTrigger value="surahs">Daftar Surat</TabsTrigger>
          <TabsTrigger value="editor">Editor Ayat</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ayat Tersimpan</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAyahs || 0} / 6236</div>
                <Progress value={((stats?.totalAyahs || 0) / 6236) * 100} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kelengkapan Surat</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.surahs.filter(s => (stats.counts[s.number] || 0) === s.total_verses).length || 0} / 114
                </div>
                <p className="text-xs text-muted-foreground">Surat dengan data lengkap</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Sinkronisasi</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu Mulai</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ayat Disinkron</TableHead>
                    <TableHead>Pesan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.started_at).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{log.sync_type}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.ayahs_synced}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{log.error_message || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surahs">
          <Card>
            <CardHeader>
              <CardTitle>Status Kelengkapan per Surat</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Ayat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.surahs.map((surah) => {
                    const stored = stats.counts[surah.number] || 0;
                    const isComplete = stored === surah.total_verses;
                    return (
                      <TableRow key={surah.number}>
                        <TableCell>{surah.number}</TableCell>
                        <TableCell>
                          <div>{surah.english_name}</div>
                          <div className="text-xs text-muted-foreground">{surah.name}</div>
                        </TableCell>
                        <TableCell>{stored} / {surah.total_verses}</TableCell>
                        <TableCell>
                          {isComplete ? (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Lengkap</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                              {((stored / surah.total_verses) * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSync('surah', surah.number)}
                            disabled={syncing}
                          >
                            Sync
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedSurah(surah.number);
                              setActiveTab('editor');
                            }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor">
          <AyahEditor surahNumber={selectedSurah} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AyahEditor = ({ surahNumber }: { surahNumber: number | null }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editTrans, setEditTrans] = useState('');

  const { data: ayahs, refetch } = useQuery({
    queryKey: ['quran-admin-ayahs', surahNumber],
    queryFn: async () => {
      if (!surahNumber) return [];
      const { data } = await supabase
        .from('quran_ayahs')
        .select('*')
        .eq('surah_number', surahNumber)
        .order('ayah_number');
      return data || [];
    },
    enabled: !!surahNumber
  });

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quran_ayahs')
        .update({ arabic_text: editText, translation_id: editTrans })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Ayat disimpan');
      setEditingId(null);
      refetch();
    } catch (err: any) {
      toast.error('Gagal menyimpan: ' + err.message);
    }
  };

  if (!surahNumber) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Pilih surat dari tab "Daftar Surat" untuk mulai mengedit.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor Surat #{surahNumber}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ayahs?.map((ayah) => (
            <div key={ayah.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <Badge variant="secondary">Ayat {ayah.ayah_number}</Badge>
                {editingId === ayah.id ? (
                  <div className="space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Batal</Button>
                    <Button size="sm" onClick={() => handleSave(ayah.id)}>Simpan</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingId(ayah.id);
                    setEditText(ayah.arabic_text);
                    setEditTrans(ayah.translation_id || '');
                  }}>Edit</Button>
                )}
              </div>

              {editingId === ayah.id ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Arab</label>
                    <textarea 
                      className="w-full p-2 border rounded font-arabic text-right text-xl" 
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Terjemahan</label>
                    <textarea 
                      className="w-full p-2 border rounded" 
                      rows={3}
                      value={editTrans}
                      onChange={(e) => setEditTrans(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-right font-arabic text-2xl leading-loose">{ayah.arabic_text}</p>
                  <p className="text-muted-foreground text-sm">{ayah.translation_id}</p>
                </div>
              )}
            </div>
          ))}
          {ayahs?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data ayat untuk surat ini. Silakan lakukan sinkronisasi terlebih dahulu.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuranManagement;
