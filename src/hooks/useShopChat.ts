import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { coreApi } from '@/lib/coreApi';

export interface ShopChatMessage { id: string; order_id: string | null; seller_id: string; sender_id: string; sender_role: 'buyer' | 'seller'; message: string; attachment_url: string | null; attachment_type: string | null; is_read: boolean; read_at: string | null; created_at: string; }

export const useShopChat = (sellerId: string | null, orderId?: string | null) => {
  const { user } = useAuthContext(); const queryClient = useQueryClient(); const queryKey = ['shop-chat', sellerId, orderId];
  const { data: messages = [], isLoading } = useQuery({ queryKey, queryFn: async (): Promise<ShopChatMessage[]> => orderId ? (await coreApi.listCommerceOrderMessages(orderId)) as unknown as ShopChatMessage[] : [], enabled: !!sellerId && !!orderId && !!user, refetchInterval: 10_000 });
  const sendMessage = useMutation({ mutationFn: async ({ message, senderRole: _senderRole, attachmentKey, attachmentType }: { message: string; senderRole: 'buyer' | 'seller'; attachmentKey?: string; attachmentType?: 'image' | 'file' }) => { if (!user || !orderId) throw new Error('Order chat membutuhkan autentikasi dan orderId.'); return coreApi.sendCommerceOrderMessage(orderId, { message, attachment_key: attachmentKey || null, attachment_type: attachmentType || null }); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey }); }, onError: () => toast.error('Gagal mengirim pesan') });
  const markAsRead = useCallback(async () => { if (orderId && user) { await coreApi.markCommerceOrderMessagesRead(orderId); await queryClient.invalidateQueries({ queryKey }); } }, [orderId, user, queryClient]);
  return { messages, isLoading, sendMessage, markAsRead };
};

export const useSellerChatList = (sellerId: string | null) => useQuery({ queryKey: ['seller-chat-list', sellerId], queryFn: async () => { if (!sellerId) return []; const rows = await coreApi.listCommerceSellerMessages(sellerId); const grouped = new Map<string, { buyer_id: string; buyer_name: string; order_id: string | null; last_message: string; last_time: string; unread: number }>(); for (const row of rows) { const key = String(row.order_id || row.sender_id); const current = grouped.get(key); if (!current) grouped.set(key, { buyer_id: row.sender_role === 'buyer' ? String(row.sender_id) : 'unknown', buyer_name: 'Pembeli', order_id: row.order_id ? String(row.order_id) : null, last_message: String(row.message), last_time: String(row.created_at), unread: row.sender_role === 'buyer' && !row.is_read ? 1 : 0 }); else if (row.sender_role === 'buyer' && !row.is_read) current.unread += 1; } return Array.from(grouped.values()); }, enabled: !!sellerId });
