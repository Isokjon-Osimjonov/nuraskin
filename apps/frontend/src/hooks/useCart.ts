import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cartApi from '@/api/cart';
import { useAppStore } from '@/stores/app.store';
import { toast } from 'sonner';

export function useCart() {
  const { isAuthenticated } = useAppStore();
  
  return useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
    enabled: isAuthenticated,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAppStore();

  return useMutation({
    mutationFn: cartApi.addToCart,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      toast.success('Savatchaga qo\'shildi');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xatolik yuz berdi');
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => 
      cartApi.updateCartItem(id, { quantity }),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xatolik yuz berdi');
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cartApi.removeCartItem,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      queryClient.setQueryData(['cart'], null);
    },
  });
}
