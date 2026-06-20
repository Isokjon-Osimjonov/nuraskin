import { api } from '@/lib/api';
import type {
  AddBatchInput,
  InventoryBatchResponse,
  UpdateBatchInput,
  AdjustQuantityInput,
  CorrectInitialQtyInput,
} from '@nuraskin/shared-types';

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
  scan: (barcode: string): Promise<ScannedProduct> => api.get<any>(`/inventory/scan/${barcode}`),
  addBatch: (data: AddBatchInput): Promise<InventoryBatchResponse> =>
    api.post<any>('/inventory/batches', data),
  getOverview: (filters?: { deleted?: boolean }): Promise<InventoryOverviewItem[]> => {
    const params = new URLSearchParams();
    if (filters?.deleted) params.set('deleted', 'true');
    const qs = params.toString();
    return api.get<any>(`/inventory/overview${qs ? `?${qs}` : ''}`);
  },
  getBatches: (productId: string): Promise<InventoryBatchResponse[]> =>
    api.get<any>(`/inventory/batches/${productId}`),
  updateBatch: (batchId: string, data: UpdateBatchInput): Promise<InventoryBatchResponse> =>
    api.patch<any>(`/inventory/batches/${batchId}`, data),
  adjustQuantity: (batchId: string, data: AdjustQuantityInput): Promise<InventoryBatchResponse> =>
    api.post<any>(`/inventory/batches/${batchId}/adjust-quantity`, data),
  correctInitialQty: (
    batchId: string,
    data: CorrectInitialQtyInput
  ): Promise<InventoryBatchResponse> =>
    api.post<any>(`/inventory/batches/${batchId}/correct-initial-qty`, data),
  deleteBatch: (batchId: string): Promise<{ success: true }> =>
    api.delete<any>(`/inventory/batches/${batchId}`),
};
