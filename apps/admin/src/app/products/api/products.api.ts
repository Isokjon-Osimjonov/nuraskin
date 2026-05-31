import { api } from '@/lib/api';
import type {
  CreateProductInput,
  UpdateProductInput,
  AnalyzeImageResponse,
} from '@nuraskin/shared-types';

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
    return api.get<any>(`/products${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string): Promise<ProductDetail> => api.get<any>(`/products/${id}`),
  getByBarcode: (barcode: string): Promise<ProductDetail> =>
    api.get<any>(`/products/barcode/${barcode}`),
  create: (data: CreateProductInput) => api.post<any>('/products', data),
  update: (id: string, data: UpdateProductInput) => api.patch<any>(`/products/${id}`, data),
  restore: (id: string) => api.patch<any>(`/products/${id}/restore`, {}),
  delete: (id: string) => api.delete<any>(`/products/${id}`),
  analyzeImage: (imageUrl: string): Promise<AnalyzeImageResponse> =>
    api.post<any>('/products/analyze-image', { imageUrl }),
  getUploadUrl: (): Promise<{
    url: string;
    timestamp: number;
    signature: string;
    apiKey: string;
  }> => api.post<any>('/categories/upload-url', {}),
};
