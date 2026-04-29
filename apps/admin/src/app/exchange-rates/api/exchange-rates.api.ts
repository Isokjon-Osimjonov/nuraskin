import { useAuthStore } from '../../../stores/auth.store';
import type { ExchangeRateResponse, CreateExchangeRateInput } from '@nuraskin/shared-types';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}/api${endpoint}`, { ...options, headers });
  if (!response.ok) throw new Error('API error');
  return response.json();
}

export const exchangeRatesApi = {
  getLatest: (): Promise<ExchangeRateResponse> => fetchWithAuth('/exchange-rates/latest'),
  list: (): Promise<ExchangeRateResponse[]> => fetchWithAuth('/exchange-rates'),
  create: (data: CreateExchangeRateInput): Promise<ExchangeRateResponse> =>
    fetchWithAuth('/exchange-rates', { method: 'POST', body: JSON.stringify(data) }),
};

