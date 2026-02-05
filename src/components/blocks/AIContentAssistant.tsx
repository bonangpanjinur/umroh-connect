import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Check, Copy } from 'lucide-react';
import { generateAIContent } from '@/services/aiService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AIContentAssistantProps {
  onApply: (content: string) => void;
  context?: string;
  currentValue?: string;
  label?: string;
}

export function AIContentAssistant({ onApply, context = '', currentValue = '', label = 'Konten' }: AIContentAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Silakan masukkan instruksi terlebih dahulu');
      return;
    }

    setIsLoading(true);
    try {
      const fullContext = `Tipe field: ${label}. Nilai saat ini: ${currentValue}. ${context}`;
      const content = await generateAIContent(prompt, fullContext);
      setResult(content);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onApply(result);
    setIsOpen(false);
    toast.success('Konten AI diterapkan');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 px-2 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/5"
        >
          <Sparkles className="h-3 w-3" />
          Gunakan AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Content Assistant
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Apa yang ingin Anda buat?</Label>
            <Textarea 
              placeholder="Contoh: Buatkan judul promosi umroh yang menarik untuk paket hemat Ramadhan"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {result && (
            <div className="space-y-2">
              <Label>Hasil Generasi AI:</Label>
              <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap border">
                {result}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Batal</Button>
          {!result ? (
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResult('')}>Coba Lagi</Button>
              <Button onClick={handleApply}>
                <Check className="h-4 w-4 mr-2" />
                Terapkan
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
