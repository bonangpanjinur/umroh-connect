import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useShopChat, ShopChatMessage } from '@/hooks/useShopChat';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, MessageSquare, Check, CheckCheck, Loader2, ArrowLeft, Image as ImageIcon, Paperclip, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShopChatViewProps {
  sellerId: string;
  sellerName: string;
  orderId?: string | null;
  senderRole: 'buyer' | 'seller';
  onBack?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const ShopChatView = ({ sellerId, sellerName, orderId, senderRole, onBack }: ShopChatViewProps) => {
  const { user } = useAuthContext();
  const { messages, isLoading, sendMessage, markAsRead } = useShopChat(sellerId, orderId);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    markAsRead();
  }, [messages, markAsRead]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Format file tidak didukung');
      return;
    }

    setSelectedFile(file);

    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFile = async (file: File): Promise<{ url: string; type: string }> => {
    const ext = file.name.split('.').pop();
    const filePath = `chat/${sellerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { error } = await supabase.storage
      .from('shop-images')
      .upload(filePath, file, { contentType: file.type });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('shop-images')
      .getPublicUrl(filePath);

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    return { url: urlData.publicUrl, type: isImage ? 'image' : 'file' };
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    try {
      setIsUploading(!!selectedFile);
      let attachmentUrl: string | undefined;
      let attachmentType: string | undefined;

      if (selectedFile) {
        const result = await uploadFile(selectedFile);
        attachmentUrl = result.url;
        attachmentType = result.type;
      }

      await sendMessage.mutateAsync({
        message: newMessage.trim() || (attachmentType === 'image' ? '📷 Gambar' : '📎 File'),
        senderRole,
        attachmentUrl,
        attachmentType,
      });

      setNewMessage('');
      clearFile();
      inputRef.current?.focus();
    } catch {
      toast.error('Gagal mengirim');
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderAttachment = (msg: ShopChatMessage, isMe: boolean) => {
    if (!msg.attachment_url) return null;

    if (msg.attachment_type === 'image') {
      return (
        <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
          <img
            src={msg.attachment_url}
            alt="Lampiran"
            className="max-w-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        </a>
      );
    }

    return (
      <a
        href={msg.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center gap-2 mt-1 px-2 py-1.5 rounded-lg text-xs',
          isMe ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-foreground'
        )}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="truncate">Lihat File</span>
      </a>
    );
  };

  const renderMessage = (msg: ShopChatMessage) => {
    const isMe = msg.sender_id === user?.id;
    const time = format(new Date(msg.created_at), 'HH:mm');

    return (
      <div key={msg.id} className={cn('flex gap-2 mb-3', isMe ? 'flex-row-reverse' : 'flex-row')}>
        {!isMe && (
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {msg.sender_role === 'seller' ? 'S' : 'B'}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={cn(
          'max-w-[75%] rounded-2xl px-3 py-2',
          isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'
        )}>
          {renderAttachment(msg, isMe)}
          {msg.message && !(msg.attachment_url && (msg.message === '📷 Gambar' || msg.message === '📎 File')) && (
            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
          )}
          <div className={cn('flex items-center gap-1 mt-0.5', isMe ? 'justify-end' : 'justify-start')}>
            <span className={cn('text-[10px]', isMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              {time}
            </span>
            {isMe && (msg.is_read ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" /> : <Check className="h-3 w-3 text-primary-foreground/70" />)}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {sellerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm truncate">{sellerName}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {orderId ? 'Chat Pesanan' : 'Chat Toko'}
            </p>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
            <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">Belum ada pesan</p>
            <p className="text-xs mt-1">Mulai percakapan dengan mengetik pesan</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollArea>

      {/* File preview */}
      {selectedFile && (
        <div className="border-t px-3 py-2 flex items-center gap-2 bg-muted/50">
          {filePreview ? (
            <img src={filePreview} alt="Preview" className="h-12 w-12 rounded object-cover" />
          ) : (
            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <span className="text-xs text-muted-foreground truncate flex-1">{selectedFile.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearFile}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <CardContent className="border-t p-3 shrink-0">
        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_FILE_TYPES.join(',')}
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            placeholder="Ketik pesan..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={(!newMessage.trim() && !selectedFile) || sendMessage.isPending || isUploading}
          >
            {sendMessage.isPending || isUploading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopChatView;
