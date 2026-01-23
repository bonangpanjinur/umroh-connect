import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Trash2, Check, Loader2, 
  BookOpen, MapPin, Music, HardDrive, RefreshCw, 
  AlertTriangle, Wifi, WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import useOfflineManager from '@/hooks/useOfflineManager';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'Belum pernah';
  return format(new Date(dateStr), 'd MMM yyyy, HH:mm', { locale: idLocale });
};

interface DownloadCardProps {
  title: string;
  description: string;
  icon: typeof BookOpen;
  isDownloaded: boolean;
  count: number;
  size: number;
  lastSync: string | null;
  isDownloading: boolean;
  onDownload: () => void;
  onClear: () => void;
  extraInfo?: string;
}

const DownloadCard = ({
  title,
  description,
  icon: Icon,
  isDownloaded,
  count,
  size,
  lastSync,
  isDownloading,
  onDownload,
  onClear,
  extraInfo,
}: DownloadCardProps) => {
  return (
    <Card className={isDownloaded ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${
            isDownloaded 
              ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <Icon className="h-6 w-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{title}</h3>
              {isDownloaded && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                  <Check className="h-3 w-3 mr-1" /> Tersedia
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{description}</p>
            
            {isDownloaded && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{count} item • {formatBytes(size)}</p>
                {extraInfo && <p>{extraInfo}</p>}
                <p>Diunduh: {formatDate(lastSync)}</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            {isDownloaded ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Data Offline?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Data {title.toLowerCase()} akan dihapus dari perangkat. Anda perlu mengunduh ulang untuk mengakses tanpa internet.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={onClear} className="bg-destructive text-destructive-foreground">
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button 
                size="sm" 
                onClick={onDownload}
                disabled={isDownloading}
                className="gap-1"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Unduh
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OfflineManagerView = () => {
  const { toast } = useToast();
  const {
    status,
    isDownloading,
    downloadProgress,
    downloadPrayers,
    downloadManasik,
    downloadLocations,
    downloadAll,
    clearPrayers,
    clearManasik,
    clearLocations,
    clearAll,
  } = useOfflineManager();
  
  const [includeAudio, setIncludeAudio] = useState(true);
  
  const handleDownloadAll = async () => {
    try {
      await downloadAll(includeAudio);
      toast({
        title: 'Download Selesai',
        description: 'Semua konten berhasil diunduh untuk penggunaan offline.',
      });
    } catch (error) {
      toast({
        title: 'Download Gagal',
        description: 'Terjadi kesalahan saat mengunduh konten.',
        variant: 'destructive',
      });
    }
  };
  
  const handleClearAll = async () => {
    try {
      await clearAll();
      toast({
        title: 'Data Dihapus',
        description: 'Semua data offline berhasil dihapus.',
      });
    } catch (error) {
      toast({
        title: 'Gagal Menghapus',
        description: 'Terjadi kesalahan saat menghapus data.',
        variant: 'destructive',
      });
    }
  };
  
  const allDownloaded = status.prayers.downloaded && status.manasik.downloaded && status.locations.downloaded;
  const anyDownloaded = status.prayers.downloaded || status.manasik.downloaded || status.locations.downloaded;
  
  return (
    <div className="space-y-6 pb-24">
      {/* Connection Status */}
      <Card className={status.isOnline ? 'border-green-200 dark:border-green-800' : 'border-amber-200 dark:border-amber-800'}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {status.isOnline ? (
              <>
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Online</p>
                  <p className="text-sm text-muted-foreground">Koneksi internet tersedia</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                  <WifiOff className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Offline</p>
                  <p className="text-sm text-muted-foreground">
                    {anyDownloaded ? 'Menggunakan data tersimpan' : 'Tidak ada koneksi'}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Download Progress */}
      <AnimatePresence>
        {downloadProgress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-primary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="font-medium text-foreground">
                    Mengunduh {downloadProgress.type}...
                  </span>
                </div>
                <Progress 
                  value={(downloadProgress.current / downloadProgress.total) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {downloadProgress.current} / {downloadProgress.total}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Penyimpanan Offline
          </CardTitle>
          <CardDescription>
            {formatBytes(status.totalSize)} digunakan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Include Audio Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="include-audio" className="text-sm font-medium">
                Sertakan Audio Doa
              </Label>
              <p className="text-xs text-muted-foreground">
                Unduh file audio untuk mendengarkan offline
              </p>
            </div>
            <Switch
              id="include-audio"
              checked={includeAudio}
              onCheckedChange={setIncludeAudio}
            />
          </div>
          
          <Separator />
          
          {/* Download All Button */}
          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={handleDownloadAll}
            disabled={isDownloading || (allDownloaded && !includeAudio)}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengunduh...
              </>
            ) : allDownloaded ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Perbarui Semua
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Unduh Semua Konten
              </>
            )}
          </Button>
          
          {anyDownloaded && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/30">
                  <Trash2 className="h-4 w-4" />
                  Hapus Semua Data Offline
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Semua Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Semua data offline ({formatBytes(status.totalSize)}) akan dihapus. Anda tidak akan bisa mengakses konten tanpa internet.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground">
                    Hapus Semua
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
      
      {/* Individual Downloads */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground px-1">Konten Individual</h3>
        
        <DownloadCard
          title="Panduan Manasik"
          description="6 langkah manasik umroh dengan doa dan tips"
          icon={BookOpen}
          isDownloaded={status.manasik.downloaded}
          count={status.manasik.count}
          size={status.manasik.size}
          lastSync={status.manasik.lastSync}
          isDownloading={isDownloading && downloadProgress?.type === 'Panduan Manasik'}
          onDownload={downloadManasik}
          onClear={clearManasik}
        />
        
        <DownloadCard
          title="Lokasi Penting"
          description="Masjid, miqat, dan tempat ziarah di Makkah & Madinah"
          icon={MapPin}
          isDownloaded={status.locations.downloaded}
          count={status.locations.count}
          size={status.locations.size}
          lastSync={status.locations.lastSync}
          isDownloading={isDownloading && downloadProgress?.type === 'Lokasi Penting'}
          onDownload={downloadLocations}
          onClear={clearLocations}
        />
        
        <DownloadCard
          title="Doa & Dzikir"
          description="Koleksi doa harian dan dzikir umroh"
          icon={Music}
          isDownloaded={status.prayers.downloaded}
          count={status.prayers.count}
          size={status.prayers.size}
          lastSync={status.prayers.lastSync}
          isDownloading={isDownloading && (downloadProgress?.type === 'Doa & Dzikir' || downloadProgress?.type === 'Audio Doa')}
          onDownload={() => downloadPrayers(includeAudio)}
          onClear={clearPrayers}
          extraInfo={status.prayers.audioCount > 0 ? `${status.prayers.audioCount} audio tersimpan` : undefined}
        />
      </div>
      
      {/* Tips */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Tips Penggunaan Offline</p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                <li>• Unduh konten sebelum berangkat ke tanah suci</li>
                <li>• Data tersimpan di perangkat, tidak memakan kuota</li>
                <li>• Perbarui secara berkala untuk konten terbaru</li>
                <li>• Audio doa membutuhkan ruang penyimpanan lebih</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineManagerView;
