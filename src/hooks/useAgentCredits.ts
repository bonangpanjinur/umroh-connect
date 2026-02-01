import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PackageCredits, CreditTransaction } from '@/types/database';
import { toast } from '@/hooks/use-toast';

// Get agent's credits balance
export const useAgentCredits = (travelId: string | undefined) => {
  return useQuery({
    queryKey: ['agent-credits', travelId],
    queryFn: async (): Promise<PackageCredits | null> => {
      if (!travelId) return null;
      
      const { data, error } = await supabase
        .from('package_credits')
        .select('*')
        .eq('travel_id', travelId)
        .maybeSingle();

      if (error) throw error;
      const typedData = data as PackageCredits | null;
      if (typedData) {
        return {
          ...typedData,
          balance: typedData.credits_remaining // Map for component convenience
        } as any;
      }
      return null;
    },
    enabled: !!travelId,
  });
};

// Purchase credits
export const usePurchaseCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      travelId, 
      credits, 
      amount, 
      proofUrl 
    }: { 
      travelId: string; 
      credits: number; 
      amount: number; 
      proofUrl: string;
    }) => {
      // Create a pending transaction
      const { error } = await supabase
        .from('credit_transactions')
        .insert({
          travel_id: travelId,
          transaction_type: 'purchase',
          amount: credits,
          status: 'pending',
          payment_proof_url: proofUrl,
          notes: `Pembelian ${credits} kredit seharga Rp ${amount.toLocaleString('id-ID')}`
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-transactions'] });
      toast({ 
        title: 'Permintaan pembelian berhasil dikirim', 
        description: 'Admin akan memverifikasi pembayaran Anda segera.' 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Gagal mengirim permintaan', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
};

// Get agent's credit transactions
export const useCreditTransactions = (travelId: string | undefined) => {
  return useQuery({
    queryKey: ['agent-transactions', travelId],
    queryFn: async (): Promise<CreditTransaction[]> => {
      if (!travelId) return [];
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CreditTransaction[];
    },
    enabled: !!travelId,
  });
};
