import { useState, useRef } from 'react';
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MultiImageUploadProps {
  bucket: string;
  folder?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

const MultiImageUpload = ({
  bucket,
  folder = '',
  value = [],
  onChange,
  maxImages = 5,
  disabled = false,
  className,
}: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      toast({
        title: 'Batas tercapai',
        description: `Maksimal ${maxImages} gambar`,
        variant: 'destructive',
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error('File harus berupa gambar');
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Ukuran file maksimal 5MB');
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      onChange([...value, ...newUrls]);
      
      toast({
        title: 'Berhasil',
        description: `${newUrls.length} gambar berhasil diupload`,
      });
    } catch (error: any) {
      toast({
        title: 'Gagal upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (urlToRemove: string) => {
    // Extract filename from URL for deletion
    try {
      const url = new URL(urlToRemove);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf(bucket);
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        await supabase.storage.from(bucket).remove([filePath]);
      }
    } catch (err) {
      // Ignore deletion errors, still remove from array
    }
    
    onChange(value.filter(url => url !== urlToRemove));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-2">
        {value.map((url, index) => (
          <div key={url} className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
            <img
              src={url}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              disabled={disabled}
              className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {/* Add Button */}
        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-5 h-5" />
                <span className="text-[10px]">Tambah</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        {value.length}/{maxImages} gambar • Maks 5MB per gambar
      </p>
    </div>
  );
};

export default MultiImageUpload;
