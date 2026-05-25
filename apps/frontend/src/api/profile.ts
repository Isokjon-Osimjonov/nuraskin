import { api } from '@/lib/api';

export async function updateRegion(region: string) {
  return await api.auth.patch<any>('/storefront/profile/region', { region });
}
