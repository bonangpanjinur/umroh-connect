import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  booking_id: string | null;
  travel_id: string;
  sender_id: string;
  sender_type: 'jamaah' | 'agent';
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const useChat = (bookingId: string | null, travelId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-messages', bookingId, travelId],
    queryFn: async () => {
      if (!travelId) return [];
      
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('travel_id', travelId)
        .order('created_at', { ascending: true });

      if (bookingId) {
        query = query.eq('booking_id', bookingId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!travelId && !!user,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!travelId || !user) return;

    const channel = supabase
      .channel(`chat-${travelId}-${bookingId || 'general'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `travel_id=eq.${travelId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          // Only add if matches our booking filter
          if (!bookingId || newMessage.booking_id === bookingId) {
            queryClient.setQueryData(
              ['chat-messages', bookingId, travelId],
              (old: ChatMessage[] | undefined) => [...(old || []), newMessage]
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `travel_id=eq.${travelId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          queryClient.setQueryData(
            ['chat-messages', bookingId, travelId],
            (old: ChatMessage[] | undefined) =>
              old?.map((msg) =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              ) || []
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [travelId, bookingId, user, queryClient]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({
      message,
      senderType,
    }: {
      message: string;
      senderType: 'jamaah' | 'agent';
    }) => {
      if (!user || !travelId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          booking_id: bookingId,
          travel_id: travelId,
          sender_id: user.id,
          sender_type: senderType,
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onError: () => {
      toast.error('Gagal mengirim pesan');
    },
  });

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!user || !travelId) return;

    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('travel_id', travelId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (error) console.error('Error marking messages as read:', error);
  }, [user, travelId]);

  // Get unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['chat-unread', travelId],
    queryFn: async () => {
      if (!user || !travelId) return 0;

      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('travel_id', travelId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!travelId && !!user,
  });

  return {
    messages: messages || [],
    isLoading,
    sendMessage,
    markAsRead,
    unreadCount: unreadCount || 0,
  };
};

// Hook for agent to get all chats
export const useAgentChats = (travelId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-chats', travelId],
    queryFn: async () => {
      if (!travelId) return [];

      // Get unique booking conversations
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          booking_id,
          travel_id,
          created_at,
          message,
          is_read,
          sender_type
        `)
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by booking_id and get latest message
      const chatMap = new Map<string, {
        booking_id: string;
        last_message: string;
        last_message_time: string;
        unread_count: number;
      }>();

      data?.forEach((msg) => {
        const key = msg.booking_id || 'general';
        if (!chatMap.has(key)) {
          chatMap.set(key, {
            booking_id: msg.booking_id || '',
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: 0,
          });
        }
        if (!msg.is_read && msg.sender_type === 'jamaah') {
          const chat = chatMap.get(key)!;
          chat.unread_count++;
        }
      });

      return Array.from(chatMap.values());
    },
    enabled: !!travelId && !!user,
  });
};
