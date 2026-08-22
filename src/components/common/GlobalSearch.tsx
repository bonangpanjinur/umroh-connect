import { useState, useEffect, useRef } from 'react';
import { Search, X, Package, ShoppingBag, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { coreApi } from '@/lib/coreApi';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'package' | 'product' | 'doa';
}

interface GlobalSearchProps {
  onSelect?: (result: SearchResult) => void;
  onClose: () => void;
}

const typeIcons = {
  package: Package,
  product: ShoppingBag,
  doa: BookOpen,
};

const typeLabels = {
  package: 'Paket',
  product: 'Produk',
  doa: 'Doa',
};

const GlobalSearch = ({ onSelect, onClose }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await coreApi.searchMarketplace({ q: query, types: ['package', 'product', 'doa'], limit: 15 });
        const mapped: SearchResult[] = (response || []).map((item) => ({ id: item.id, title: item.title, subtitle: item.subtitle, type: item.type }));
        setResults(mapped);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto max-w-lg mt-4 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card rounded-xl border shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              placeholder="Cari paket, produk, atau doa..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 p-0 h-auto text-sm"
            />
            <button onClick={onClose} className="shrink-0 p-1 rounded-md hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          {(loading || results.length > 0 || (query && !loading)) && (
            <div className="max-h-80 overflow-y-auto p-2">
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                </div>
              ) : results.length === 0 && query ? (
                <p className="text-center text-sm text-muted-foreground py-6">Tidak ditemukan untuk "{query}"</p>
              ) : (
                results.map((r) => {
                  const Icon = typeIcons[r.type];
                  return (
                    <button
                      key={`${r.type}-${r.id}`}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left transition-colors"
                      onClick={() => onSelect?.(r)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-muted-foreground">{r.subtitle}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                        {typeLabels[r.type]}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GlobalSearch;
