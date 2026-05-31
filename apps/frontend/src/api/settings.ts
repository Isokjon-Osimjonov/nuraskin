import { api } from '@/lib/api';

export async function getStorefrontSettings() {
  return await api.get('/storefront/settings');
}

export async function getPaymentInfo(region: string) {
  return await api.get<any>(`/storefront/payment-info?region=${region}`);
}
