import { api } from '@/lib/api';
import type { DashboardKPIs, DashboardTrend, DashboardRegion } from '@nuraskin/shared-types';

export const dashboardApi = {
  getKPIs: (region: DashboardRegion): Promise<DashboardKPIs> =>
    api.get<any>(`/admin/dashboard/kpis?region=${region}`),
  getTrend: (region: DashboardRegion): Promise<DashboardTrend> =>
    api.get<any>(`/admin/dashboard/trend?region=${region}`),
};
