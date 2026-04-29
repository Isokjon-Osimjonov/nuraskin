import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponsApi } from './api/coupons.api';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Trash2, Users, ShoppingBag, Percent, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function CouponDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: coupon, isLoading } = useQuery({
    queryKey: ['coupons', id],
    queryFn: () => couponsApi.getById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => couponsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success("Kupon o'chirildi");
      navigate({ to: '/coupons' } as any);
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return <div className="p-6">Yuklanmoqda...</div>;
  if (!coupon) return <div className="p-6 text-center">Kupon topilmadi</div>;

  const totalDiscount = coupon.redemptions.reduce((acc, r) => acc + BigInt(r.discountAmount), 0n);
  const uniqueCustomers = new Set(coupon.redemptions.map(r => r.customerId)).size;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/coupons' } as any)}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                {coupon.code}
                <Badge variant="outline" className="text-xs uppercase">{coupon.status}</Badge>
            </h1>
            <p className="text-muted-foreground">{coupon.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: `/coupons/${id}/edit` } as any)}>
            <Edit className="mr-2 h-4 w-4" />
            Tahrirlash
          </Button>
          <Button variant="destructive" onClick={() => { if(confirm("O'chirishni tasdiqlaysizmi?")) deleteMutation.mutate(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami foydalanildi</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupon.usageCount} ta</div>
            {coupon.maxUsesTotal && <p className="text-xs text-muted-foreground">Limit: {coupon.maxUsesTotal}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Noyob mijozlar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCustomers} ta</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Berilgan jami chegirma</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(Number(totalDiscount) / 100).toLocaleString()} so'm</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Foydalanish tarixi (Redemptions)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mijoz</TableHead>
                    <TableHead>Buyurtma#</TableHead>
                    <TableHead className="text-right">Chegirma</TableHead>
                    <TableHead className="text-right">Sana</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupon.redemptions.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.customerName}</TableCell>
                      <TableCell>
                        <Button variant="link" className="p-0" onClick={() => navigate({ to: `/orders/${r.orderId}` } as any)}>
                            {r.orderNumber}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        -{(Number(BigInt(r.discountAmount)) / 100).toLocaleString()} so'm
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {format(new Date(r.createdAt), 'dd.MM.yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {coupon.redemptions.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground italic">Hali foydalanilmagan</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Sozlamalar</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Turi:</span>
                        <span className="font-medium">{coupon.type}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Qiymati:</span>
                        <span className="font-medium">
                            {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `${(Number(BigInt(coupon.value)) / 100).toLocaleString()} so'm`}
                        </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Mintaqa:</span>
                        <Badge variant="secondary">{coupon.regionCode || 'Barchasi'}</Badge>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Min. summa:</span>
                        <span className="font-medium">{(Number(BigInt(coupon.minOrderAmount)) / 100).toLocaleString()} so'm</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Kishi boshiga limit:</span>
                        <span className="font-medium">{coupon.maxUsesPerCustomer} marta</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-sm">Tavsif</CardTitle></CardHeader>
                <CardContent className="text-sm italic text-muted-foreground">
                    {coupon.description || 'Tavsif mavjud emas'}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
