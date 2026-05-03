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

export async function getReceipt(orderId: string) {
  try {
    return await apiFetch<{ receipt_url: string }>(`/storefront/orders/${orderId}/receipt`);
  } catch (err: any) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function getUploadUrl() {
  return await apiFetch<{ url: string; timestamp: number; signature: string; apiKey: string }>('/categories/upload-url', {
    method: 'POST',
  });
}

export async function uploadReceipt(orderId: string, paymentProofUrl: string) {
  return await apiFetch<any>(`/storefront/orders/${orderId}/receipt`, {
    method: 'PATCH',
    body: JSON.stringify({ 
      payment_proof_url: paymentProofUrl
    }),
  });
}

