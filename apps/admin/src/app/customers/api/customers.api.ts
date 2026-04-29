import { useAuthStore } from '../../../stores/auth.store';
import type { 
  CustomerListItem, 
  CustomerFilters, 
  UpdateCustomerInput 
} from '@nuraskin/shared-types';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const { token } = useAuthStore.getState();
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Xatolik yuz berdi' }));
    throw new Error(error.message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const customersApi = {
  getAll: (filters: CustomerFilters): Promise<{ data: CustomerListItem[]; total: number }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });
    return fetchWithAuth(`/customers?${params.toString()}`);
  },

  getById: (id: string): Promise<any> => fetchWithAuth(`/customers/${id}`),

  update: (id: string, data: UpdateCustomerInput): Promise<any> =>
    fetchWithAuth(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchWithAuth(`/customers/${id}`, {
      method: 'DELETE',
    }),
};
