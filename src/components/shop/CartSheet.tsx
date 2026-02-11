import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useShopCart } from '@/hooks/useShopCart';
import { ShoppingCart, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface CartSheetProps {
  onCheckout: () => void;
}

const CartSheet = ({ onCheckout }: CartSheetProps) => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useShopCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">{totalItems}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader><SheetTitle>Keranjang ({totalItems})</SheetTitle></SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <ShoppingBag className="h-12 w-12" />
            <p>Keranjang kosong</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 rounded-lg border">
                  <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                    {item.product.thumbnail_url ? (
                      <img src={item.product.thumbnail_url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground/30" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">{item.product.name}</h4>
                    <p className="text-sm font-semibold text-primary">{formatRupiah(item.product.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto text-destructive" onClick={() => removeItem.mutate(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatRupiah(totalPrice)}</span>
              </div>
              <Button className="w-full" onClick={onCheckout}>Checkout</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
