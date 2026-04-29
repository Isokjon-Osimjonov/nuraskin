import { apiFetch } from '@/lib/apiFetch';
import type { 
  StorefrontProductListItem, 
  StorefrontProductDetail 
} from '@nuraskin/shared-types';

export async function getProducts(params?: { categoryId?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set('categoryId', params.categoryId);
  if (params?.search) query.set('search', params.search);
  
  const qs = query.toString() ? `?${query.toString()}` : '';
  const products = await apiFetch<StorefrontProductListItem[]>(`/storefront/products${qs}`);
  
  return {
    data: products
  };
}

export async function getProductBySlug(slug: string) {
  const product = await apiFetch<StorefrontProductDetail>(`/storefront/products/${slug}`);
  
  return {
    data: product
  };
}
