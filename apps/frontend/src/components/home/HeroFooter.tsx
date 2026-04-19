import { useQuery } from '@tanstack/react-query';

interface HealthResponse {
  status: string;
}

function fetchHealth(): Promise<HealthResponse> {
  return fetch('http://localhost:4000/api/health').then((r) => {
    if (!r.ok) throw new Error('health check failed');
    return r.json() as Promise<HealthResponse>;
  });
}

export function HeroFooter() {
  const { data, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 60_000,
    retry: false,
  });

  const isOk = !isError && data?.status === 'ok';

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
      <span
        className={`w-1 h-1 rounded-full ${isOk ? 'bg-green-400/30' : 'bg-red-500/30'}`}
      />
      <span className="text-white/10 text-xs">
        {isOk ? 'Barcha tizimlar ishlamoqda' : 'Xizmat tekshirilmoqda'}
      </span>
    </div>
  );
}
