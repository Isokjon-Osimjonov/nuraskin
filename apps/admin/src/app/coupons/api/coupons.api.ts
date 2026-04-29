import { useAuthStore } from '@/stores/auth.store';
import type { 
  CouponResponse, 
  CreateCouponInput, 
  UpdateCouponInput 
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

export const couponsApi = {
  getAll: (filters: { status?: string, search?: string, page?: number, limit?: number }): Promise<{ data: CouponResponse[]; total: number }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });
    return fetchWithAuth(`/admin/coupons?${params.toString()}`);
  },

  getById: (id: string): Promise<CouponResponse & { redemptions: any[] }> => fetchWithAuth(`/admin/coupons/${id}`),

  create: (data: CreateCouponInput): Promise<CouponResponse> =>
    fetchWithAuth('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateCouponInput): Promise<CouponResponse> =>
    fetchWithAuth(`/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchWithAuth(`/admin/coupons/${id}`, {
      method: 'DELETE',
    }),
};
