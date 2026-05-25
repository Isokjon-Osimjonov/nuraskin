import { api } from '@/lib/api';
import type { CategoryResponse } from '@nuraskin/shared-types';

export async function getCategories() {
  const categories = await api.get('/storefront/categories');
  // storefront categories returns direct array
  return {
    data: categories
  };
}
