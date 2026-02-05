import { useState, useEffect } from "react";
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
import { Loader2, X, Image as ImageIcon } from "lucide-react";
import { useCreatePackage, useUpdatePackage } from "@/hooks/useAgentData";
import { useHotels, useAirlines } from "@/hooks/useMasterData";
import { ImageUpload } from "@/components/common/ImageUpload";
import { Package } from "@/types/database";
import { Label } from "@/components/ui/label";

const packageSchema = z.object({
  name: z.string().min(3, "Nama paket minimal 3 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  duration_days: z.coerce.number().min(1, "Durasi minimal 1 hari"),
  package_type: z.enum(['umroh', 'haji_reguler', 'haji_plus', 'haji_furoda']),
  hotel_makkah: z.string().optional(),
  hotel_makkah_id: z.string().optional(),
  hotel_madinah: z.string().optional(),
  hotel_madinah_id: z.string().optional(),
  hotel_star: z.coerce.number().min(1).max(5),
  airline: z.string().optional(),
  airline_id: z.string().optional(),
  flight_type: z.enum(['direct', 'transit']),
  meal_type: z.enum(['fullboard', 'halfboard', 'breakfast']),
  is_active: z.boolean().default(true),
});

type PackageFormValues = z.infer<typeof packageSchema>;

interface PackageFormProps {
  onSuccess: () => void;
  initialData?: Package;
  travelId?: string;
}

export function PackageForm({ onSuccess, initialData, travelId }: PackageFormProps) {
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const { data: makkahHotels } = useHotels('Makkah');
  const { data: madinahHotels } = useHotels('Madinah');
  const { data: airlines } = useAirlines();
  
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>(initialData?.images || []);

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      duration_days: initialData?.duration_days || 9,
      package_type: initialData?.package_type || "umroh",
      hotel_makkah: initialData?.hotel_makkah || "",
      hotel_makkah_id: initialData?.hotel_makkah_id || undefined,
      hotel_madinah: initialData?.hotel_madinah || "",
      hotel_madinah_id: initialData?.hotel_madinah_id || undefined,
      hotel_star: initialData?.hotel_star || 3,
      airline: initialData?.airline || "",
      airline_id: initialData?.airline_id || undefined,
      flight_type: initialData?.flight_type || "direct",
      meal_type: initialData?.meal_type || "fullboard",
      is_active: initialData?.is_active ?? true,
    },
  });

  // Update text fields when master data is selected
  const selectedMakkahId = form.watch("hotel_makkah_id");
  const selectedMadinahId = form.watch("hotel_madinah_id");
  const selectedAirlineId = form.watch("airline_id");

  useEffect(() => {
    if (selectedMakkahId && makkahHotels) {
      const hotel = makkahHotels.find(h => h.id === selectedMakkahId);
      if (hotel) {
        form.setValue("hotel_makkah", hotel.name);
        form.setValue("hotel_star", hotel.star_rating);
      }
    }
  }, [selectedMakkahId, makkahHotels, form]);

  useEffect(() => {
    if (selectedMadinahId && madinahHotels) {
      const hotel = madinahHotels.find(h => h.id === selectedMadinahId);
      if (hotel) {
        form.setValue("hotel_madinah", hotel.name);
      }
    }
  }, [selectedMadinahId, madinahHotels, form]);

  useEffect(() => {
    if (selectedAirlineId && airlines) {
      const airline = airlines.find(a => a.id === selectedAirlineId);
      if (airline) {
        form.setValue("airline", airline.name);
      }
    }
  }, [selectedAirlineId, airlines, form]);

  const onSubmit = async (data: PackageFormValues) => {
    if (!travelId && !initialData?.travel_id) return;
    setIsLoading(true);

    try {
      const packageData = {
        ...data,
        travel_id: travelId || initialData?.travel_id,
        images: images,
        facilities: initialData?.facilities || [], // Keep existing or empty
      };

      if (initialData?.id) {
        await updatePackage.mutateAsync({ id: initialData.id, ...packageData });
      } else {
        await createPackage.mutateAsync(packageData);
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving package:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImage = (url: string) => {
    setImages((prev) => [...prev, url]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-4">
          <Label className="text-base font-bold flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Foto Paket & Galeri
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-border group">
                <img src={url} alt={`Package ${index}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="aspect-video">
              <ImageUpload
                bucket="package-images"
                folder="packages"
                onUpload={handleAddImage}
                className="h-full w-full"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Unggah foto hotel, pesawat, atau brosur paket (Maksimal 8 foto)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Paket *</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Umroh Akbar 2025" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="package_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Paket *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe paket" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="umroh">Umroh Reguler</SelectItem>
                    <SelectItem value="haji_reguler">Haji Reguler</SelectItem>
                    <SelectItem value="haji_plus">Haji Plus</SelectItem>
                    <SelectItem value="haji_furoda">Haji Furoda</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="duration_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durasi (Hari) *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="flight_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Penerbangan *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="direct">Direct (Langsung)</SelectItem>
                    <SelectItem value="transit">Transit</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meal_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Konsumsi *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fullboard">Fullboard</SelectItem>
                    <SelectItem value="halfboard">Halfboard</SelectItem>
                    <SelectItem value="breakfast">Breakfast Only</SelectItem>
                  </SelectContent>
                </Select>
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
              <FormLabel>Deskripsi Paket *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Jelaskan keunggulan paket Anda..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="hotel_makkah_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hotel Makkah</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Hotel Makkah" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {makkahHotels?.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.name} ({hotel.star_rating}★)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hotel_madinah_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hotel Madinah</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Hotel Madinah" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {madinahHotels?.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.name} ({hotel.star_rating}★)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hotel_star"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bintang Hotel *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bintang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="3">Bintang 3</SelectItem>
                    <SelectItem value="4">Bintang 4</SelectItem>
                    <SelectItem value="5">Bintang 5</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="airline_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maskapai</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Maskapai" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {airlines?.map((airline) => (
                    <SelectItem key={airline.id} value={airline.id}>
                      {airline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto px-8">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Simpan Perubahan" : "Buat Paket"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default PackageForm;
