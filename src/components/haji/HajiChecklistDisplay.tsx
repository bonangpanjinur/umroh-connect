import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHajiChecklists, PackageType } from '@/hooks/useHaji';
import { CheckCircle, Circle, FileText, Heart, Wallet, Loader2 } from 'lucide-react';

interface HajiChecklistDisplayProps {
  packageType: PackageType;
  completedItems?: string[];
  onToggle?: (itemId: string) => void;
  interactive?: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  dokumen: <FileText className="h-4 w-4" />,
  kesehatan: <Heart className="h-4 w-4" />,
  keuangan: <Wallet className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  dokumen: 'Dokumen',
  kesehatan: 'Kesehatan',
  keuangan: 'Keuangan',
};

export const HajiChecklistDisplay = ({
  packageType,
  completedItems = [],
  onToggle,
  interactive = false,
}: HajiChecklistDisplayProps) => {
  const { data: checklists, isLoading } = useHajiChecklists(packageType);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Group by category
  const groupedChecklists = checklists?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof checklists>);

  if (!groupedChecklists || Object.keys(groupedChecklists).length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Tidak ada checklist untuk tipe paket ini
        </CardContent>
      </Card>
    );
  }

  const totalItems = checklists?.length || 0;
  const completedCount = completedItems.length;
  const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Persyaratan Dokumen Haji</CardTitle>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{totalItems}
          </Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedChecklists).map(([category, items]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2">
              {categoryIcons[category] || <FileText className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {categoryLabels[category] || category}
              </span>
            </div>
            <div className="space-y-2 pl-6">
              {items?.map((item) => {
                const isCompleted = completedItems.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                      interactive ? 'cursor-pointer hover:bg-muted/50' : ''
                    } ${isCompleted ? 'bg-primary/5' : ''}`}
                    onClick={() => interactive && onToggle?.(item.id)}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </span>
                        {item.is_required && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0">
                            Wajib
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
