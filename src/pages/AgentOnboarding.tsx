import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Building2, Phone, Mail, MapPin, FileText,
  CheckCircle, Loader2, Upload, Shield, Users, Globe, Sparkles
} from 'lucide-react';

const agentSchema = z.object({
  travel_name: z.string().trim().min(3, 'Nama travel minimal 3 karakter').max(100),
  phone: z.string().trim().min(10, 'Nomor telepon minimal 10 digit').max(15),
  whatsapp: z.string().trim().min(10, 'Nomor WhatsApp minimal 10 digit').max(15).optional().or(z.literal('')),
  email: z.string().trim().email('Email tidak valid').optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
});

type AgentFormData = z.infer<typeof agentSchema>;

const steps = [
  { id: 'info', title: 'Informasi Travel', icon: Building2 },
  { id: 'contact', title: 'Kontak & Alamat', icon: Phone },
  { id: 'documents', title: 'Dokumen Verifikasi', icon: FileText },
  { id: 'review', title: 'Konfirmasi', icon: CheckCircle },
];

const AgentOnboarding = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [documents, setDocuments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      travel_name: '',
      phone: profile?.phone || '',
      whatsapp: '',
      email: '',
      address: '',
      description: '',
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Login Diperlukan</h2>
        <p className="text-muted-foreground mb-6">Silakan login terlebih dahulu untuk mendaftar sebagai agen travel.</p>
        <Button onClick={() => navigate('/auth')}>Masuk / Daftar</Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
          <CheckCircle className="h-20 w-20 text-primary mx-auto mb-6" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Pendaftaran Terkirim!</h2>
        <p className="text-muted-foreground mb-2 max-w-md">
          Tim kami akan mereview dokumen dan informasi Anda. Proses verifikasi biasanya memakan waktu 1-3 hari kerja.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Anda akan mendapat notifikasi setelah proses review selesai.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>Kembali ke Beranda</Button>
          <Button onClick={() => navigate('/?tab=akun')}>Lihat Profil</Button>
        </div>
      </div>
    );
  }

  const handleNext = async () => {
    if (currentStep === 0) {
      const valid = await form.trigger(['travel_name', 'description']);
      if (!valid) return;
    }
    if (currentStep === 1) {
      const valid = await form.trigger(['phone', 'whatsapp', 'email', 'address']);
      if (!valid) return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    setSubmitting(true);
    try {
      const data = form.getValues();
      const { error } = await supabase.from('agent_applications').insert({
        user_id: user.id,
        travel_name: data.travel_name,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        address: data.address || null,
        description: data.description || null,
        documents: documents.length > 0 ? documents : null,
        status: 'pending',
      });

      if (error) throw error;
      setSubmitted(true);
      toast.success('Pendaftaran berhasil dikirim!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim pendaftaran');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentUpload = (url: string) => {
    setDocuments((prev) => [...prev, url]);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold">Informasi Travel Anda</h3>
              <p className="text-sm text-muted-foreground">Ceritakan tentang bisnis travel umroh Anda</p>
            </div>
            <FormField control={form.control} name="travel_name" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Nama Travel</FormLabel>
                <FormControl><Input placeholder="Contoh: Al-Hijrah Tour" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi Travel (Opsional)</FormLabel>
                <FormControl><Textarea placeholder="Ceritakan pengalaman dan keunggulan travel Anda..." rows={4} className="resize-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold">Informasi Kontak</h3>
              <p className="text-sm text-muted-foreground">Agar tim kami bisa menghubungi Anda</p>
            </div>
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4" /> Nomor Telepon *</FormLabel>
                <FormControl><Input placeholder="08xxxxxxxxxx" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="whatsapp" render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor WhatsApp</FormLabel>
                <FormControl><Input placeholder="08xxxxxxxxxx (opsional)" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</FormLabel>
                <FormControl><Input placeholder="email@travel.com (opsional)" type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Alamat Kantor</FormLabel>
                <FormControl><Textarea placeholder="Alamat kantor travel (opsional)" rows={2} className="resize-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold">Dokumen Verifikasi</h3>
              <p className="text-sm text-muted-foreground">Upload dokumen untuk mempercepat proses verifikasi</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-xl text-sm space-y-2">
              <p className="font-medium">Dokumen yang disarankan:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Surat Izin Usaha (SIUP/NIB)</li>
                <li>Izin PPIU dari Kemenag</li>
                <li>KTP Pemilik/Direktur</li>
                <li>Foto kantor travel</li>
              </ul>
            </div>
            <DocumentUpload
              label="Upload Dokumen"
              bucket="uploads"
              folder={`agent-docs/${user.id}`}
              onUpload={handleDocumentUpload}
              accept="image/*,.pdf"
              maxSizeMB={5}
            />
            {documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{documents.length} dokumen terupload</p>
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg text-sm">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate flex-1">Dokumen {i + 1}</span>
                    <button onClick={() => setDocuments(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive hover:text-destructive/80 text-xs">Hapus</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 3:
        const values = form.getValues();
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold">Konfirmasi Pendaftaran</h3>
              <p className="text-sm text-muted-foreground">Periksa kembali data Anda sebelum mengirim</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <div><span className="text-xs text-muted-foreground">Nama Travel</span><p className="font-medium">{values.travel_name}</p></div>
                {values.description && <div><span className="text-xs text-muted-foreground">Deskripsi</span><p className="text-sm">{values.description}</p></div>}
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-xs text-muted-foreground">Telepon</span><p className="text-sm">{values.phone}</p></div>
                  {values.whatsapp && <div><span className="text-xs text-muted-foreground">WhatsApp</span><p className="text-sm">{values.whatsapp}</p></div>}
                  {values.email && <div><span className="text-xs text-muted-foreground">Email</span><p className="text-sm">{values.email}</p></div>}
                </div>
                {values.address && <div><span className="text-xs text-muted-foreground">Alamat</span><p className="text-sm">{values.address}</p></div>}
                <div><span className="text-xs text-muted-foreground">Dokumen</span><p className="text-sm">{documents.length} file terupload</p></div>
              </div>
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Proses Selanjutnya:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Tim kami akan mereview pendaftaran Anda (1-3 hari kerja)</li>
                  <li>Jika disetujui, akun Anda akan di-upgrade ke Agent</li>
                  <li>Anda bisa langsung listing paket umroh di dashboard</li>
                </ol>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">Daftar sebagai Agen Travel</h1>
        </div>
      </div>

      {/* Benefits Banner */}
      {currentStep === 0 && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { icon: Users, label: 'Jangkau Jamaah', desc: 'Listing paket ke ribuan jamaah' },
              { icon: Globe, label: 'Website Gratis', desc: 'Website travel profesional' },
              { icon: Sparkles, label: 'Tools Lengkap', desc: 'Booking, chat, & analitik' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center p-3 bg-primary/5 rounded-xl border border-primary/10">
                <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs font-bold">{label}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {i < currentStep ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-1 transition-colors ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <Form {...form}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </Form>

            <div className="flex justify-between mt-8 gap-3">
              <Button variant="outline" onClick={currentStep === 0 ? () => navigate(-1) : handleBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1" />
                {currentStep === 0 ? 'Batal' : 'Kembali'}
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} className="flex-1">
                  Lanjut <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Kirim Pendaftaran
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentOnboarding;
