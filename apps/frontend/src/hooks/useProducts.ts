import { useQuery } from '@tanstack/react-query';
import { getProducts, getProductBySlug } from '@/api/products';

export function useProducts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const res = await getProducts(params);
      return res;
    },
  });
}

export function useProductBySlug(slug?: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      if (!slug) return { data: null };
      const res = await getProductBySlug(slug);
      return res;
    },
    enabled: !!slug,
  });
}