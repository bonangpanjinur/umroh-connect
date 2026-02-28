import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default' | 'icon';
}

const ShareButton = ({ title, text, url, className, variant = 'ghost', size = 'icon' }: ShareButtonProps) => {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = url || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error('Gagal membagikan');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${title}\n${text}\n${shareUrl}`);
        toast.success('Link disalin ke clipboard');
      } catch {
        toast.error('Gagal menyalin link');
      }
    }
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleShare} title="Bagikan">
      <Share2 className="h-4 w-4" />
    </Button>
  );
};

export default ShareButton;
