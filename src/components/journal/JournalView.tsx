import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Image, MapPin, Share2, Trash2, Edit2, 
  Calendar, Heart, Smile, Sparkles, Moon, Sun, X, Camera,
  Check, MoreVertical, Globe, Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { 
  useJournals, 
  useCreateJournal, 
  useUpdateJournal, 
  useDeleteJournal,
  useUploadJournalPhoto,
  useDeleteJournalPhoto,
  Journal, 
  JournalMood,
  CreateJournalInput,
  getMoodEmoji,
  getMoodLabel
} from '@/hooks/useJournals';
import { locationsData } from '@/data/locationsData';

interface JournalViewProps {
  onBack: () => void;
}

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

const moods: JournalMood[] = ['grateful', 'peaceful', 'emotional', 'inspired', 'tired', 'happy'];

const JournalView = ({ onBack }: JournalViewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [formData, setFormData] = useState<CreateJournalInput>({
    title: '',
    content: '',
    mood: undefined,
    is_public: false
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { latitude, longitude, requestLocation } = useGeolocation();
  const { data: journals, isLoading } = useJournals();
  const createJournal = useCreateJournal();
  const updateJournal = useUpdateJournal();
  const deleteJournal = useDeleteJournal();
  const uploadPhoto = useUploadJournalPhoto();
  const deletePhoto = useDeleteJournalPhoto();

  // Get nearest location name
  const getNearestLocation = (): string | null => {
    if (!latitude || !longitude) return null;
    
    let nearest = null;
    let minDistance = Infinity;
    
    for (const loc of locationsData) {
      const dist = Math.sqrt(
        Math.pow(loc.latitude - latitude, 2) + 
        Math.pow(loc.longitude - longitude, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearest = loc;
      }
    }
    
    // Only return if within reasonable distance (roughly 5km)
    if (nearest && minDistance < 0.05) {
      return nearest.name;
    }
    return null;
  };

  const handleCreate = () => {
    const nearestLoc = getNearestLocation();
    setFormData({
      title: '',
      content: '',
      mood: undefined,
      is_public: false,
      location_name: nearestLoc || undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined
    });
    setPhotos([]);
    setPhotoPreview([]);
    setViewMode('create');
  };

  const handleEdit = (journal: Journal) => {
    setSelectedJournal(journal);
    setFormData({
      title: journal.title,
      content: journal.content || '',
      mood: journal.mood as JournalMood || undefined,
      is_public: journal.is_public,
      location_name: journal.location_name || undefined,
      latitude: journal.latitude || undefined,
      longitude: journal.longitude || undefined
    });
    setViewMode('edit');
  };

  const handleViewDetail = (journal: Journal) => {
    setSelectedJournal(journal);
    setViewMode('detail');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      alert('Maksimal 5 foto per jurnal');
      return;
    }

    setPhotos(prev => [...prev, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    try {
      if (viewMode === 'create') {
        const journal = await createJournal.mutateAsync(formData);
        
        // Upload photos
        for (const photo of photos) {
          await uploadPhoto.mutateAsync({ file: photo, journalId: journal.id });
        }
      } else if (viewMode === 'edit' && selectedJournal) {
        await updateJournal.mutateAsync({ id: selectedJournal.id, ...formData });
      }
      
      setViewMode('list');
    } catch (error) {
      console.error('Error saving journal:', error);
    }
  };

  const handleDelete = async (journalId: string) => {
    if (confirm('Hapus jurnal ini?')) {
      await deleteJournal.mutateAsync(journalId);
      setViewMode('list');
    }
  };

  const handleShare = async (journal: Journal) => {
    const shareData = {
      title: journal.title,
      text: `${journal.title}\n\n${journal.content || ''}\n\n📍 ${journal.location_name || 'Tanah Suci'}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
      alert('Teks disalin ke clipboard');
    }
  };

  // Render based on view mode
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <JournalForm
        mode={viewMode}
        formData={formData}
        setFormData={setFormData}
        photos={photos}
        photoPreview={photoPreview}
        existingPhotos={selectedJournal?.photos || []}
        onFileChange={handleFileChange}
        onRemovePhoto={removePhoto}
        onRemoveExistingPhoto={(photoId) => deletePhoto.mutate(photoId)}
        onSubmit={handleSubmit}
        onBack={() => setViewMode('list')}
        onRequestLocation={requestLocation}
        isSubmitting={createJournal.isPending || updateJournal.isPending}
        fileInputRef={fileInputRef}
      />
    );
  }

  if (viewMode === 'detail' && selectedJournal) {
    return (
      <JournalDetail
        journal={selectedJournal}
        onBack={() => setViewMode('list')}
        onEdit={() => handleEdit(selectedJournal)}
        onDelete={() => handleDelete(selectedJournal.id)}
        onShare={() => handleShare(selectedJournal)}
      />
    );
  }

  // List view
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Jurnal Umroh</h1>
              <p className="text-sm text-muted-foreground">Catatan perjalanan Anda</p>
            </div>
          </div>
          <Button onClick={handleCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Tulis
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20 space-y-4">
        {!user ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Login Diperlukan</h3>
              <p className="text-sm text-muted-foreground">
                Masuk untuk menyimpan jurnal perjalanan Anda
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-24" />
              </Card>
            ))}
          </div>
        ) : journals && journals.length > 0 ? (
          <AnimatePresence>
            {journals.map((journal, index) => (
              <motion.div
                key={journal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewDetail(journal)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {/* Photo thumbnail */}
                      {journal.photos && journal.photos.length > 0 && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                          <img 
                            src={journal.photos[0].photo_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground truncate">
                              {journal.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {format(new Date(journal.created_at), 'dd MMM yyyy', { locale: id })}
                              </span>
                              {journal.location_name && (
                                <>
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{journal.location_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {journal.mood && (
                            <span className="text-xl">{getMoodEmoji(journal.mood as JournalMood)}</span>
                          )}
                        </div>
                        
                        {journal.content && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {journal.content}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          {journal.is_public ? (
                            <Badge variant="outline" className="text-xs">
                              <Globe className="w-3 h-3 mr-1" />
                              Publik
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Pribadi
                            </Badge>
                          )}
                          {journal.photos && journal.photos.length > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              <Image className="w-3 h-3 mr-1" />
                              {journal.photos.length} foto
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Edit2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Belum Ada Jurnal</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Abadikan momen berharga perjalanan umroh Anda
              </p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Tulis Jurnal Pertama
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
};

// Journal Form Component
interface JournalFormProps {
  mode: 'create' | 'edit';
  formData: CreateJournalInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateJournalInput>>;
  photos: File[];
  photoPreview: string[];
  existingPhotos: { id: string; photo_url: string }[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  onRemoveExistingPhoto: (photoId: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onRequestLocation: () => void;
  isSubmitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const JournalForm = ({
  mode,
  formData,
  setFormData,
  photos,
  photoPreview,
  existingPhotos,
  onFileChange,
  onRemovePhoto,
  onRemoveExistingPhoto,
  onSubmit,
  onBack,
  onRequestLocation,
  isSubmitting,
  fileInputRef
}: JournalFormProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <X className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">
              {mode === 'create' ? 'Jurnal Baru' : 'Edit Jurnal'}
            </h1>
          </div>
          <Button onClick={onSubmit} disabled={isSubmitting || !formData.title.trim()}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <Input
            placeholder="Judul jurnal..."
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="text-lg font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0"
          />
        </div>

        {/* Content */}
        <div>
          <Textarea
            placeholder="Tuliskan pengalaman, perasaan, atau refleksi Anda..."
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            className="min-h-[150px] resize-none"
          />
        </div>

        {/* Photos */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Foto</Label>
          <div className="flex flex-wrap gap-2">
            {/* Existing photos */}
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="relative w-20 h-20 rounded-lg overflow-hidden">
                <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => onRemoveExistingPhoto(photo.id)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            
            {/* New photos preview */}
            {photoPreview.map((preview, index) => (
              <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => onRemovePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            
            {/* Add photo button */}
            {existingPhotos.length + photos.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors"
              >
                <Camera className="w-6 h-6 text-muted-foreground" />
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        {/* Location */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Lokasi</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nama lokasi"
              value={formData.location_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={onRequestLocation}>
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
          {formData.latitude && formData.longitude && (
            <p className="text-xs text-muted-foreground mt-1">
              📍 {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
            </p>
          )}
        </div>

        {/* Mood */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Suasana Hati</Label>
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
              <Button
                key={mood}
                type="button"
                variant={formData.mood === mood ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  mood: prev.mood === mood ? undefined : mood 
                }))}
              >
                {getMoodEmoji(mood)} {getMoodLabel(mood)}
              </Button>
            ))}
          </div>
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Jurnal Publik</p>
              <p className="text-xs text-muted-foreground">
                Izinkan orang lain melihat jurnal ini
              </p>
            </div>
          </div>
          <Switch
            checked={formData.is_public}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Journal Detail Component
interface JournalDetailProps {
  journal: Journal;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
}

const JournalDetail = ({ journal, onBack, onEdit, onDelete, onShare }: JournalDetailProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onShare}>
              <Share2 className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Photos Gallery */}
      {journal.photos && journal.photos.length > 0 && (
        <div className="relative">
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
            {journal.photos.map((photo, index) => (
              <div 
                key={photo.id} 
                className="w-full shrink-0 snap-center aspect-square"
              >
                <img 
                  src={photo.photo_url} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          {journal.photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {journal.photos.map((_, index) => (
                <div 
                  key={index} 
                  className="w-2 h-2 rounded-full bg-white/50"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title & Meta */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {journal.mood && (
              <span className="text-2xl">{getMoodEmoji(journal.mood as JournalMood)}</span>
            )}
            <h1 className="text-xl font-bold text-foreground">{journal.title}</h1>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(journal.created_at), 'EEEE, dd MMMM yyyy', { locale: id })}</span>
            </div>
          </div>
          
          {journal.location_name && (
            <div className="flex items-center gap-1 text-sm text-primary mt-1">
              <MapPin className="w-4 h-4" />
              <span>{journal.location_name}</span>
            </div>
          )}
        </div>

        {/* Content */}
        {journal.content && (
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {journal.content}
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          {journal.is_public ? (
            <Badge variant="outline">
              <Globe className="w-3 h-3 mr-1" />
              Publik
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Lock className="w-3 h-3 mr-1" />
              Pribadi
            </Badge>
          )}
          {journal.mood && (
            <Badge variant="outline">
              {getMoodEmoji(journal.mood as JournalMood)} {getMoodLabel(journal.mood as JournalMood)}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default JournalView;
