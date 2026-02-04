import { useParams, useNavigate } from 'react-router-dom';
import { usePage } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const PageDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading, error } = usePage(slug || '');

  useEffect(() => {
    if (page) {
      document.title = `${page.meta_title || page.title} | Arah Umroh`;
      
      // Update meta tags if they exist
      if (page.meta_description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', page.meta_description);
      }
    }
  }, [page]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !page || !page.is_active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-6">Halaman tidak ditemukan atau telah dinonaktifkan.</p>
        <Button onClick={() => navigate('/')}>Kembali ke Beranda</Button>
      </div>
    );
  }

  // Check if content is a full HTML document (custom landing page)
  const isFullHtml = page.content?.includes('<!DOCTYPE html>') || page.content?.includes('<html');

  if (isFullHtml) {
    return (
      <div className="min-h-screen w-full bg-white relative">
        <iframe
          key={page.id}
          srcDoc={page.content || ''}
          title={page.title}
          className="w-full h-screen border-none"
          sandbox="allow-scripts allow-same-origin allow-forms"
          style={{ display: 'block' }}
        />
        {/* Floating back button for custom landing pages */}
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 bg-white/80 backdrop-blur-sm hover:bg-white"
          onClick={() => navigate(-1)}
          title="Kembali"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold truncate">{page.title}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {page.image_url && (
          <div className="mb-8 rounded-xl overflow-hidden aspect-video shadow-sm">
            <img
              src={page.image_url}
              alt={page.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="bg-card rounded-xl p-6 md:p-10 shadow-sm border border-border">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">{page.title}</h1>
          
          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content || '' }}
          />
        </div>
      </main>

      {/* Footer simple */}
      <footer className="py-8 text-center text-muted-foreground text-sm border-t mt-12">
        <p>&copy; {new Date().getFullYear()} Arah Umroh. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PageDetail;
