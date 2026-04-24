import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/api/categories';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await getCategories();
      return res;
    },
  });
}