import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bug, Lightbulb, Star, MessageSquare, Send, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFeedback, FeedbackType } from '@/hooks/useFeedback';
import { useAuthContext as useAuth } from '@/contexts/AuthContext';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const feedbackTypes = [
  { id: 'bug' as FeedbackType, label: 'Lapor Bug', icon: Bug, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  { id: 'suggestion' as FeedbackType, label: 'Saran', icon: Lightbulb, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { id: 'rating' as FeedbackType, label: 'Rating App', icon: Star, color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'other' as FeedbackType, label: 'Lainnya', icon: MessageSquare, color: 'text-muted-foreground', bgColor: 'bg-muted' },
];

const categories = {
  bug: ['UI/Tampilan', 'Performa', 'Data/Sinkronisasi', 'Login/Akun', 'Fitur tidak berfungsi', 'Lainnya'],
  suggestion: ['Fitur Baru', 'Perbaikan UX', 'Konten', 'Performa', 'Lainnya'],
  rating: [],
  other: ['Pertanyaan', 'Komentar', 'Lainnya'],
};

const FeedbackForm = ({ isOpen, onClose }: FeedbackFormProps) => {
  const { user } = useAuth();
  const { createFeedback } = useFeedback();
  
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType || !title.trim()) return;
    
    await createFeedback.mutateAsync({
      feedback_type: selectedType,
      title: title.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
      rating: selectedType === 'rating' ? rating : undefined,
    });
    
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      resetForm();
    }, 2000);
  };

  const resetForm = () => {
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setCategory('');
    setRating(0);
    setSubmitted(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        />
        
        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {submitted ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Terima Kasih!</h3>
              <p className="text-muted-foreground">Feedback Anda sangat berarti bagi kami.</p>
            </motion.div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-foreground mb-2">Kirim Feedback</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Bantu kami meningkatkan aplikasi dengan masukan Anda
              </p>

              {/* Type Selection */}
              {!selectedType ? (
                <div className="grid grid-cols-2 gap-3">
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <motion.button
                        key={type.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedType(type.id)}
                        className={`${type.bgColor} rounded-2xl p-4 text-center transition-all hover:shadow-md`}
                      >
                        <Icon className={`w-8 h-8 ${type.color} mx-auto mb-2`} />
                        <span className="text-sm font-medium text-foreground">{type.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Back Button */}
                  <button
                    onClick={() => setSelectedType(null)}
                    className="text-sm text-primary hover:underline mb-2"
                  >
                    ← Pilih jenis lain
                  </button>

                  {/* Rating Stars (for rating type) */}
                  {selectedType === 'rating' && (
                    <div className="text-center mb-4">
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Berapa rating Anda untuk aplikasi ini?
                      </Label>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setRating(star)}
                            className="p-1"
                          >
                            <Star
                              className={`w-10 h-10 transition-colors ${
                                star <= rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">
                      {selectedType === 'bug' ? 'Apa yang bermasalah?' : 
                       selectedType === 'suggestion' ? 'Judul saran' :
                       selectedType === 'rating' ? 'Judul ulasan' : 'Judul'}
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        selectedType === 'bug' ? 'Contoh: Tombol tidak bisa diklik' :
                        selectedType === 'suggestion' ? 'Contoh: Tambah fitur dark mode' :
                        'Tulis judul...'
                      }
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>

                  {/* Category */}
                  {categories[selectedType]?.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Kategori</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {categories[selectedType].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              category === cat
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">
                      {selectedType === 'bug' ? 'Langkah untuk mereproduksi' : 'Detail'}
                      <span className="text-muted-foreground font-normal"> (opsional)</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={
                        selectedType === 'bug' 
                          ? '1. Buka halaman...\n2. Klik tombol...\n3. Error muncul...' 
                          : 'Jelaskan lebih detail...'
                      }
                      className="mt-1 min-h-[100px]"
                      maxLength={1000}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!title.trim() || (selectedType === 'rating' && rating === 0) || createFeedback.isPending}
                    className="w-full"
                  >
                    {createFeedback.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Kirim Feedback
                      </>
                    )}
                  </Button>

                  {!user && (
                    <p className="text-xs text-center text-muted-foreground">
                      Login untuk melihat riwayat feedback Anda
                    </p>
                  )}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FeedbackForm;
