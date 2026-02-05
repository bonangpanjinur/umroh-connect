import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext as useAuth } from "@/contexts/AuthContext";
import { ImageUpload } from "@/components/common/ImageUpload";

const packageSchema = z.object({
  name: z.string().min(3, "Nama paket minimal 3 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  price: z.coerce.number().min(100000, "Harga tidak valid"),
  currency: z.string().default("IDR"),
  duration_days: z.coerce.number().min(1, "Durasi minimal 1 hari"),
  type: z.string().min(1, "Pilih tipe paket"),
  hotel_makkah: z.string().optional(),
  hotel_madinah: z.string().optional(),
  departure_date: z.date({ required_error: "Tanggal keberangkatan wajib diisi" }),
  quota: z.coerce.number().min(1, "Kuota minimal 1"),
  airline: z.string().optional(),
  program_type: z.string().optional(),
});

type PackageFormValues = z.infer<typeof packageSchema>;

interface PackageFormProps {
  onSuccess: () => void;
  initialData?: any;
}

export function PackageForm({ onSuccess, initialData }: PackageFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    initialData?.image_urls || []
  );

  // Helper function untuk mencegah crash pada Select component
  const safeSelectValue = (value: string | undefined | null) => {
    return value && value.trim() !== "" ? value : undefined;
  };

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      currency: initialData?.currency || "IDR",
      duration_days: initialData?.duration_days || 9,
      type: initialData?.type || "umroh",
      quota: initialData?.quota || 45,
      program_type: initialData?.program_type || "9_days",
      hotel_makkah: initialData?.hotel_makkah || "",
      hotel_madinah: initialData?.hotel_madinah || "",
      airline: initialData?.airline || "",
      departure_date: initialData?.departure_date 
        ? new Date(initialData.departure_date) 
        : undefined,
    },
  });

  const onSubmit = async (data: PackageFormValues) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const packageData = {
        ...data,
        agent_id: user.id,
        image_urls: uploadedImages,
        departure_date: data.departure_date.toISOString(),
      };

      let error;
      
      if (initialData?.id) {
        const { error: updateError } = await supabase
          .from("travel_packages")
          .update(packageData)
          .eq("id", initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("travel_packages")
          .insert(packageData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: initialData ? "Paket berhasil diperbarui" : "Paket berhasil ditambahkan",
      });
      onSuccess();
    } catch (error: any) {
      console.error("Error saving package:", error);
      toast({
        title: "Gagal",
        description: error.message || "Terjadi kesalahan saat menyimpan paket",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Paket</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Umroh Akbar 2025" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Paket</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={safeSelectValue(field.value)}
                  defaultValue={safeSelectValue(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe paket" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="umroh">Umroh Reguler</SelectItem>
                    <SelectItem value="haji">Haji Khusus</SelectItem>
                    <SelectItem value="tour">Wisata Halal</SelectItem>
                    <SelectItem value="plus">Umroh Plus</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Harga (IDR)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Contoh: 30000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durasi (Hari)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Deskripsi lengkap paket..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="departure_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tanggal Keberangkatan</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: id })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quota"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kuota</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="hotel_makkah"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hotel Makkah</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Hotel Makkah" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hotel_madinah"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hotel Madinah</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Hotel Madinah" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="airline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maskapai</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Saudi Arabian Airlines" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="program_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Program</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={safeSelectValue(field.value)}
                  defaultValue={safeSelectValue(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih program" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="9_days">9 Hari</SelectItem>
                    <SelectItem value="12_days">12 Hari</SelectItem>
                    <SelectItem value="15_days">15 Hari</SelectItem>
                    <SelectItem value="30_days">Ramadhan (30 Hari)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Simpan Perubahan" : "Buat Paket"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default PackageForm;
