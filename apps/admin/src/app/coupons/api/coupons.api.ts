import { api } from '@/lib/api';
import type { 
  CouponResponse, 
  CreateCouponInput, 
  UpdateCouponInput 
} from '@nuraskin/shared-types';



export const couponsApi = {
  getAll: (filters: { status?: string, search?: string, page?: number, limit?: number }): Promise<{ data: CouponResponse[]; total: number }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });
    return api.get<any>(`/admin/coupons?${params.toString()}`);
  },

  getById: (id: string): Promise<CouponResponse & { redemptions: any[] }> => api.get<any>(`/admin/coupons/${id}`),

  create: (data: CreateCouponInput): Promise<CouponResponse> =>
    api.post<any>('/admin/coupons', data),

  update: (id: string, data: UpdateCouponInput): Promise<CouponResponse> =>
    api.patch<any>(`/admin/coupons/${id}`, data),

  updateStatus: (id: string, status: 'ACTIVE' | 'PAUSED'): Promise<CouponResponse> =>
    api.patch<any>(`/admin/coupons/${id}/status`, { status }),

  delete: (id: string): Promise<void> =>
    api.delete<any>(`/admin/coupons/${id}`),
};
