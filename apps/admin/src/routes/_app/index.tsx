import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { dashboardApi } from '@/app/dashboard/api/dashboard.api';
import { Button } from '@/components/ui/button';
import { KpiCards } from '@/app/dashboard/components/KpiCards';
import { ActionQueues } from '@/app/dashboard/components/ActionQueues';
import { TrendCharts } from '@/app/dashboard/components/TrendCharts';

const dashboardSearchSchema = z.object({
  region: z.enum(['ALL', 'UZB', 'KOR']).optional().catch('ALL'),
});

export const Route = createFileRoute('/_app/')({
  validateSearch: (search) => dashboardSearchSchema.parse(search),
  component: Dashboard,
});

function Dashboard() {
  const navigate = Route.useNavigate();
  const { region } = Route.useSearch();
  const activeRegion = (region as string) === 'UZB' ? 'UZB' : (region as string) === 'KOR' ? 'KOR' : 'ALL';
  const lastUpdated = format(new Date(), 'HH:mm:ss');

  const { data: kpis, isLoading: kpisLoading, isFetching: kpisFetching } = useQuery({
    queryKey: ['dashboard', 'kpis', activeRegion],
    queryFn: () => dashboardApi.getKPIs(activeRegion as any),
    staleTime: 60_000,
  });

  const { data: trend, isLoading: trendLoading, isFetching: trendFetching } = useQuery({
    queryKey: ['dashboard', 'trend', activeRegion],
    queryFn: () => dashboardApi.getTrend(activeRegion as any),
    staleTime: 60_000,
  });

  const setRegion = (r: 'ALL' | 'UZB' | 'KOR') => {
    navigate({ search: (old: any) => ({ ...old, region: r }) });
  };

  const isRefreshing = kpisFetching || trendFetching;

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      {/* SECTION 0 — Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              Oxirgi yangilash: {lastUpdated}
            </p>
            {isRefreshing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
          <Button
            variant={activeRegion === 'ALL' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setRegion('ALL')}
            className={activeRegion === 'ALL' ? 'bg-coral-500 text-white hover:bg-coral-600' : 'text-foreground'}
          >
            Hammasi
          </Button>
          <Button
            variant={activeRegion === 'UZB' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setRegion('UZB')}
            className={activeRegion === 'UZB' ? 'bg-coral-500 text-white hover:bg-coral-600' : 'text-foreground'}
          >
            O'zbekiston
          </Button>
          <Button
            variant={activeRegion === 'KOR' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setRegion('KOR')}
            className={activeRegion === 'KOR' ? 'bg-coral-500 text-white hover:bg-coral-600' : 'text-foreground'}
          >
            Koreya
          </Button>
        </div>
      </div>

      {/* ZONE 1 — KPI Cards */}
      <KpiCards data={kpis} isLoading={kpisLoading} />

      {/* ZONE 2 — Action Queues */}
      <ActionQueues data={kpis} isLoading={kpisLoading} />

      {/* ZONE 3 — Trend Snapshots */}
      <TrendCharts data={trend} isLoading={trendLoading} />
    </div>
  );
}
