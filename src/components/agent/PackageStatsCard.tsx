import { motion } from 'framer-motion';
import { Eye, MessageCircle, Users, TrendingUp, Package } from 'lucide-react';
import { PackageStats } from '@/hooks/usePackageInterests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PackageStatsCardProps {
  stats: PackageStats[];
  isLoading?: boolean;
}

const PackageStatsCard = ({ stats, isLoading }: PackageStatsCardProps) => {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 bg-muted rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-xl"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalViews = stats.reduce((sum, s) => sum + s.total_views, 0);
  const totalClicks = stats.reduce((sum, s) => sum + s.whatsapp_clicks, 0);
  const totalUniqueUsers = stats.reduce((sum, s) => sum + s.unique_users, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Statistik Minat Paket
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-500/10 rounded-xl p-3 text-center"
          >
            <Eye className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{totalViews}</p>
            <p className="text-[10px] text-muted-foreground">Views</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-primary/10 rounded-xl p-3 text-center"
          >
            <MessageCircle className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{totalClicks}</p>
            <p className="text-[10px] text-muted-foreground">WA Clicks</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-accent/10 rounded-xl p-3 text-center"
          >
            <Users className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{totalUniqueUsers}</p>
            <p className="text-[10px] text-muted-foreground">Unique</p>
          </motion.div>
        </div>

        {/* Per Package Stats */}
        {stats.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Performa Per Paket</p>
            {stats.map((stat, index) => (
              <motion.div
                key={stat.package_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-secondary/50 rounded-xl p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-3 h-3 text-primary" />
                    </div>
                    <span className="font-medium text-sm line-clamp-1">{stat.package_name}</span>
                  </div>
                  {stat.whatsapp_clicks > 0 && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                      🔥 Hot
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {stat.total_views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> {stat.whatsapp_clicks}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {stat.unique_users}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada data minat</p>
            <p className="text-xs">Statistik akan muncul saat jamaah melihat paket Anda</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PackageStatsCard;
