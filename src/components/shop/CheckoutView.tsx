import { useState, useMemo } from 'react';
import { ArrowLeft, Copy, CheckCircle2, Upload, CreditCard, Building2, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useShopCart } from '@/hooks/useShopCart';
import { useShopOrders } from '@/hooks/useShopOrders';
import { usePublicPaymentConfig } from '@/hooks/usePublicPaymentConfig';
import { useSellerShippingCosts } from '@/hooks/useShopSellers';
import { toast } from '@/hooks/use-toast';
import PaymentUploadDialog from '@/components/shop/PaymentUploadDialog';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface CheckoutViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

const CheckoutView = ({ onBack, onSuccess }: CheckoutViewProps) => {
  const { items, totalPrice, clearCart } = useShopCart();
  const { createOrder } = useShopOrders();
  const { data: paymentConfig } = usePublicPaymentConfig();

  // Get unique seller IDs from cart items
  const sellerIds = useMemo(() => {
    const ids = items.map(i => i.product.seller_id).filter(Boolean) as string[];
    return [...new Set(ids)];
  }, [items]);
  const { data: sellerShipping = [] } = useSellerShippingCosts(sellerIds);

  const shippingTotal = useMemo(() => {
    return sellerShipping.reduce((sum, s) => sum + ((s as any).shipping_cost || 0), 0);
  }, [sellerShipping]);

  const grandTotal = totalPrice + shippingTotal;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [stockChecking, setStockChecking] = useState(false);

  // Post-order state
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; order_code: string; total_amount: number } | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleSubmit = async () => {
    if (!name || !phone || !address || !city) {
      toast({ title: 'Lengkapi data pengiriman', variant: 'destructive' });
      return;
    }
    if (items.length === 0) {
      toast({ title: 'Keranjang kosong', variant: 'destructive' });
      return;
    }

    setStockChecking(true);
    try {
      const productIds = items.map(i => i.product.id);
      const { data: currentProducts, error } = await supabase
        .from('shop_products')
        .select('id, name, stock')
        .in('id', productIds);
      if (error) throw error;

      const outOfStock: string[] = [];
      for (const item of items) {
        const current = currentProducts?.find(p => p.id === item.product.id);
        if (!current || current.stock < item.quantity) {
          outOfStock.push(`${item.product.name} (stok: ${current?.stock ?? 0}, diminta: ${item.quantity})`);
        }
      }
      if (outOfStock.length > 0) {
        toast({ title: 'Stok tidak mencukupi', description: outOfStock.join(', '), variant: 'destructive' });
        setStockChecking(false);
        return;
      }
    } catch {
      toast({ title: 'Gagal mengecek stok', variant: 'destructive' });
      setStockChecking(false);
      return;
    }
    setStockChecking(false);

    createOrder.mutate({
      items: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productPrice: item.product.price,
        quantity: item.quantity,
      })),
      totalAmount: grandTotal,
      shippingName: name,
      shippingPhone: phone,
      shippingAddress: address,
      shippingCity: city,
      shippingPostalCode: postalCode,
      notes,
    }, {
      onSuccess: (order) => {
        clearCart.mutate();
        setCreatedOrder(order as any);
        setOrderSuccess(true);
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Disalin ke clipboard!' });
  };

  // ── Post-order: payment info screen ──
  if (orderSuccess && createdOrder) {
    const methods = paymentConfig?.paymentMethods?.filter(m => m.enabled) || [];
    const qrisUrl = paymentConfig?.qrisImageUrl;

    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
          <button onClick={onSuccess} className="p-2 rounded-full hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
          <h2 className="font-bold text-lg">Pesanan Dibuat</h2>
        </div>

        <div className="p-4 space-y-4">
          {/* Success banner */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Pesanan berhasil dibuat!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Kode: <span className="font-mono font-bold">{createdOrder.order_code}</span>
                </p>
                <p className="text-lg font-bold text-primary mt-1">{formatRupiah(createdOrder.total_amount)}</p>
                {paymentConfig && (paymentConfig as any).paymentDeadlineHours && (
                  <p className="text-xs text-destructive mt-1 font-medium">
                    ⏰ Bayar sebelum {(paymentConfig as any).paymentDeadlineHours} jam dari sekarang
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment methods */}
          {methods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Transfer ke Rekening
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {methods.map((method) => (
                  <div key={method.id} className="p-3 border rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{method.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{method.type.replace('_', ' ')}</span>
                    </div>
                    {method.accountNumber && (
                      <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                        <span className="font-mono text-sm font-bold">{method.accountNumber}</span>
                        <button onClick={() => copyToClipboard(method.accountNumber!)} className="text-primary">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {method.accountName && (
                      <p className="text-xs text-muted-foreground">a.n. {method.accountName}</p>
                    )}
                    {method.instructions && (
                      <p className="text-xs text-muted-foreground mt-1">{method.instructions}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* QRIS */}
          {qrisUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Bayar via QRIS
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <img src={qrisUrl} alt="QRIS" className="max-w-[240px] rounded-lg border" />
              </CardContent>
            </Card>
          )}

          {methods.length === 0 && !qrisUrl && (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Hubungi admin untuk informasi pembayaran.
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Bukti Bayar
            </Button>
            <Button variant="outline" onClick={onSuccess}>Kembali</Button>
          </div>
        </div>

        <PaymentUploadDialog
          orderId={createdOrder.id}
          orderCode={createdOrder.order_code}
          open={showUpload}
          onOpenChange={setShowUpload}
          onSuccess={() => { setShowUpload(false); onSuccess(); }}
        />
      </div>
    );
  }

  // ── Checkout form ──
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="font-bold text-lg">Checkout</h2>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Ringkasan Pesanan</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product.name} x{item.quantity}</span>
                <span className="font-medium">{formatRupiah(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">{formatRupiah(totalPrice)}</span>
            </div>
            {shippingTotal > 0 ? (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Ongkir</span>
                <span className="font-medium">{formatRupiah(shippingTotal)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Ongkir</span>
                <span>Gratis / Hubungi seller</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{formatRupiah(grandTotal)}</span>
            </div>
          </CardContent>
        </Card>

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

        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={createOrder.isPending || stockChecking}>
          {stockChecking ? 'Mengecek stok...' : createOrder.isPending ? 'Memproses...' : `Buat Pesanan - ${formatRupiah(grandTotal)}`}
        </Button>
      </div>
    </div>
  );
};

export default CheckoutView;
