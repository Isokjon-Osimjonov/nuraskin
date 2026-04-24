import { useAuthStore } from '../../../stores/auth.store';
import type { CategoryResponse, CreateCategoryInput, UpdateCategoryInput } from '@nuraskin/shared-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'API request failed');
  }
  
  if (response.status === 204) return null;
  return response.json();
}

export const categoriesApi = {
  getAll: (): Promise<CategoryResponse[]> => fetchWithAuth('/categories'),
  create: (data: CreateCategoryInput): Promise<CategoryResponse> =>
    fetchWithAuth('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: ({ id, data }: { id: string; data: UpdateCategoryInput }): Promise<CategoryResponse> =>
    fetchWithAuth(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> =>
    fetchWithAuth(`/categories/${id}`, { method: 'DELETE' }),
  getUploadUrl: (): Promise<{ url: string; timestamp: number; signature: string; apiKey: string }> =>
    fetchWithAuth('/categories/upload-url', { method: 'POST' }),
};

// Mock products api for the multi-select
export const productsApi = {
  getAll: async () => [
    { id: '407d8f30-801a-46da-b035-7c9ebdf0fb23', name: 'Product 1' },
    { id: '855478db-2303-4c91-bbd5-f8406f8679f2', name: 'Product 2' },
    { id: '12d329aa-40ed-4d9f-a4fb-27cbde2c1ab1', name: 'Product 3' },
  ],
};
