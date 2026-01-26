import { Badge } from '@/components/ui/badge';
import { PackageType, packageTypeLabels, packageTypeColors } from '@/hooks/useHaji';

interface PackageTypeBadgeProps {
  type: PackageType;
  size?: 'sm' | 'md';
}

export const PackageTypeBadge = ({ type, size = 'sm' }: PackageTypeBadgeProps) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  
  return (
    <Badge 
      variant="secondary" 
      className={`${packageTypeColors[type]} ${sizeClasses} font-medium`}
    >
      {packageTypeLabels[type]}
    </Badge>
  );
};
