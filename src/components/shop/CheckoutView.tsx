import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useShopCart } from '@/hooks/useShopCart';
import { useShopOrders } from '@/hooks/useShopOrders';
import { toast } from '@/hooks/use-toast';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface CheckoutViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

const CheckoutView = ({ onBack, onSuccess }: CheckoutViewProps) => {
  const { items, totalPrice, clearCart } = useShopCart();
  const { createOrder } = useShopOrders();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!name || !phone || !address || !city) {
      toast({ title: 'Lengkapi data pengiriman', variant: 'destructive' });
      return;
    }
    if (items.length === 0) {
      toast({ title: 'Keranjang kosong', variant: 'destructive' });
      return;
    }

    createOrder.mutate({
      items: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productPrice: item.product.price,
        quantity: item.quantity,
      })),
      totalAmount: totalPrice,
      shippingName: name,
      shippingPhone: phone,
      shippingAddress: address,
      shippingCity: city,
      shippingPostalCode: postalCode,
      notes,
    }, {
      onSuccess: () => {
        clearCart.mutate();
        onSuccess();
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="font-bold text-lg">Checkout</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Order summary */}
        <Card>
          <CardHeader><CardTitle className="text-base">Ringkasan Pesanan</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product.name} x{item.quantity}</span>
                <span className="font-medium">{formatRupiah(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{formatRupiah(totalPrice)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Shipping form */}
        <Card>
          <CardHeader><CardTitle className="text-base">Data Pengiriman</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Nama Penerima</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>No. Telepon</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>Alamat Lengkap</Label><Textarea value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kota</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
              <div><Label>Kode Pos</Label><Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></div>
            </div>
            <div><Label>Catatan (opsional)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </CardContent>
        </Card>

        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={createOrder.isPending}>
          {createOrder.isPending ? 'Memproses...' : `Buat Pesanan - ${formatRupiah(totalPrice)}`}
        </Button>
      </div>
    </div>
  );
};

export default CheckoutView;
