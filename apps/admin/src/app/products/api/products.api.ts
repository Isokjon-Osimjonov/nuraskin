import { useAuthStore } from '../../../stores/auth.store';
import type {
  CreateProductInput,
  UpdateProductInput,
  AnalyzeImageResponse,
} from '@nuraskin/shared-types';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}/api${endpoint}`, { ...options, headers });
  if (!response.ok) throw new Error(await response.text());
  if (response.status === 204) return null;
  return response.json();
}

export interface ProductListItem {
  id: string;
  barcode: string;
  sku: string;
  name: string;
  brandName: string;
  categoryId: string;
  descriptionUz: string | null;
  howToUseUz: string | null;
  ingredients: string[];
  skinTypes: string[];
  benefits: string[];
  weightGrams: number;
  imageUrls: string[];
  isActive: boolean;
  showStockCount: boolean;
  deletedAt: string | null;
  totalStock: number;
  uzbRetail: string | null;
  uzbWholesale: string | null;
  uzbCurrency: string | null;
  korRetail: string | null;
  korWholesale: string | null;
  korCurrency: string | null;
}

export interface ProductRegionalConfig {
  id: string;
  productId: string;
  regionCode: 'UZB' | 'KOR';
  retailPrice: string;
  wholesalePrice: string;
  currency: string;
  minWholesaleQty: number;
  minOrderQty: number;
  isAvailable: boolean;
}

export interface ProductDetail extends ProductListItem {
  regionalConfigs: ProductRegionalConfig[];
}

export const productsApi = {
  getAll: (filters?: {
    categoryId?: string;
    isActive?: boolean;
    search?: string;
    deleted?: boolean;
  }): Promise<ProductListItem[]> => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
    if (filters?.search) params.set('search', filters.search);
    if (filters?.deleted) params.set('deleted', 'true');
    const qs = params.toString();
    return fetchWithAuth(`/products${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string): Promise<ProductDetail> => fetchWithAuth(`/products/${id}`),
  getByBarcode: (barcode: string): Promise<ProductDetail> =>
    fetchWithAuth(`/products/barcode/${barcode}`),
  create: (data: CreateProductInput) =>
    fetchWithAuth('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateProductInput) =>
    fetchWithAuth(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  restore: (id: string) => fetchWithAuth(`/products/${id}/restore`, { method: 'PATCH' }),
  delete: (id: string) => fetchWithAuth(`/products/${id}`, { method: 'DELETE' }),
  analyzeImage: (imageUrl: string): Promise<AnalyzeImageResponse> =>
    fetchWithAuth('/products/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    }),
  getUploadUrl: (): Promise<{ url: string; timestamp: number; signature: string; apiKey: string }> =>
    fetchWithAuth('/categories/upload-url', { method: 'POST' }),
};
