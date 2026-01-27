import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, Lightbulb, Star, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAdminFeedbacks, Feedback } from '@/hooks/useFeedback';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const typeConfig = {
  bug: { label: 'Bug', icon: Bug, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  suggestion: { label: 'Saran', icon: Lightbulb, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  rating: { label: 'Rating', icon: Star, color: 'text-primary', bgColor: 'bg-primary/10' },
  other: { label: 'Lainnya', icon: MessageSquare, color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

const statusConfig = {
  pending: { label: 'Menunggu', icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  in_progress: { label: 'Diproses', icon: AlertCircle, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  resolved: { label: 'Selesai', icon: CheckCircle, color: 'text-primary', bgColor: 'bg-primary/10' },
  rejected: { label: 'Ditolak', icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
};

const FeedbackManagement = () => {
  const { feedbacks, isLoading, updateFeedback } = useAdminFeedbacks();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const filteredFeedbacks = feedbacks?.filter((f) => {
    if (filterType !== 'all' && f.feedback_type !== filterType) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  }) || [];

  const stats = {
    total: feedbacks?.length || 0,
    pending: feedbacks?.filter(f => f.status === 'pending').length || 0,
    bugs: feedbacks?.filter(f => f.feedback_type === 'bug').length || 0,
    suggestions: feedbacks?.filter(f => f.feedback_type === 'suggestion').length || 0,
  };

  const handleUpdateStatus = async () => {
    if (!selectedFeedback || !newStatus) return;
    
    await updateFeedback.mutateAsync({
      id: selectedFeedback.id,
      status: newStatus,
      admin_notes: adminNotes.trim() || undefined,
    });
    
    setSelectedFeedback(null);
    setAdminNotes('');
    setNewStatus('');
  };

  const openFeedbackDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.admin_notes || '');
    setNewStatus(feedback.status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Feedback</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Menunggu</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.bugs}</p>
            <p className="text-xs text-muted-foreground">Bug Reports</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.suggestions}</p>
            <p className="text-xs text-muted-foreground">Saran</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="suggestion">Saran</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="other">Lainnya</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="in_progress">Diproses</SelectItem>
            <SelectItem value="resolved">Selesai</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {filteredFeedbacks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Tidak ada feedback
            </CardContent>
          </Card>
        ) : (
          filteredFeedbacks.map((feedback) => {
            const typeInfo = typeConfig[feedback.feedback_type];
            const statusInfo = statusConfig[feedback.status as keyof typeof statusConfig] || statusConfig.pending;
            const TypeIcon = typeInfo.icon;
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={feedback.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => openFeedbackDetail(feedback)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${typeInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground truncate">{feedback.title}</h4>
                          {feedback.rating && (
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs">{feedback.rating}</span>
                            </div>
                          )}
                        </div>
                        
                        {feedback.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {feedback.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`${statusInfo.bgColor} border-0`}>
                            <StatusIcon className={`w-3 h-3 mr-1 ${statusInfo.color}`} />
                            <span className={statusInfo.color}>{statusInfo.label}</span>
                          </Badge>
                          
                          {feedback.category && (
                            <Badge variant="secondary" className="text-xs">
                              {feedback.category}
                            </Badge>
                          )}
                          
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(feedback.created_at), 'd MMM yyyy, HH:mm', { locale: id })}
                          </span>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Feedback</DialogTitle>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Judul</p>
                <p className="font-medium">{selectedFeedback.title}</p>
              </div>
              
              {selectedFeedback.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Deskripsi</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedFeedback.description}</p>
                </div>
              )}
              
              {selectedFeedback.device_info && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Info Device</p>
                  <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(selectedFeedback.device_info, null, 2)}
                  </pre>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="in_progress">Diproses</SelectItem>
                    <SelectItem value="resolved">Selesai</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Catatan Admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tambahkan catatan..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
              Batal
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updateFeedback.isPending}>
              {updateFeedback.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackManagement;
