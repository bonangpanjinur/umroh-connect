import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, X, Image as ImageIcon, Loader2, 
  CheckCircle2, Eye, Trash2, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentSchedule } from '@/hooks/useBookings';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface PaymentProofUploadProps {
  schedule: PaymentSchedule;
  bookingCode: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const PaymentProofUpload = ({ schedule, bookingCode, onSuccess, onCancel }: PaymentProofUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${bookingCode}-${schedule.id}-${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setUploadedPath(publicUrl);
      toast.success('Bukti pembayaran berhasil diupload');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengupload bukti pembayaran');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setUploadedPath(null);
  };

  const handleSubmit = async () => {
    if (!uploadedPath) {
      toast.error('Silakan upload bukti pembayaran terlebih dahulu');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update payment schedule with proof
      const { error } = await supabase
        .from('payment_schedules')
        .update({
          payment_proof_url: uploadedPath,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', schedule.id);

      if (error) throw error;

      toast.success('Bukti pembayaran berhasil dikirim! Menunggu verifikasi admin.');
      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Gagal mengirim bukti pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Payment Info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Pembayaran</p>
              <p className="font-bold text-foreground capitalize">
                {schedule.payment_type === 'dp' ? 'Down Payment' : 
                 schedule.payment_type === 'installment' ? 'Cicilan' : 'Pelunasan'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Jumlah</p>
              <p className="font-bold text-xl text-primary">
                {formatPrice(schedule.amount)}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-primary/20">
            <p className="text-xs text-muted-foreground">
              Jatuh tempo: {format(new Date(schedule.due_date), 'd MMMM yyyy', { locale: idLocale })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Upload Bukti Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {preview ? (
            <div className="relative">
              <img 
                src={preview} 
                alt="Payment proof preview" 
                className="w-full h-48 object-contain rounded-lg bg-secondary"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => window.open(preview, '_blank')}
                  className="w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-background"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRemoveImage}
                  className="w-8 h-8 bg-destructive/80 backdrop-blur text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {uploadedPath && (
                <div className="absolute bottom-2 left-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Terupload
                </div>
              )}
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Mengupload...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium text-foreground">Tap untuk upload</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG maks. 5MB
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Catatan (opsional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Transfer via BCA a.n. Ahmad"
              className="resize-none"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Batal
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!uploadedPath || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Mengirim...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Kirim Bukti
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default PaymentProofUpload;
