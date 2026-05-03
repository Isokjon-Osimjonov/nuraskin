import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '../../stores/auth.store';
import { formatKrw } from '@/lib/utils';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  return response.json();
}

export const Route = createFileRoute('/_app/sales')({
  component: SalesPage,
});

type Period = '7d' | '30d' | '90d' | 'year';
type Region = 'all' | 'UZB' | 'KOR';

function SalesPage() {
  const [period, setPeriod] = React.useState<Period>('30d');
  const [region, setRegion] = React.useState<Region>('all');

  const { from, to, prevFrom, prevTo } = React.useMemo(() => {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    
    let days = 30;
    if (period === '7d') days = 7;
    if (period === '90d') days = 90;
    if (period === 'year') days = 365;

    const fromDate = new Date();
    fromDate.setDate(today.getDate() - days);
    const from = fromDate.toISOString().split('T')[0];

    const prevToDate = new Date(fromDate);
    prevToDate.setDate(prevToDate.getDate() - 1);
    const prevTo = prevToDate.toISOString().split('T')[0];

    const prevFromDate = new Date(prevToDate);
    prevFromDate.setDate(prevFromDate.getDate() - days);
    const prevFrom = prevFromDate.toISOString().split('T')[0];

    return { from, to, prevFrom, prevTo };
  }, [period]);

  const endpoint = period === '7d' ? '/api/admin/sales/live' : '/api/admin/sales/summary';

  const { data: current, isLoading } = useQuery({
    queryKey: ['sales', endpoint, from, to, region],
    queryFn: async () => {
      let url = `${endpoint}?from=${from}&to=${to}`;
      if (region !== 'all') url += `&region=${region}`;
      return await fetchWithAuth(url);
    },
  });

  const { data: previous } = useQuery({
    queryKey: ['sales', endpoint, prevFrom, prevTo, region],
    queryFn: async () => {
      let url = `${endpoint}?from=${prevFrom}&to=${prevTo}`;
      if (region !== 'all') url += `&region=${region}`;
      return await fetchWithAuth(url);
    },
  });

  const getDelta = (currStr: string, prevStr: string, isPercent = false) => {
    const curr = Number(currStr || 0);
    const prev = Number(prevStr || 0);
    if (prev === 0) return { text: '-', color: 'text-gray-500' };
    
    let diff = 0;
    if (isPercent) {
       diff = parseFloat(currStr) - parseFloat(prevStr); // e.g. 40.5 - 38.0 = 2.5
    } else {
       diff = ((curr - prev) / prev) * 100;
    }
    
    if (Math.abs(diff) < 0.1) return { text: '-', color: 'text-gray-500' };
    if (diff > 0) return { text: `↑ ${diff.toFixed(1)}${isPercent ? 'pp' : '%'}`, color: 'text-green-600' };
    return { text: `↓ ${Math.abs(diff).toFixed(1)}${isPercent ? 'pp' : '%'}`, color: 'text-red-600' };
  };

  const currentSummary = current?.summary || { revenueKrw: '0', cogsKrw: '0', cargoKrw: '0', orderCount: 0, grossMargin: '0.0%' };
  const prevSummary = previous?.summary || { revenueKrw: '0', cogsKrw: '0', cargoKrw: '0', orderCount: 0, grossMargin: '0.0%' };

  const revDelta = getDelta(currentSummary.revenueKrw, prevSummary.revenueKrw);
  const ordDelta = getDelta(currentSummary.orderCount.toString(), prevSummary.orderCount.toString());
  
  const currAov = currentSummary.orderCount > 0 ? Number(currentSummary.revenueKrw) / currentSummary.orderCount : 0;
  const prevAov = prevSummary.orderCount > 0 ? Number(prevSummary.revenueKrw) / prevSummary.orderCount : 0;
  const aovDelta = getDelta(currAov.toString(), prevAov.toString());
  const marginDelta = getDelta(currentSummary.grossMargin, prevSummary.grossMargin, true);

  const COLORS = { KOR: '#FF6B4A', UZB: '#0D9488' };
  
  const regionDataRev = [
    { name: 'Koreya', value: current?.byDate?.reduce((acc: number, d: any) => acc + Number(d.KOR), 0) || 0, fill: COLORS.KOR },
    { name: 'O`zbekiston', value: current?.byDate?.reduce((acc: number, d: any) => acc + Number(d.UZB), 0) || 0, fill: COLORS.UZB }
  ].filter(d => d.value > 0);

  const mergedChartData = current?.byDate?.map((d: any, idx: number) => {
    return {
      ...d,
      KOR: Number(d.KOR),
      UZB: Number(d.UZB),
      prevTotal: previous?.byDate?.[idx] ? Number(previous.byDate[idx].total) : 0
    };
  }) || [];

  return (
    <div className="p-6 space-y-6 bg-muted/20 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 p-4 rounded-xl shadow-sm border">
        <div className="flex flex-wrap gap-2">
          <Button variant={period === '7d' ? 'default' : 'outline'} size="sm" className="rounded-full" onClick={() => setPeriod('7d')}>7 kun</Button>
          <Button variant={period === '30d' ? 'default' : 'outline'} size="sm" className="rounded-full" onClick={() => setPeriod('30d')}>30 kun</Button>
          <Button variant={period === '90d' ? 'default' : 'outline'} size="sm" className="rounded-full" onClick={() => setPeriod('90d')}>90 kun</Button>
          <Button variant={period === 'year' ? 'default' : 'outline'} size="sm" className="rounded-full" onClick={() => setPeriod('year')}>Bu yil</Button>
        </div>
        <div className="flex gap-2">
          <Button variant={region === 'all' ? 'default' : 'outline'} size="sm" className="rounded-full" onClick={() => setRegion('all')}>Hammasi</Button>
          <Button variant={region === 'UZB' ? 'default' : 'outline'} size="sm" className="rounded-full" onClick={() => setRegion('UZB')}>O'zbekiston</Button>
          <Button variant={region === 'KOR' ? 'default' : 'outline'} size="sm" className="rounded-full" onClick={() => setRegion('KOR')}>Koreya</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Yuklanmoqda...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Daromad</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatKrw(currentSummary.revenueKrw)}</div>
                <div className={`text-xs mt-1 font-medium ${revDelta.color}`}>{revDelta.text} vs prev period</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Buyurtmalar</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentSummary.orderCount}</div>
                <div className={`text-xs mt-1 font-medium ${ordDelta.color}`}>{ordDelta.text} vs prev period</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">O'rtacha buyurtma</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatKrw(currAov.toFixed(0))}</div>
                <div className={`text-xs mt-1 font-medium ${aovDelta.color}`}>{aovDelta.text} vs prev period</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Yalpi marja</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentSummary.grossMargin}</div>
                <div className={`text-xs mt-1 font-medium ${marginDelta.color}`}>{marginDelta.text} vs prev period</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Sotuvlar dinamikasi (Daromad)</CardTitle>
              <div className="flex gap-4 text-sm font-medium">
                <span style={{ color: COLORS.KOR }}>● Koreya</span>
                <span style={{ color: COLORS.UZB }}>● O'zbekiston</span>
                <span className="text-muted-foreground border-b border-dashed border-muted-foreground">O'tgan davr</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mergedChartData} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                    <XAxis dataKey="date" fontSize={12} tickMargin={10} minTickGap={30} stroke="#888888" />
                    <YAxis 
                      tickFormatter={(val) => `₩${(val/1000000).toFixed(0)}M`} 
                      fontSize={12} 
                      stroke="#888888"
                    />
                    <Tooltip 
                      formatter={(val: number) => formatKrw(val)}
                      labelStyle={{ color: '#000' }}
                    />
                    <Line type="monotone" dataKey="KOR" stroke={COLORS.KOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="UZB" stroke={COLORS.UZB} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="prevTotal" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Mahsulotlar samaradorligi</CardTitle>
                  <CardDescription>Joriy davr uchun marja bo'yicha</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mahsulot</TableHead>
                          <TableHead className="text-right">Sotildi</TableHead>
                          <TableHead className="text-right">Daromad</TableHead>
                          <TableHead className="text-right">Marja</TableHead>
                          <TableHead className="text-right">Mintaqa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {current?.byProduct?.slice(0, 20).map((p: any) => {
                          const marginNum = parseFloat(p.grossMargin);
                          let borderClass = '';
                          if (marginNum < 20) borderClass = 'border-l-4 border-l-red-500';
                          else if (marginNum < 40) borderClass = 'border-l-4 border-l-yellow-500';
                          
                          return (
                            <TableRow key={p.productId} className={borderClass}>
                              <TableCell className="font-medium truncate max-w-[200px]">{p.productName}</TableCell>
                              <TableCell className="text-right">{p.unitsSold}</TableCell>
                              <TableCell className="text-right">{formatKrw(p.revenueKrw)}</TableCell>
                              <TableCell className="text-right font-semibold">{p.grossMargin}</TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">{p.regionCode}</TableCell>
                            </TableRow>
                          );
                        })}
                        {(!current?.byProduct || current.byProduct.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Hech qanday ma'lumot topilmadi</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-1 flex flex-col gap-6">
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <CardTitle>Hududiy taqsimot</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-[200px]">
                  {regionDataRev.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={regionDataRev}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {regionDataRev.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => formatKrw(val)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                     <div className="text-muted-foreground">Ma'lumot yo'q</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
