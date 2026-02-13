import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle, Image as ImageIcon } from 'lucide-react';

interface PaymentUploadDialogProps {
  orderId: string;
  orderCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingProofUrl?: string | null;
}

const PaymentUploadDialog = ({ orderId, orderCode, open, onOpenChange, onSuccess, existingProofUrl }: PaymentUploadDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingProofUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'File harus berupa gambar', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Ukuran file maksimal 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `payment-proof/${orderId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('shop-images')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shop-images')
        .getPublicUrl(fileName);

      // Update order with payment proof URL
      const { error: updateError } = await supabase
        .from('shop_orders')
        .update({ payment_proof_url: publicUrl })
        .eq('id', orderId);
      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      toast({ title: 'Bukti pembayaran berhasil diupload' });
      onSuccess();
    } catch (err: any) {
      toast({ title: 'Gagal upload bukti pembayaran', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Bukti Pembayaran - {orderCode}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border">
                <img src={previewUrl} alt="Bukti pembayaran" className="w-full max-h-64 object-contain bg-muted" />
              </div>
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckCircle className="h-4 w-4" />
                <span>Bukti pembayaran telah diupload</span>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Upload bukti transfer / pembayaran</p>
              <p className="text-xs mt-1">Format: JPG, PNG (maks 5MB)</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            className="w-full"
            variant={previewUrl ? 'outline' : 'default'}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Mengupload...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" />{previewUrl ? 'Ganti Bukti Bayar' : 'Upload Bukti Bayar'}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentUploadDialog;
