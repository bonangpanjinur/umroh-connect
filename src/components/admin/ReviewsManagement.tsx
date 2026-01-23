import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAllReviews, useUpdateReviewStatus } from '@/hooks/useReviews';
import { StarRating } from '@/components/reviews/StarRating';
import { Search, Eye, EyeOff, MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

export const ReviewsManagement = () => {
  const { data: reviews, isLoading } = useAllReviews();
  const updateStatus = useUpdateReviewStatus();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const filteredReviews = reviews?.filter(review => {
    const searchLower = searchTerm.toLowerCase();
    return (
      review.travel?.name?.toLowerCase().includes(searchLower) ||
      review.review_text?.toLowerCase().includes(searchLower)
    );
  });

  const handleTogglePublish = async (review: any) => {
    try {
      await updateStatus.mutateAsync({
        reviewId: review.id,
        isPublished: !review.is_published,
        adminNotes: review.admin_notes,
      });
      toast.success(
        review.is_published 
          ? 'Review berhasil disembunyikan' 
          : 'Review berhasil dipublikasikan'
      );
    } catch (error) {
      toast.error('Gagal mengubah status review');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedReview) return;
    
    try {
      await updateStatus.mutateAsync({
        reviewId: selectedReview.id,
        isPublished: selectedReview.is_published,
        adminNotes,
      });
      toast.success('Catatan berhasil disimpan');
      setSelectedReview(null);
    } catch (error) {
      toast.error('Gagal menyimpan catatan');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Kelola Review</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="text-lg">Semua Review</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari review..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Travel</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="hidden md:table-cell">Review</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada review ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReviews?.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.travel?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <StarRating rating={review.rating} size="sm" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs">
                        <p className="truncate text-sm text-muted-foreground">
                          {review.review_text || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={review.is_published ? 'default' : 'secondary'}>
                          {review.is_published ? 'Publik' : 'Disembunyikan'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {format(new Date(review.created_at), 'd MMM yyyy', { locale: id })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTogglePublish(review)}
                            title={review.is_published ? 'Sembunyikan' : 'Publikasikan'}
                          >
                            {review.is_published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReview(review);
                              setAdminNotes(review.admin_notes || '');
                            }}
                          >
                            Detail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Review</DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Travel</p>
                <p className="font-medium">{selectedReview.travel?.name || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <StarRating rating={selectedReview.rating} size="md" showValue />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Review</p>
                <p className="text-sm">
                  {selectedReview.review_text || '(Tidak ada teks review)'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Catatan Admin</p>
                <Textarea
                  placeholder="Tambahkan catatan admin..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              Tutup
            </Button>
            <Button onClick={handleSaveNotes} disabled={updateStatus.isPending}>
              {updateStatus.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Simpan Catatan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
