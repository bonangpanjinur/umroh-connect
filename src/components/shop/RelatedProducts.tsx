import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShopProduct } from '@/types/shop';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ShoppingBag } from 'lucide-react';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface RelatedProductsProps {
  categoryId: string | null;
  currentProductId: string;
  onSelect: (product: ShopProduct) => void;
}

const RelatedProducts = ({ categoryId, currentProductId, onSelect }: RelatedProductsProps) => {
  const { data: products = [] } = useQuery({
    queryKey: ['related-products', categoryId, currentProductId],
    queryFn: async (): Promise<ShopProduct[]> => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from('shop_products')
        .select('*, category:shop_categories(*), seller:seller_profiles(id, shop_name, is_verified, rating)')
        .eq('category_id', categoryId)
        .neq('id', currentProductId)
        .eq('is_active', true)
        .limit(6);
      if (error) throw error;
      return (data || []) as unknown as ShopProduct[];
    },
    enabled: !!categoryId,
  });

  if (products.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-2">Produk Terkait</h4>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {products.map((p) => (
            <button
              key={p.id}
              className="w-28 shrink-0 rounded-lg border bg-card overflow-hidden text-left hover:shadow-md transition-shadow"
              onClick={() => onSelect(p)}
            >
              <div className="aspect-square bg-muted">
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="p-1.5">
                <p className="text-[10px] font-medium text-foreground line-clamp-2">{p.name}</p>
                <p className="text-[10px] font-bold text-primary mt-0.5">{formatRupiah(p.price)}</p>
              </div>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default RelatedProducts;
