import { apiFetch } from '@/lib/apiFetch';
import type { StorefrontSettings } from '@nuraskin/shared-types';

export async function getStorefrontSettings() {
  return await apiFetch<StorefrontSettings>('/storefront/settings');
}

export async function getPaymentInfo(region: string) {
  return await apiFetch<any>(`/storefront/payment-info?region=${region}`);
}
