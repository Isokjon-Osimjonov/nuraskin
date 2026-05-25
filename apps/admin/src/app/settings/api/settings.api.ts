import { api } from '@/lib/api';
import type { 
  SettingsResponse, 
  UpdateSettingsInput,
  KorShippingTierResponse,
  KorShippingTierInput
} from '@nuraskin/shared-types';



export const settingsApi = {
  get: (): Promise<SettingsResponse> => api.get<any>('/settings'),
  update: (data: UpdateSettingsInput): Promise<SettingsResponse> =>
    api.patch<any>('/settings', data),

  // Korea Shipping Tiers
  listShippingTiers: (): Promise<KorShippingTierResponse[]> => 
    api.get<any>('/settings/shipping-tiers'),
  
  createShippingTier: (data: KorShippingTierInput): Promise<KorShippingTierResponse> =>
    api.post<any>('/settings/shipping-tiers', data),
  
  updateShippingTier: (id: string, data: Partial<KorShippingTierInput>): Promise<KorShippingTierResponse> =>
    api.patch<any>(`/settings/shipping-tiers/${id}`, data),
  
  deleteShippingTier: (id: string): Promise<void> =>
    api.delete<any>(`/settings/shipping-tiers/${id}`),
};
