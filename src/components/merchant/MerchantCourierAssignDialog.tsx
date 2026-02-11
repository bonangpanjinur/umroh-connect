import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { calculateDistance } from "@/lib/utils";
import { MapPin, Truck, Check } from "lucide-react";

// Mock data kurir (Idealnya diambil dari database/hook)
const MOCK_COURIERS = [
  { id: '1', name: 'Budi Santoso', lat: -6.2088, lon: 106.8456, status: 'available' },
  { id: '2', name: 'Andi Wijaya', lat: -6.2146, lon: 106.8451, status: 'available' },
  { id: '3', name: 'Siti Aminah', lat: -6.1751, lon: 106.8650, status: 'busy' },
];

interface MerchantCourierAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (courierId: string) => void;
  merchantLocation?: { lat: number; lon: number };
}

const MerchantCourierAssignDialog = ({
  open,
  onOpenChange,
  onAssign,
  merchantLocation = { lat: -6.2000, lon: 106.8166 } // Default Jakarta
}: MerchantCourierAssignDialogProps) => {
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);

  // Filter kurir available dan hitung jarak
  const availableCouriers = MOCK_COURIERS
    .filter(c => c.status === 'available')
    .map(c => ({
      ...c,
      distance: calculateDistance(
        merchantLocation.lat,
        merchantLocation.lon,
        c.lat,
        c.lon
      )
    }))
    .sort((a, b) => a.distance - b.distance);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pilih Kurir Terdekat</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="mt-4 h-[300px] pr-4">
          <div className="space-y-3">
            {availableCouriers.map((courier) => (
              <div
                key={courier.id}
                onClick={() => setSelectedCourier(courier.id)}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedCourier === courier.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{courier.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{courier.distance.toFixed(2)} km</span>
                    </div>
                  </div>
                </div>
                {selectedCourier === courier.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))}
            {availableCouriers.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Tidak ada kurir yang tersedia saat ini.
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button 
            disabled={!selectedCourier} 
            onClick={() => {
              if (selectedCourier) {
                onAssign(selectedCourier);
                onOpenChange(false);
              }
            }}
          >
            Tugaskan Kurir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MerchantCourierAssignDialog;
