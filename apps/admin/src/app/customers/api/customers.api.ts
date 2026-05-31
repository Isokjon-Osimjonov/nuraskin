import { api } from '@/lib/api';
import type {
  CustomerListItem,
  CustomerFilters,
  UpdateCustomerInput,
} from '@nuraskin/shared-types';

export const customersApi = {
  getAll: (filters: CustomerFilters): Promise<{ data: CustomerListItem[]; total: number }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });
    return api.get<any>(`/customers?${params.toString()}`);
  },

  getById: (id: string): Promise<any> => api.get<any>(`/customers/${id}`),

  update: (id: string, data: UpdateCustomerInput): Promise<any> =>
    api.patch<any>(`/customers/${id}`, data),

  delete: (id: string): Promise<void> => api.delete<any>(`/customers/${id}`),
};
