import { api } from '@/lib/api';
import type { 
  StorefrontProductListItem, 
  StorefrontProductDetail 
} from '@nuraskin/shared-types';

export async function getProducts(params?: { categoryId?: string; search?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set('categoryId', params.categoryId);
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));
  
  const qs = query.toString() ? `?${query.toString()}` : '';
  const products = await api.get<StorefrontProductListItem[]>(`/storefront/products${qs}`);
  
  return {
    data: products
  };
}

export async function getProductBySlug(slug: string) {
  const product = await api.get<StorefrontProductDetail>(`/storefront/products/${slug}`);
  
  return {
    data: product
  };
}
