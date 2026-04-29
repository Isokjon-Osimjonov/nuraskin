import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from './api/customers.api';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Save, ShoppingBag, Clock, Bell, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function CustomerDetailPage() {
  const { id } = useParams({ from: '/_app/customers/$id' as any });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.getById(id),
  });

  const [limitOverride, setLimitOverride] = React.useState<string>('');

  React.useEffect(() => {
    if (customer) {
      setLimitOverride(customer.debtLimitOverride || '');
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => customersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
      toast.success("Ma'lumotlar saqlandi");
    },
  });

  if (isLoading) return <div className="p-6">Yuklanmoqda...</div>;
  if (!customer) return <div className="p-6 text-center">Mijoz topilmadi</div>;

  const debtValue = BigInt(customer.stats.outstandingDebt);
  const limitValue = customer.debtLimitOverride ? BigInt(customer.debtLimitOverride) : 100000000n; // fallback to dummy or actual default if we had it
  const debtUsagePercent = limitValue > 0n ? Number(debtValue * 100n / limitValue) : 0;

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-red-500';
    if (percent >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/customers' } as any)}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Mijoz tafsilotlari</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Header & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                {customer.fullName[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle>{customer.fullName}</CardTitle>
                  <Badge variant="outline">{customer.regionCode}</Badge>
                  {customer.isActive ? (
                    <Badge className="bg-green-500 hover:bg-green-500 border-none">Faol</Badge>
                  ) : (
                    <Badge variant="secondary">Bloklangan</Badge>
                  )}
                </div>
                <CardDescription className="flex gap-4 mt-1">
                  <span>ID: {customer.telegramId || '—'}</span>
                  <span>Tel: {customer.phone || '—'}</span>
                  <span>A'zo bo'ldi: {format(new Date(customer.createdAt), 'dd.MM.yyyy')}</span>
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground uppercase font-bold">Buyurtmalar</p>
                <p className="text-2xl font-bold">{customer.stats.orderCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground uppercase font-bold">Jami xarid</p>
                <p className="text-2xl font-bold">
                    {customer.regionCode === 'UZB' 
                        ? (Number(BigInt(customer.stats.totalSpent)) / 100).toLocaleString() 
                        : Number(BigInt(customer.stats.totalSpent)).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground uppercase font-bold">Qarzdorlik</p>
                <p className="text-2xl font-bold text-red-600">
                    {customer.regionCode === 'UZB' 
                        ? (Number(BigInt(customer.stats.outstandingDebt)) / 100).toLocaleString() 
                        : Number(BigInt(customer.stats.outstandingDebt)).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground uppercase font-bold">Kutish listi</p>
                <p className="text-2xl font-bold">{customer.stats.waitlistCount}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Buyurtmalar tarixi</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order#</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.orderNumber}</TableCell>
                      <TableCell>{format(new Date(o.createdAt), 'dd.MM.yyyy HH:mm')}</TableCell>
                      <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {Number(BigInt(o.totalAmount) / (o.currency === 'UZS' ? 100n : 1n)).toLocaleString()} {o.currency}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => navigate({ to: `/orders/${o.id}` } as any)}>Ko'rish</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {customer.orders.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Buyurtmalar mavjud emas</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Debt & Settings */}
        <div className="space-y-6">
          <Card className="border-red-100 bg-red-50/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Qarz Nazorati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Limitdan foydalanish:</span>
                  <span className="font-bold">{debtUsagePercent}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${getProgressColor(debtUsagePercent)}`} 
                    style={{ width: `${Math.min(100, debtUsagePercent)}%` }} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Individual Limit (BigInt string)</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Masalan: 50000000" 
                    value={limitOverride}
                    onChange={e => setLimitOverride(e.target.value)}
                  />
                  <Button size="icon" onClick={() => updateMutation.mutate({ debtLimitOverride: limitOverride || null })}>
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Null = Tizim standart limiti qo'llaniladi
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" /> Zaxiralar</CardTitle></CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableBody>
                   {customer.reservations.map((r: any) => (
                     <TableRow key={r.id}>
                        <TableCell className="py-3">
                          <p className="text-sm font-medium">{r.productName}</p>
                          <p className="text-[10px] text-muted-foreground">Muddati: {format(new Date(r.expiresAt), 'dd.MM HH:mm')}</p>
                        </TableCell>
                        <TableCell className="text-right font-bold">{r.quantity} ta</TableCell>
                     </TableRow>
                   ))}
                   {customer.reservations.length === 0 && (
                     <TableRow><TableCell className="text-center py-6 text-muted-foreground text-sm italic">Faol zaxiralar yo'q</TableCell></TableRow>
                   )}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5" /> Kutish listi</CardTitle></CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableBody>
                   {customer.waitlist.map((w: any) => (
                     <TableRow key={w.id}>
                        <TableCell className="py-3">
                          <p className="text-sm font-medium">{w.productName}</p>
                          <p className="text-[10px] text-muted-foreground">Qo'shildi: {format(new Date(w.createdAt), 'dd.MM.yyyy')}</p>
                        </TableCell>
                     </TableRow>
                   ))}
                   {customer.waitlist.length === 0 && (
                     <TableRow><TableCell className="text-center py-6 text-muted-foreground text-sm italic">Kutish listi bo'sh</TableCell></TableRow>
                   )}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Mijoz uchun izohlar</CardTitle></CardHeader>
            <CardContent>
              <textarea 
                className="w-full min-h-[100px] p-2 text-sm rounded border bg-muted/30 focus:bg-white transition-colors"
                defaultValue={customer.notes || ''}
                onBlur={(e) => updateMutation.mutate({ notes: e.target.value })}
                placeholder="Mijoz haqida maxsus qaydlar..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
