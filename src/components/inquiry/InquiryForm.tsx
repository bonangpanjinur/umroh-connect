import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSubmitInquiry, inquirySchema, InquiryFormData } from '@/hooks/useInquiries';
import { useAuthContext } from '@/contexts/AuthContext';
import { PackageWithDetails, Departure } from '@/types/database';
import { toast } from 'sonner';
import { Loader2, Send, CheckCircle, User, Phone, Mail, Users, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface InquiryFormProps {
  package: PackageWithDetails;
  selectedDeparture?: Departure;
  onSuccess?: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export const InquiryForm = ({ package: pkg, selectedDeparture, onSuccess }: InquiryFormProps) => {
  const { user, profile } = useAuthContext();
  const submitInquiry = useSubmitInquiry();
  const [submitted, setSubmitted] = useState(false);
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | undefined>(
    selectedDeparture?.id
  );

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      fullName: profile?.full_name || '',
      phone: profile?.phone || '',
      email: '',
      message: '',
      numberOfPeople: 1,
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile?.full_name && !form.getValues('fullName')) {
      form.setValue('fullName', profile.full_name);
    }
    if (profile?.phone && !form.getValues('phone')) {
      form.setValue('phone', profile.phone);
    }
  }, [profile, form]);

  const onSubmit = async (data: InquiryFormData) => {
    try {
      await submitInquiry.mutateAsync({
        packageId: pkg.id,
        travelId: pkg.travel.id,
        departureId: selectedDepartureId,
        formData: data,
      });

      setSubmitted(true);
      toast.success('Inquiry berhasil dikirim! Travel akan segera menghubungi Anda.');
      onSuccess?.();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        toast.error('Data tidak valid. Periksa kembali form Anda.');
      } else {
        toast.error(error.message || 'Gagal mengirim inquiry');
      }
    }
  };

  if (submitted) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-8 text-center">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Inquiry Terkirim!</h3>
          <p className="text-sm text-muted-foreground">
            Tim dari {pkg.travel.name} akan segera menghubungi Anda melalui nomor telepon yang diberikan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4" />
          Kirim Inquiry
        </CardTitle>
        <CardDescription className="text-xs">
          Isi form berikut dan agen akan menghubungi Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Departure Selection */}
            {pkg.departures.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih Jadwal (Opsional)</label>
                <Select
                  value={selectedDepartureId}
                  onValueChange={setSelectedDepartureId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jadwal keberangkatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {pkg.departures.map((dep) => (
                      <SelectItem key={dep.id} value={dep.id}>
                        {format(new Date(dep.departure_date), 'd MMM yyyy', { locale: id })} - {formatPrice(dep.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Nama Lengkap
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nama sesuai KTP/Paspor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Nomor WhatsApp
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="08xxxxxxxxxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email (Opsional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="email@contoh.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numberOfPeople"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Jumlah Jamaah
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Pesan (Opsional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ada pertanyaan atau permintaan khusus?"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={submitInquiry.isPending}
            >
              {submitInquiry.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Kirim Inquiry
                </>
              )}
            </Button>

            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                Anda tidak perlu login untuk mengirim inquiry
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
