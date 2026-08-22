import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabaseUntyped as supabase } from '@/lib/supabase';
import { coreApi } from '@/lib/coreApi';
import AgentPublicProfile from './AgentPublicProfile';
import PageDetail from './PageDetail';
import NotFound from './NotFound';
import { Loader2 } from 'lucide-react';

const DynamicSlugHandler = () => {
  const { slug } = useParams<{ slug: string }>();
  const [type, setType] = useState<'agent' | 'page' | 'not_found' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      checkSlugType();
    }
  }, [slug]);

  const checkSlugType = async () => {
    try {
      setLoading(true);
      
      // 1. Check if it is a published agent slug through Core.
      let agentData: unknown = null;
      try { agentData = await coreApi.getMarketplaceAgentProfile(slug); } catch { agentData = null; }

      if (agentData) {
        setType('agent');
        return;
      }

      // 2. Check if it's a static page slug
      const { data: pageData, error: pageError } = await supabase
        .from('static_pages')
        .select('id')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (pageData) {
        setType('page');
        return;
      }

      setType('not_found');
    } catch (err) {
      console.error('Error checking slug type:', err);
      setType('not_found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (type === 'agent') {
    return <AgentPublicProfile />;
  }

  if (type === 'page') {
    return <PageDetail />;
  }

  return <NotFound />;
};

export default DynamicSlugHandler;
