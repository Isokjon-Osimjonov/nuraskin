import { apiFetch } from '@/lib/apiFetch';
import type { StorefrontSettings } from '@nuraskin/shared-types';

export async function getStorefrontSettings() {
  return await apiFetch<StorefrontSettings>('/storefront/settings');
}
