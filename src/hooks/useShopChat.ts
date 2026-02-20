import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ShopChatMessage {
  id: string;
  order_id: string | null;
  seller_id: string;
  sender_id: string;
  sender_role: 'buyer' | 'seller';
  message: string;
  attachment_url: string | null;
  attachment_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const useShopChat = (sellerId: string | null, orderId?: string | null) => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const queryKey = ['shop-chat', sellerId, orderId];

  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<ShopChatMessage[]> => {
      if (!sellerId) return [];
      let query = supabase
        .from('shop_chat_messages')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: true });

      if (orderId) {
        query = query.eq('order_id', orderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ShopChatMessage[];
    },
    enabled: !!sellerId && !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!sellerId || !user) return;

    const channel = supabase
      .channel(`shop-chat-${sellerId}-${orderId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shop_chat_messages',
          filter: `seller_id=eq.${sellerId}`,
        },
        (payload) => {
          const msg = payload.new as ShopChatMessage;
          if (!orderId || msg.order_id === orderId) {
            queryClient.setQueryData(queryKey, (old: ShopChatMessage[] | undefined) => [
              ...(old || []),
              msg,
            ]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shop_chat_messages',
          filter: `seller_id=eq.${sellerId}`,
        },
        (payload) => {
          const updated = payload.new as ShopChatMessage;
          queryClient.setQueryData(queryKey, (old: ShopChatMessage[] | undefined) =>
            old?.map(m => (m.id === updated.id ? updated : m)) || []
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId, orderId, user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({ message, senderRole, attachmentUrl, attachmentType }: {
      message: string;
      senderRole: 'buyer' | 'seller';
      attachmentUrl?: string;
      attachmentType?: string;
    }) => {
      if (!user || !sellerId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('shop_chat_messages')
        .insert({
          seller_id: sellerId,
          order_id: orderId || null,
          sender_id: user.id,
          sender_role: senderRole,
          message,
          attachment_url: attachmentUrl || null,
          attachment_type: attachmentType || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onError: () => toast.error('Gagal mengirim pesan'),
  });

  const markAsRead = useCallback(async () => {
    if (!user || !sellerId) return;
    await supabase
      .from('shop_chat_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('seller_id', sellerId)
      .neq('sender_id', user.id)
      .eq('is_read', false);
  }, [user, sellerId]);

  return { messages, isLoading, sendMessage, markAsRead };
};

// For seller: get all conversations grouped by buyer
export const useSellerChatList = (sellerId: string | null) => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['seller-chat-list', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await supabase
        .from('shop_chat_messages')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by sender (buyer) - use sender_id for buyer messages
      const convMap = new Map<string, {
        buyer_id: string;
        order_id: string | null;
        last_message: string;
        last_time: string;
        unread: number;
      }>();

      (data || []).forEach((msg: any) => {
        const buyerId = msg.sender_role === 'buyer' ? msg.sender_id : null;
        // Find the buyer in this conversation
        const key = msg.order_id || msg.sender_id;
        if (!convMap.has(key)) {
          convMap.set(key, {
            buyer_id: buyerId || msg.sender_id,
            order_id: msg.order_id,
            last_message: msg.message,
            last_time: msg.created_at,
            unread: 0,
          });
        }
        if (!msg.is_read && msg.sender_role === 'buyer') {
          convMap.get(key)!.unread++;
        }
      });

      return Array.from(convMap.values());
    },
    enabled: !!sellerId && !!user,
  });
};
