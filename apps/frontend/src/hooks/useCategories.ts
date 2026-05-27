import { queryKeys } from '@nuraskin/shared-utils';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/api/categories';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: async () => {
      const res = await getCategories();
      return res;
    },
  });
}