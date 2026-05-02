import { useQuery } from '@tanstack/react-query';
import { getProducts, getProductBySlug } from '@/api/products';
import { useAppStore } from '@/stores/app.store';

export function useProducts(params?: Record<string, unknown>) {
  const { regionCode } = useAppStore();
  
  return useQuery({
    queryKey: ['products', regionCode, params],
    queryFn: async () => {
      const res = await getProducts(params);
      return res;
    },
  });
}

export function useProductBySlug(slug?: string) {
  const { regionCode } = useAppStore();
  
  return useQuery({
    queryKey: ['product', slug, regionCode],
    queryFn: async () => {
      if (!slug) return { data: null };
      const res = await getProductBySlug(slug);
      return res;
    },
    enabled: !!slug,
  });
}