import { apiFetch } from '@/lib/apiFetch';

export async function updateRegion(region: string) {
  return await apiFetch<{ success: boolean }>('/storefront/profile/region', {
    method: 'PATCH',
    body: JSON.stringify({ region }),
  });
}
