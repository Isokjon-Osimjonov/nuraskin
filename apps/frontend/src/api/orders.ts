import { api } from '@/lib/api';
import type { CreateStorefrontOrderInput } from '@nuraskin/shared-types';

export async function createOrder(data: CreateStorefrontOrderInput) {
  return await api.auth.post<any>('/storefront/orders', data);
}

export async function getMyOrders() {
  return await api.auth.get<any>('/storefront/orders/my');
}

export async function getOrderById(id: string) {
  return await api.auth.get<any>(`/storefront/orders/${id}`);
}

export async function getReceipt(orderId: string) {
  try {
    return await api.auth.get<any>(`/storefront/orders/${orderId}/receipt`);
  } catch (err: any) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function getUploadUrl() {
  return await api.auth.post<any>('/categories/upload-url', {});
}

export async function uploadReceipt(orderId: string, paymentProofUrl: string) {
  return await api.auth.patch<any>(`/storefront/orders/${orderId}/receipt`, {
    payment_proof_url: paymentProofUrl,
  });
}

export async function cancelOrder(orderId: string) {
  return await api.auth.delete<any>(`/storefront/orders/${orderId}`);
}
