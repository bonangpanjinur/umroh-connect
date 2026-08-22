import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { coreApi } from '@/lib/coreApi';
import { toast } from 'sonner';
import { Upload, X, Loader2, FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

type PrivateDocumentPurpose = 'haji_registration' | 'tenant_application';
type PrivateDocumentType = 'passport' | 'ktp' | 'family_card' | 'photo' | 'vaccination' | 'visa' | 'mahram_letter' | 'other';

interface DocumentUploadProps {
  purpose: PrivateDocumentPurpose;
  documentType?: PrivateDocumentType;
  label: string;
  currentUrl?: string | null;
  onUpload: (documentId: string) => void;
  onRemove?: () => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

function contentType(file: File): 'image/jpeg' | 'image/png' | 'application/pdf' | null {
  if (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'application/pdf') return file.type;
  return null;
}

const DocumentUpload = ({ purpose, documentType = 'other', label, currentUrl, onUpload, onRemove, accept = 'image/*,.pdf', maxSizeMB = 5, className }: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(currentUrl ? currentUrl.split('/').pop() || null : null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) { toast.error(`Ukuran file maksimal ${maxSizeMB}MB`); return; }
    const type = contentType(file); if (!type) { toast.error('Format file harus JPG, PNG, atau PDF'); return; }
    setUploading(true);
    try {
      const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      const result = await coreApi.uploadPrivateUserDocument({ purpose, document_type: documentType, data, contentType: type, filename: file.name });
      const documentId = String(result.id);
      setFileName(file.name); onUpload(documentId); toast.success('Dokumen berhasil diupload secara privat');
    } catch (error) { console.error('Core private document upload error:', error); toast.error('Gagal mengupload dokumen'); }
    finally { setUploading(false); }
  };

  const handleView = async () => {
    if (!currentUrl) return;
    try { const documents = await coreApi.listPrivateUserDocuments(purpose); const document = documents.find((item) => String(item.id) === currentUrl); const signed = document?.signed_url; if (!signed) throw new Error('Dokumen tidak ditemukan'); window.open(String(signed), '_blank', 'noopener,noreferrer'); }
    catch (error) { console.error('Core private document view error:', error); toast.error('Gagal membuka dokumen'); }
  };

  return <div className={cn('space-y-2', className)}>
    <label className="text-sm font-medium text-foreground">{label}</label>
    <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" disabled={uploading} />
    {currentUrl || fileName ? <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border"><FileText className="h-5 w-5 text-primary flex-shrink-0" /><span className="text-sm text-foreground truncate flex-1">{fileName || 'Dokumen terupload'}</span><div className="flex gap-1">{currentUrl && <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={handleView}><Eye className="h-4 w-4" /></Button>}<Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setFileName(null); onRemove?.(); if (fileInputRef.current) fileInputRef.current.value = ''; }}><X className="h-4 w-4" /></Button></div></div> : <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full p-4 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors bg-muted/50 flex items-center justify-center gap-2 cursor-pointer">{uploading ? <><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /><span className="text-sm text-muted-foreground">Mengupload...</span></> : <><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Klik untuk upload (Max {maxSizeMB}MB)</span></>}</button>}
  </div>;
};

export { DocumentUpload };
