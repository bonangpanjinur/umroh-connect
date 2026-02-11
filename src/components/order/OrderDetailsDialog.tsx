import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShopOrder } from "@/types/shop";
import { format } from "date-fns";
import { Truck, UserCheck, Package } from "lucide-react";
import MerchantCourierAssignDialog from "../merchant/MerchantCourierAssignDialog";
import { useUpdateShopOrderStatus } from "@/hooks/useShopAdmin";

interface OrderDetailsDialogProps {
  order: ShopOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrderDetailsDialog = ({ order, open, onOpenChange }: OrderDetailsDialogProps) => {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const updateStatus = useUpdateShopOrderStatus();

  if (!order) return null;

  const handleSelfDelivery = () => {
    updateStatus.mutate({ id: order.id, status: 'shipped' });
    onOpenChange(false);
  };

  const handleCourierAssigned = (courierId: string) => {
    console.log(`Assigned courier ${courierId} to order ${order.id}`);
    updateStatus.mutate({ id: order.id, status: 'shipped' });
    // Di sini biasanya ada API call tambahan untuk menyimpan assignment kurir
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detail Pesanan #{order.order_code}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informasi Pelanggan */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Penerima</p>
                <p className="font-medium">{order.shipping_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Telepon</p>
                <p className="font-medium">{order.shipping_phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Alamat Pengiriman</p>
                <p className="font-medium">{order.shipping_address}</p>
              </div>
            </div>

            <Separator />

            {/* Daftar Item */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Daftar Produk</p>
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product_name} x{item.quantity}</span>
                  <span className="font-medium">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>Rp {order.total_amount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Tombol Aksi Merchant */}
            {order.status === 'paid' || order.status === 'processing' ? (
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setIsAssignDialogOpen(true)}
                >
                  <Truck className="h-4 w-4" />
                  Cari Kurir
                </Button>
                <Button 
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={handleSelfDelivery}
                >
                  <UserCheck className="h-4 w-4" />
                  Antar Sendiri
                </Button>
              </div>
            ) : (
              <div className="bg-muted p-3 rounded-lg text-center">
                <Badge variant="outline" className="capitalize">
                  Status: {order.status}
                </Badge>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MerchantCourierAssignDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        onAssign={handleCourierAssigned}
      />
    </>
  );
};

export default OrderDetailsDialog;
