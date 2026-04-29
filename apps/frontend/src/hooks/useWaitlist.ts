import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as waitlistApi from '@/api/waitlist';
import { useAppStore } from '@/stores/app.store';
import { toast } from 'sonner';

export function useMyWaitlist() {
  const { isAuthenticated } = useAppStore();
  
  return useQuery({
    queryKey: ['waitlist'],
    queryFn: waitlistApi.getMyWaitlist,
    enabled: isAuthenticated,
  });
}

export function useMyWaitlistIds() {
  const { data } = useMyWaitlist();
  const ids = data?.map(item => item.productId) ?? [];
  return { data: ids };
}

export function useToggleWaitlist() {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: waitlistApi.addToWaitlist,
    onMutate: async (productId) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ['waitlist'] });
      const previousWaitlist = queryClient.getQueryData<any[]>(['waitlist']) || [];
      
      // We don't have the full product object here easily for the waitlist array, 
      // but useMyWaitlistIds uses this data. 
      // For now, let's just invalidate queries on success/error, 
      // OR we can optimistically update the IDs if we had a specific ID query.
      // Since useMyWaitlistIds derives from useMyWaitlist, we'd need to mock a full entry.
      
      return { previousWaitlist };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Kutish ro\'yxatiga qo\'shildi');
    },
    onError: (err, productId, context) => {
      if (context?.previousWaitlist) {
        queryClient.setQueryData(['waitlist'], context.previousWaitlist);
      }
      toast.error('Xatolik yuz berdi');
    }
  });

  const remove = useMutation({
    mutationFn: waitlistApi.removeFromWaitlist,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['waitlist'] });
      const previousWaitlist = queryClient.getQueryData<any[]>(['waitlist']) || [];
      
      queryClient.setQueryData(['waitlist'], previousWaitlist.filter(i => i.productId !== productId));
      
      return { previousWaitlist };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Kutish ro\'yxatidan olib tashlandi');
    },
    onError: (err, productId, context) => {
      if (context?.previousWaitlist) {
        queryClient.setQueryData(['waitlist'], context.previousWaitlist);
      }
    }
  });

  return { add, remove };
}
