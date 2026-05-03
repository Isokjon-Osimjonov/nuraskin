import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as addressApi from '@/api/addresses';
import { toast } from 'sonner';

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: addressApi.getAddresses,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      console.log('--- STARTING CREATE ADDRESS MUTATION ---');
      console.log('Payload:', data);
      try {
        const result = await addressApi.createAddress(data);
        console.log('API Result:', result);
        return result;
      } catch (err) {
        console.error('API Error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      console.log('Mutation SUCCESS');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Manzil saqlandi');
    },
    onError: (error: any) => {
      console.error('Mutation ERROR:', error);
      toast.error(error.message || 'Xatolik yuz berdi');
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => addressApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Manzil yangilandi');
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addressApi.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Manzil o\'chirildi');
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addressApi.setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}
