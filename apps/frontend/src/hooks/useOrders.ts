import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ordersApi from '@/api/orders';
import { useCart } from './useCart';

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { refetch: refetchCart } = useCart();

  return useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      refetchCart();
    },
  });
}
