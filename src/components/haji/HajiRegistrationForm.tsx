import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { 
  User, Phone, Mail, Calendar, MapPin, CreditCard, 
  FileText, Check, Loader2, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubmitHajiRegistration, PackageType, packageTypeLabels } from '@/hooks/useHaji';
import { toast } from 'sonner';
import { format } from 'date-fns';

const formSchema = z.object({
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  nik: z.string().length(16, 'NIK harus 16 digit'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  address: z.string().min(10, 'Alamat minimal 10 karakter').optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface HajiRegistrationFormProps {
  packageId: string;
  travelId: string;
  packageName: string;
  packageType: PackageType;
  minDp?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const requiredDocuments = [
  { key: 'ktp', label: 'KTP (Kartu Tanda Penduduk)' },
  { key: 'kk', label: 'Kartu Keluarga' },
  { key: 'passport', label: 'Paspor (jika sudah ada)' },
  { key: 'photo', label: 'Foto 4x6 Background Putih' },
  { key: 'health_certificate', label: 'Surat Keterangan Sehat' },
  { key: 'marriage_certificate', label: 'Akta Nikah (jika sudah menikah)' },
  { key: 'mahram_letter', label: 'Surat Mahram (untuk wanita)' },
];

export const HajiRegistrationForm = ({
  packageId,
  travelId,
  packageName,
  packageType,
  minDp = 0,
  onSuccess,
  onCancel,
}: HajiRegistrationFormProps) => {
  const { user, profile } = useAuthContext();
  const submitMutation = useSubmitHajiRegistration();
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: profile?.full_name || '',
      nik: '',
      phone: profile?.phone || '',
      email: user?.email || '',
      birthDate: '',
      address: '',
    },
  });

  const handleDocumentUpload = (key: string, path: string) => {
    setDocuments(prev => ({ ...prev, [key]: path }));
  };

  const handleDocumentRemove = (key: string) => {
    setDocuments(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        packageId,
        travelId,
        fullName: data.fullName,
        nik: data.nik,
        phone: data.phone,
        email: data.email || undefined,
        birthDate: data.birthDate,
        address: data.address || undefined,
        dpAmount: minDp,
      });

      toast.success('Pendaftaran haji berhasil dikirim!');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengirim pendaftaran');
    }
  };

  const uploadedDocsCount = Object.keys(documents).length;
  const requiredDocsCount = requiredDocuments.filter(d => 
    !['passport', 'marriage_certificate', 'mahram_letter'].includes(d.key)
  ).length;

  return (
    <div className="space-y-6">
      {/* Package Info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{packageName}</h3>
              <p className="text-sm text-muted-foreground">
                {packageTypeLabels[packageType]}
              </p>
              {minDp > 0 && (
                <p className="text-sm text-primary font-medium mt-1">
                  DP Minimal: Rp {minDp.toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Personal Data */}
          <Accordion type="single" collapsible defaultValue="personal">
            <AccordionItem value="personal" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    form.formState.isValid ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'
                  }`}>
                    {form.formState.isValid ? <Check className="w-4 h-4" /> : '1'}
                  </div>
                  <span className="font-medium">Data Pribadi</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap (Sesuai KTP)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} className="pl-10" placeholder="Nama lengkap" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nik"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIK (Nomor Induk Kependudukan)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              className="pl-10" 
                              placeholder="16 digit NIK"
                              maxLength={16}
                              inputMode="numeric"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. Telepon</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} className="pl-10" placeholder="08xxxxxxxx" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal Lahir</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} type="date" className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Opsional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} type="email" className="pl-10" placeholder="email@example.com" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat Lengkap (Opsional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Alamat sesuai KTP" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Step 2: Document Upload */}
            <AccordionItem value="documents" className="border rounded-lg mt-3">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    uploadedDocsCount >= requiredDocsCount ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {uploadedDocsCount >= requiredDocsCount ? <Check className="w-4 h-4" /> : '2'}
                  </div>
                  <span className="font-medium">Upload Dokumen</span>
                  <span className="text-xs text-muted-foreground ml-auto mr-2">
                    {uploadedDocsCount}/{requiredDocuments.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      Upload dokumen dalam format JPG, PNG, atau PDF. Dokumen bertanda (*) wajib diupload.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {requiredDocuments.map((doc) => {
                      const isOptional = ['passport', 'marriage_certificate', 'mahram_letter'].includes(doc.key);
                      return (
                        <DocumentUpload
                          key={doc.key}
                          bucket="haji-documents"
                          folder={user?.id || 'temp'}
                          label={`${doc.label}${isOptional ? '' : ' *'}`}
                          currentUrl={documents[doc.key]}
                          onUpload={(path) => handleDocumentUpload(doc.key, path)}
                          onRemove={() => handleDocumentRemove(doc.key)}
                        />
                      );
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Submit Button */}
          <div className="flex gap-3">
            {onCancel && (
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                Batal
              </Button>
            )}
            <Button 
              type="submit" 
              className="flex-1"
              disabled={submitMutation.isPending || !form.formState.isValid}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                'Kirim Pendaftaran'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
