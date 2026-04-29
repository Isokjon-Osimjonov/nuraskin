import { useAuthStore } from '../../../stores/auth.store';
import type { 
  OrderResponse, 
  CreateOrderInput, 
  AddOrderItemInput, 
  UpdateOrderStatusInput, 
  ScanItemInput 
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

export const ordersApi = {
  create: (data: CreateOrderInput): Promise<OrderResponse> =>
    fetchWithAuth('/orders', { method: 'POST', body: JSON.stringify(data) }),
    
  list: (filters: { status?: string[]; customerId?: string } = {}): Promise<OrderResponse[]> => {
    const params = new URLSearchParams();
    if (filters.status?.length) params.set('status', filters.status.join(','));
    if (filters.customerId) params.set('customerId', filters.customerId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchWithAuth(`/orders${query}`);
  },
  
  getById: (id: string): Promise<OrderResponse> =>
    fetchWithAuth(`/orders/${id}`),
    
  addItem: (id: string, data: AddOrderItemInput): Promise<any> =>
    fetchWithAuth(`/orders/${id}/items`, { method: 'POST', body: JSON.stringify(data) }),
    
  removeItem: (id: string, itemId: string): Promise<void> =>
    fetchWithAuth(`/orders/${id}/items/${itemId}`, { method: 'DELETE' }),
    
  updateStatus: (id: string, data: UpdateOrderStatusInput & { bypassDebtLimit?: boolean }): Promise<void> =>
    fetchWithAuth(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
    
  scanItem: (id: string, data: ScanItemInput): Promise<{ match: boolean; item?: any; error?: string }> =>
    fetchWithAuth(`/orders/${id}/scan-item`, { method: 'POST', body: JSON.stringify(data) }),
    
  completePacking: (id: string): Promise<void> =>
    fetchWithAuth(`/orders/${id}/complete-packing`, { method: 'POST' }),
};
