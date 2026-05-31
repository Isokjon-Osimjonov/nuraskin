import { api } from '@/lib/api';
import type {
  OrderResponse,
  CreateOrderInput,
  AddOrderItemInput,
  UpdateOrderStatusInput,
  ScanItemInput,
  CreateManualOrderInput,
  ConfirmManualPaymentInput,
} from '@nuraskin/shared-types';

export const ordersApi = {
  create: (data: CreateOrderInput): Promise<OrderResponse> => api.post<any>('/orders', data),

  list: (filters: { status?: string[]; customerId?: string } = {}): Promise<OrderResponse[]> => {
    const params = new URLSearchParams();
    if (filters.status?.length) params.set('status', filters.status.join(','));
    if (filters.customerId) params.set('customerId', filters.customerId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<any>(`/orders${query}`);
  },

  getById: (id: string): Promise<OrderResponse> => api.get<any>(`/orders/${id}`),

  getReceipt: (id: string): Promise<{ receipt_url: string }> =>
    api.get<any>(`/orders/${id}/receipt`),

  addItem: (id: string, data: AddOrderItemInput): Promise<any> =>
    api.post<any>(`/orders/${id}/items`, data),

  removeItem: (id: string, itemId: string): Promise<void> =>
    api.delete<any>(`/orders/${id}/items/${itemId}`),

  updateStatus: (
    id: string,
    data: UpdateOrderStatusInput & { bypassDebtLimit?: boolean }
  ): Promise<void> => api.patch<any>(`/orders/${id}/status`, data),

  scanItem: (
    id: string,
    data: ScanItemInput
  ): Promise<{
    success: boolean;
    alreadyScanned?: boolean;
    allItemsScanned?: boolean;
    message: string;
    product?: any;
    scannedCount?: number;
    totalCount?: number;
  }> => api.post<any>(`/orders/${id}/scan-item`, data),

  completePacking: (id: string): Promise<void> =>
    api.post<any>(`/orders/${id}/complete-packing`, {}),

  createManual: (data: CreateManualOrderInput): Promise<OrderResponse> =>
    api.post<any>('/orders/manual', data),

  confirmPayment: (id: string, data: ConfirmManualPaymentInput): Promise<OrderResponse> =>
    api.post<any>(`/orders/${id}/confirm-payment`, data),

  searchCustomers: (q: string): Promise<any[]> =>
    api.get<any>(`/orders/customers/search?q=${encodeURIComponent(q)}`),
};
