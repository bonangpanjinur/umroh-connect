import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
import { PackageCredits, CreditTransaction } from '@/types/database';
import { toast } from '@/hooks/use-toast';

// Get agent's credits balance
export const useAgentCredits = (travelId: string | undefined) => {
  return useQuery({
    queryKey: ['agent-credits', travelId],
    queryFn: async (): Promise<PackageCredits | null> => {
      if (!travelId) return null;
      
      let data: { credits_remaining: number } | null;
      try { data = await coreApi.getAgentCredits(travelId); }
      catch (error) { console.error('Error fetching credits:', error); return null; }
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
      proofDocumentId
    }: { 
      travelId: string; 
      credits: number; 
      amount: number; 
      proofDocumentId: string;
    }) => {
      await coreApi.requestCreditPurchase(travelId, {
        credits,
        amount,
        proof_document_id: proofDocumentId,
        notes: `Pembelian ${credits} kredit seharga Rp ${amount.toLocaleString('id-ID')}`,
      });
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
      
      const data = await coreApi.listAgentCreditTransactions(travelId);
      return (data || []) as unknown as CreditTransaction[];
    },
    enabled: !!travelId,
  });
};
