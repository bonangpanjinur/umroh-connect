import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  size?: 'sm' | 'default';
  className?: string;
}

const WishlistButton = ({ productId, size = 'sm', className }: WishlistButtonProps) => {
  const { user } = useAuthContext();
  const { isWished, toggleWishlist } = useWishlist();

  if (!user) return null;

  const wished = isWished(productId);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'rounded-full',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        toggleWishlist.mutate(productId);
      }}
      disabled={toggleWishlist.isPending}
    >
      <Heart
        className={cn(
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
          wished ? 'fill-destructive text-destructive' : 'text-muted-foreground'
        )}
      />
    </Button>
  );
};

export default WishlistButton;
