import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppReminderData {
  phone: string;
  message?: string;
  type: 'payment' | 'departure' | 'document' | 'general';
  templateData?: Record<string, string | number>;
}

export const useWhatsAppReminder = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const generateWhatsAppUrl = async (data: WhatsAppReminderData): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('send-whatsapp-reminder', {
        body: data,
      });

      if (error) throw error;

      if (result.success && result.whatsapp_url) {
        return result.whatsapp_url;
      }

      throw new Error('Failed to generate WhatsApp URL');
    } catch (error) {
      console.error('Error generating WhatsApp URL:', error);
      toast({
        title: 'Gagal',
        description: 'Tidak dapat membuat link WhatsApp',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = async (data: WhatsAppReminderData): Promise<boolean> => {
    const url = await generateWhatsAppUrl(data);
    if (url) {
      window.open(url, '_blank');
      return true;
    }
    return false;
  };

  const sendPaymentReminder = async (params: {
    phone: string;
    packageName: string;
    amount: string;
    dueDate: string;
    bookingCode: string;
  }) => {
    return openWhatsApp({
      phone: params.phone,
      type: 'payment',
      templateData: params,
    });
  };

  const sendDepartureReminder = async (params: {
    phone: string;
    packageName: string;
    departureDate: string;
    daysLeft: number;
  }) => {
    return openWhatsApp({
      phone: params.phone,
      type: 'departure',
      templateData: params,
    });
  };

  const sendDocumentReminder = async (params: {
    phone: string;
    documentType: string;
    deadline?: string;
  }) => {
    return openWhatsApp({
      phone: params.phone,
      type: 'document',
      templateData: params,
    });
  };

  const sendGeneralMessage = async (params: {
    phone: string;
    title: string;
    body: string;
  }) => {
    return openWhatsApp({
      phone: params.phone,
      type: 'general',
      templateData: params,
    });
  };

  return {
    isLoading,
    generateWhatsAppUrl,
    openWhatsApp,
    sendPaymentReminder,
    sendDepartureReminder,
    sendDocumentReminder,
    sendGeneralMessage,
  };
};
