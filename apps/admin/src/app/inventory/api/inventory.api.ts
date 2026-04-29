import { useAuthStore } from '../../../stores/auth.store';
import type { AddBatchInput, InventoryBatchResponse, UpdateBatchInput, AdjustQuantityInput } from '@nuraskin/shared-types';

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

export interface InventoryOverviewItem {
  id: string;
  name: string;
  brandName: string;
  barcode: string;
  sku: string;
  imageUrls: string[];
  totalStock: number;
  batchCount: number;
  earliestExpiry: string | null;
}

export interface ScannedProduct {
  id: string;
  name: string;
  brandName: string;
  barcode: string;
  sku: string;
  totalStock: number;
  imageUrls: string[];
}

export const inventoryApi = {
  scan: (barcode: string): Promise<ScannedProduct> => fetchWithAuth(`/inventory/scan/${barcode}`),
  addBatch: (data: AddBatchInput): Promise<InventoryBatchResponse> =>
    fetchWithAuth('/inventory/batches', { method: 'POST', body: JSON.stringify(data) }),
  getOverview: (filters?: { deleted?: boolean }): Promise<InventoryOverviewItem[]> => {
    const params = new URLSearchParams();
    if (filters?.deleted) params.set('deleted', 'true');
    const qs = params.toString();
    return fetchWithAuth(`/inventory/overview${qs ? `?${qs}` : ''}`);
  },
  getBatches: (productId: string): Promise<InventoryBatchResponse[]> =>
    fetchWithAuth(`/inventory/batches/${productId}`),
  updateBatch: (batchId: string, data: UpdateBatchInput): Promise<InventoryBatchResponse> =>
    fetchWithAuth(`/inventory/batches/${batchId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  adjustQuantity: (batchId: string, data: AdjustQuantityInput): Promise<InventoryBatchResponse> =>
    fetchWithAuth(`/inventory/batches/${batchId}/adjust-quantity`, { method: 'POST', body: JSON.stringify(data) }),
  deleteBatch: (batchId: string): Promise<{ success: true }> =>
    fetchWithAuth(`/inventory/batches/${batchId}`, { method: 'DELETE' }),
};
