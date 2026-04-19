import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_app/')({
  component: Dashboard,
});

interface MeResponse {
  id: string;
  email: string;
  name: string;
}

interface HealthResponse {
  status: string;
  message: string;
}

function Dashboard() {
  const token = useAuthStore((s) => s.token);

  const { data: meData, isError: isMeError } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        useAuthStore.getState().logout();
        throw new Error('Unauthorized');
      }
      return res.json() as Promise<MeResponse>;
    },
    retry: false,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/health');
      if (!res.ok) throw new Error('API error');
      return res.json() as Promise<HealthResponse>;
    },
    refetchInterval: 30_000,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-4 w-24 rounded" />
            ) : isError ? (
              <Badge
                variant="outline"
                className="bg-red-100 text-red-700 border-red-200"
              >
                Unavailable
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-700 border-green-200"
              >
                {data?.status ?? 'Operational'}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
