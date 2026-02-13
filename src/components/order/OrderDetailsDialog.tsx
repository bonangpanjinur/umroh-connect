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
import { Truck, UserCheck, Package, MapPin, Copy } from "lucide-react";
import MerchantCourierAssignDialog from "../merchant/MerchantCourierAssignDialog";
import { useUpdateShopOrderStatus } from "@/hooks/useShopAdmin";
import { toast } from "@/hooks/use-toast";

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
    updateStatus.mutate({ id: order.id, status: 'shipped' });
  };

  const copyTrackingNumber = () => {
    if (order.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      toast({ title: 'Nomor resi disalin' });
    }
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

            {/* Tracking Info */}
            {(order.tracking_number || order.courier) && (
              <>
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Truck className="h-4 w-4 text-primary" />
                    Informasi Pengiriman
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Kurir</p>
                      <p className="font-medium">{order.courier || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">No. Resi</p>
                      <div className="flex items-center gap-1">
                        <p className="font-mono font-medium">{order.tracking_number || '-'}</p>
                        {order.tracking_number && (
                          <button onClick={copyTrackingNumber} className="p-1 hover:bg-muted rounded">
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Bukti Pembayaran */}
            {order.payment_proof_url && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Bukti Pembayaran</p>
                  <img src={order.payment_proof_url} alt="Bukti bayar" className="w-full max-h-48 object-contain rounded-lg border bg-muted" />
                </div>
                <Separator />
              </>
            )}

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
