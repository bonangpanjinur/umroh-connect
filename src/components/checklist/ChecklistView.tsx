import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  FileText, 
  Briefcase, 
  HeartPulse, 
  Brain,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useChecklistsWithProgress, useToggleChecklist, useChecklistStats } from '@/hooks/useChecklist';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type ChecklistCategory = 'dokumen' | 'perlengkapan' | 'kesehatan' | 'mental';

interface ChecklistWithProgress {
  id: string;
  title: string;
  description: string | null;
  category: ChecklistCategory;
  phase: string;
  priority: number;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  userProgress?: {
    id: string;
    user_id: string;
    checklist_id: string;
    is_checked: boolean;
    checked_at: string | null;
    notes: string | null;
  };
}

const categoryConfig: Record<ChecklistCategory, { label: string; icon: any; color: string }> = {
  dokumen: { label: 'Dokumen', icon: FileText, color: 'text-blue-500 bg-blue-500/10' },
  perlengkapan: { label: 'Perlengkapan', icon: Briefcase, color: 'text-amber-500 bg-amber-500/10' },
  kesehatan: { label: 'Kesehatan', icon: HeartPulse, color: 'text-red-500 bg-red-500/10' },
  mental: { label: 'Mental & Niat', icon: Brain, color: 'text-purple-500 bg-purple-500/10' },
};

const ChecklistView = () => {
  const { user } = useAuthContext();
  const { data: checklists, isLoading } = useChecklistsWithProgress(user?.id);
  const { stats } = useChecklistStats(user?.id);
  const toggleChecklist = useToggleChecklist();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | ChecklistCategory>('all');
  const [expandedCategories, setExpandedCategories] = useState<ChecklistCategory[]>(['dokumen', 'perlengkapan', 'kesehatan', 'mental']);

  // Filter checklists
  const filteredChecklists = useMemo(() => {
    return checklists.filter(item => {
      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [checklists, searchQuery, activeCategory]);

  // Group by category
  const groupedChecklists = useMemo(() => {
    const groups: Record<ChecklistCategory, ChecklistWithProgress[]> = {
      dokumen: [],
      perlengkapan: [],
      kesehatan: [],
      mental: [],
    };
    
    filteredChecklists.forEach(item => {
      groups[item.category].push(item);
    });
    
    return groups;
  }, [filteredChecklists]);

  const toggleCategory = (category: ChecklistCategory) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleToggle = (checklistId: string, currentState: boolean) => {
    if (!user) return;
    toggleChecklist.mutate({
      userId: user.id,
      checklistId,
      isChecked: !currentState,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30 p-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Silakan login untuk melihat checklist persiapan umroh Anda</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-secondary/30"
    >
      {/* Header with Progress */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 pb-6">
        <h1 className="text-xl font-bold mb-1">Checklist Persiapan</h1>
        <p className="text-sm opacity-80 mb-4">Persiapan umroh Anda</p>
        
        {/* Overall Progress */}
        <div className="bg-primary-foreground/20 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress Keseluruhan</span>
            <span className="text-lg font-bold">{stats.percentage}%</span>
          </div>
          <Progress value={stats.percentage} className="h-2 bg-primary-foreground/30" />
          <p className="text-xs opacity-80 mt-2">
            {stats.completed} dari {stats.total} item selesai
          </p>
        </div>

        {/* Category Progress Pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar">
          {(Object.keys(categoryConfig) as ChecklistCategory[]).map(cat => {
            const config = categoryConfig[cat];
            const catStats = stats.byCategory[cat];
            
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  activeCategory === cat
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
                )}
              >
                <config.icon className="w-3.5 h-3.5" />
                {config.label}
                <span className="bg-primary-foreground/20 px-1.5 py-0.5 rounded">
                  {catStats.completed}/{catStats.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-card sticky top-14 z-20 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari checklist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Checklist Content */}
      <div className="p-4 space-y-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          (Object.keys(categoryConfig) as ChecklistCategory[]).map(category => {
            const items = groupedChecklists[category];
            if (items.length === 0) return null;
            
            const config = categoryConfig[category];
            const isExpanded = expandedCategories.includes(category);
            const completedCount = items.filter(i => i.userProgress?.is_checked).length;
            
            return (
              <div key={category} className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.color)}>
                      <config.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{config.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {completedCount}/{items.length} selesai
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16">
                      <Progress 
                        value={(completedCount / items.length) * 100} 
                        className="h-1.5"
                      />
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Checklist Items */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {items.map((item) => (
                          <ChecklistItem
                            key={item.id}
                            item={item}
                            onToggle={() => handleToggle(item.id, !!item.userProgress?.is_checked)}
                            isPending={toggleChecklist.isPending}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}

        {!isLoading && filteredChecklists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Tidak ada checklist ditemukan</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Checklist Item Component
interface ChecklistItemProps {
  item: ChecklistWithProgress;
  onToggle: () => void;
  isPending: boolean;
}

const ChecklistItem = ({ item, onToggle, isPending }: ChecklistItemProps) => {
  const isChecked = item.userProgress?.is_checked;
  
  return (
    <motion.div
      layout
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer",
        isChecked 
          ? "bg-primary/5 border border-primary/20" 
          : "bg-secondary/50 hover:bg-secondary border border-transparent"
      )}
      onClick={onToggle}
    >
      <button
        disabled={isPending}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
          isChecked 
            ? "bg-primary border-primary text-primary-foreground" 
            : "border-muted-foreground/30 hover:border-primary"
        )}
      >
        {isChecked && <Check className="w-3.5 h-3.5" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "font-medium text-sm",
            isChecked && "line-through text-muted-foreground"
          )}>
            {item.title}
          </h4>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
            {item.phase}
          </span>
        </div>
        {item.description && (
          <p className={cn(
            "text-xs mt-1",
            isChecked ? "text-muted-foreground/60" : "text-muted-foreground"
          )}>
            {item.description}
          </p>
        )}
        {isChecked && item.userProgress?.checked_at && (
          <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Selesai {new Date(item.userProgress.checked_at).toLocaleDateString('id-ID')}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ChecklistView;
