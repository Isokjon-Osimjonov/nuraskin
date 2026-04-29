import { apiFetch } from '@/lib/apiFetch';
import type { 
  CreateStorefrontOrderInput, 
  StorefrontOrderResponse 
} from '@nuraskin/shared-types';

export async function createOrder(data: CreateStorefrontOrderInput) {
  return await apiFetch<StorefrontOrderResponse>('/storefront/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyOrders() {
  return await apiFetch<any[]>('/storefront/orders/my');
}

export async function getOrderById(id: string) {
  return await apiFetch<StorefrontOrderResponse>(`/storefront/orders/${id}`);
}

export async function uploadReceipt(orderId: string, base64Data: string, mimeType: string) {
  return await apiFetch<StorefrontOrderResponse>(`/storefront/orders/${orderId}/receipt`, {
    method: 'POST',
    body: JSON.stringify({ 
      receiptImageBase64: base64Data,
      mimeType 
    }),
  });
}
