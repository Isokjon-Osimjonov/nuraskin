import { useAuthStore } from '../../../stores/auth.store';
import type { AddBatchInput, InventoryBatchResponse } from '@nuraskin/shared-types';

const API_URL = import.meta.env.VITE_API_URL;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
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
  getOverview: (): Promise<InventoryOverviewItem[]> => fetchWithAuth('/inventory/overview'),
  getBatches: (productId: string): Promise<InventoryBatchResponse[]> =>
    fetchWithAuth(`/inventory/batches/${productId}`),
};
