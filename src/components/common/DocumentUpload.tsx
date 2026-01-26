import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Loader2, FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  bucket: string;
  folder: string;
  label: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export const DocumentUpload = ({
  bucket,
  folder,
  label,
  currentUrl,
  onUpload,
  onRemove,
  accept = 'image/*,.pdf',
  maxSizeMB = 5,
  className,
}: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(
    currentUrl ? currentUrl.split('/').pop() || null : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Ukuran file maksimal ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${uniqueName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get URL (for private bucket, we use signed URL or path)
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setFileName(file.name);
      onUpload(filePath); // Store path instead of full URL for private bucket
      toast.success('Dokumen berhasil diupload');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Gagal mengupload dokumen');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFileName(null);
    onRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleView = async () => {
    if (!currentUrl) return;
    
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(currentUrl, 3600); // 1 hour expiry
      
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      toast.error('Gagal membuka dokumen');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {currentUrl || fileName ? (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground truncate flex-1">
            {fileName || 'Dokumen terupload'}
          </span>
          <div className="flex gap-1">
            {currentUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleView}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full p-4 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors bg-muted/50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Mengupload...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Klik untuk upload (Max {maxSizeMB}MB)
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
