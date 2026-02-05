import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";

export default function PageDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["page", slug],
    queryFn: async () => {
      if (!slug) throw new Error("No slug provided");
      
      const { data, error } = await supabase
        .from("static_pages" as any)
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle(); 

      if (error) throw error;
      return data;
    },
    retry: 1, 
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Tampilkan UI Not Found yang bagus jika data null
  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader onSOSClick={() => {}} />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-9xl font-black text-muted-foreground/20 mb-4">404</h1>
          <h2 className="text-2xl font-bold mb-2">Halaman Tidak Ditemukan</h2>
          <Button onClick={() => navigate("/")} variant="default" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda
          </Button>
        </div>
        <BottomNav activeTab="home" onTabChange={() => navigate('/')} />
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
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader onSOSClick={() => {}} />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
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
      <BottomNav activeTab="home" onTabChange={() => navigate('/')} />
    </div>
  );
}
