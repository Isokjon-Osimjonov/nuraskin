import { api } from '@/lib/api';
import type { CategoryResponse, CreateCategoryInput, UpdateCategoryInput } from '@nuraskin/shared-types';



export const categoriesApi = {
  getAll: (params?: { page?: number; limit?: number }): Promise<{ data: CategoryResponse[]; total: number; page: number; limit: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return api.get<any>(`/categories${query}`);
  },
  create: (data: CreateCategoryInput): Promise<CategoryResponse> =>
    api.post<any>('/categories', data),
  update: ({ id, data }: { id: string; data: UpdateCategoryInput }): Promise<CategoryResponse> =>
    api.put<any>(`/categories/${id}`, data),
  delete: (id: string): Promise<void> =>
    api.delete<any>(`/categories/${id}`),
  getUploadUrl: (): Promise<{ url: string; timestamp: number; signature: string; apiKey: string }> =>
    api.post<any>('/categories/upload-url', {}),
};

// Mock products api for the multi-select
export const productsApi = {
  getAll: async () => [
    { id: '407d8f30-801a-46da-b035-7c9ebdf0fb23', name: 'Product 1' },
    { id: '855478db-2303-4c91-bbd5-f8406f8679f2', name: 'Product 2' },
    { id: '12d329aa-40ed-4d9f-a4fb-27cbde2c1ab1', name: 'Product 3' },
  ],
};
