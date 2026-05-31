import { api } from '@/lib/api';

export async function getCategories() {
  const categories = await api.get('/storefront/categories');
  // storefront categories returns direct array
  return {
    data: categories,
  };
}
