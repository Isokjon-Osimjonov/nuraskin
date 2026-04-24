import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useMyWaitlistIds() {
  return useQuery({
    queryKey: ['waitlist-ids'],
    queryFn: () => ({ data: [] as string[] })
  });
}

export function useMyWaitlist() {
  return useQuery({
    queryKey: ['my-waitlist'],
    queryFn: async () => {
      return { data: [] };
    },
  });
}

export function useToggleWaitlist() {
  const queryClient = useQueryClient();
  const add = useMutation({
    mutationFn: async (_productId: string) => ({ success: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waitlist-ids'] }),
  });
  const remove = useMutation({
    mutationFn: async (_productId: string) => ({ success: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waitlist-ids'] }),
  });

  return { add, remove };
}