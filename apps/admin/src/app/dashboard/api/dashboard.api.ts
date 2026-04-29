import { useAuthStore } from '../../../stores/auth.store';
import type { DashboardKPIs, DashboardTrend, DashboardRegion } from '@nuraskin/shared-types';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}/api${endpoint}`, { ...options, headers });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export const dashboardApi = {
  getKPIs: (region: DashboardRegion): Promise<DashboardKPIs> => 
    fetchWithAuth(`/admin/dashboard/kpis?region=${region}`),
  getTrend: (region: DashboardRegion): Promise<DashboardTrend> => 
    fetchWithAuth(`/admin/dashboard/trend?region=${region}`),
};
