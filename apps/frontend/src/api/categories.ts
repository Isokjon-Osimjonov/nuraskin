import { apiFetch } from '@/lib/apiFetch';
import type { CategoryResponse } from '@nuraskin/shared-types';

export async function getCategories() {
  const categories = await apiFetch<CategoryResponse[]>('/categories');
  return {
    data: categories
  };
}
