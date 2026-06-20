import { api } from '@/lib/api';
import type {
  SettingsResponse,
  UpdateSettingsInput,
  KorShippingTierResponse,
  KorShippingTierInput,
  ShippingBoxResponse,
  ShippingBoxInput,
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

  updateShippingTier: (
    id: string,
    data: Partial<KorShippingTierInput>
  ): Promise<KorShippingTierResponse> => api.patch<any>(`/settings/shipping-tiers/${id}`, data),

  deleteShippingTier: (id: string): Promise<void> =>
    api.delete<any>(`/settings/shipping-tiers/${id}`),

  // Shipping Boxes
  listShippingBoxes: (): Promise<ShippingBoxResponse[]> => api.get<any>('/settings/shipping-boxes'),

  createShippingBox: (data: ShippingBoxInput): Promise<ShippingBoxResponse> =>
    api.post<any>('/settings/shipping-boxes', data),

  updateShippingBox: (id: string, data: Partial<ShippingBoxInput>): Promise<ShippingBoxResponse> =>
    api.patch<any>(`/settings/shipping-boxes/${id}`, data),

  deleteShippingBox: (id: string): Promise<void> =>
    api.delete<any>(`/settings/shipping-boxes/${id}`),
};
