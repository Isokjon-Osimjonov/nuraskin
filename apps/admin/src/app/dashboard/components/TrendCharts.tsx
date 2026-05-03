import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { DashboardTrend } from '@nuraskin/shared-types';
import { formatKrw } from '@/lib/utils';

interface TrendChartsProps {
  data?: DashboardTrend;
  isLoading: boolean;
}

const formatValueAbbreviated = (val: string) => {
  const n = Number(val);
  if (n >= 1000000) return `₩ ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₩ ${(n / 1000).toFixed(0)}K`;
  return `₩ ${n}`;
};


const UZBEK_DAYS: Record<string, string> = {
  'Monday': 'Dush',
  'Tuesday': 'Sesh',
  'Wednesday': 'Chor',
  'Thursday': 'Pay',
  'Friday': 'Jum',
  'Saturday': 'Shan',
  'Sunday': 'Yak',
};

export function TrendCharts({ data, isLoading }: TrendChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[220px] w-full" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.days.map(d => {
    const date = new Date(d.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return {
      ...d,
      label: UZBEK_DAYS[dayName] || d.date,
      kor: Number(d.kor_revenue_krw),
      uzb: Number(d.uzb_revenue_krw),
    };
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      {/* Revenue Chart */}
      <Card className="lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between pb-8">
          <CardTitle className="text-base font-medium">Oxirgi 7 kunlik daromad</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-coral-500" />
              <span>Koreya</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-teal-500" />
              <span>O'zbekiston</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={formatValueAbbreviated}
                  tick={{ fontSize: 11, fill: '#888' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8f8f8' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const kor = payload[0].value as number;
                      const uzb = payload[1].value as number;
                      return (
                        <div className="rounded-lg border bg-white p-3 shadow-lg">
                          <p className="mb-2 text-xs font-bold text-gray-500">{payload[0].payload.date}</p>
                          <div className="space-y-1 text-sm">
                            <p className="flex justify-between gap-8">
                              <span className="text-coral-600">Koreya:</span>
                              <span className="font-bold">{formatKrw(kor.toString())}</span>
                            </p>
                            <p className="flex justify-between gap-8">
                              <span className="text-teal-600">O'zb:</span>
                              <span className="font-bold">{formatKrw(uzb.toString())}</span>
                            </p>
                            <div className="mt-2 border-t pt-1 font-bold flex justify-between">
                              <span>Jami:</span>
                              <span>{formatKrw((kor + uzb).toString())}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="kor" stackId="a" fill="#ff7f50" radius={[0, 0, 0, 0]} />
                <Bar dataKey="uzb" stackId="a" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top SKUs */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-medium">Bu hafta top mahsulotlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.top_skus.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                Ma'lumot yo'q
              </div>
            ) : (
              data.top_skus.map((sku, i) => (
                <div key={sku.product_id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-lg font-bold text-coral-500 w-4">{i + 1}.</span>
                    <div className="overflow-hidden">
                      <p className="truncate font-medium text-sm" title={sku.product_name}>{sku.product_name}</p>
                      <p className="text-xs text-muted-foreground">{sku.units_sold} dona</p>
                    </div>
                  </div>
                  <div className="text-sm font-bold whitespace-nowrap ml-4">
                    {formatKrw(sku.revenue_krw)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
