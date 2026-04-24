import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { SectionCards } from '@/components/section-cards';
import { RecentSales } from '@/components/recent-sales';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';

export const Route = createFileRoute('/_app/')({
  component: Dashboard,
});

interface HealthResponse {
  status: string;
  message: string;
}

function Dashboard() {
  const token = useAuthStore((s) => s.token);

  const {
    data: healthData,
    isLoading: isHealthLoading,
    isError: isHealthError,
  } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/health`);
      if (!res.ok) throw new Error('API error');
      return res.json() as Promise<HealthResponse>;
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <SectionCards />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartAreaInteractive />
        </div>
        <RecentSales />
      </div>
      <div className="mt-auto">
        <p className="text-xs text-muted-foreground">
          API Status:{' '}
          {isHealthLoading
            ? 'Checking...'
            : isHealthError
              ? 'Unavailable'
              : healthData?.status}
        </p>
      </div>
    </div>
  );
}
