import { useAuthStore } from '../../../stores/auth.store';
import type { 
  SettingsResponse, 
  UpdateSettingsInput,
  KorShippingTierResponse,
  KorShippingTierInput
} from '@nuraskin/shared-types';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}/api${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'API error');
  }
  if (response.status === 204) return null;
  return response.json();
}

export const settingsApi = {
  get: (): Promise<SettingsResponse> => fetchWithAuth('/settings'),
  update: (data: UpdateSettingsInput): Promise<SettingsResponse> =>
    fetchWithAuth('/settings', { method: 'PATCH', body: JSON.stringify(data) }),

  // Korea Shipping Tiers
  listShippingTiers: (): Promise<KorShippingTierResponse[]> => 
    fetchWithAuth('/settings/shipping-tiers'),
  
  createShippingTier: (data: KorShippingTierInput): Promise<KorShippingTierResponse> =>
    fetchWithAuth('/settings/shipping-tiers', { method: 'POST', body: JSON.stringify(data) }),
  
  updateShippingTier: (id: string, data: Partial<KorShippingTierInput>): Promise<KorShippingTierResponse> =>
    fetchWithAuth(`/settings/shipping-tiers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  
  deleteShippingTier: (id: string): Promise<void> =>
    fetchWithAuth(`/settings/shipping-tiers/${id}`, { method: 'DELETE' }),
};
