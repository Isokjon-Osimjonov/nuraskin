import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatUzs, formatKrw } from '@/lib/currency';
import { couponsApi } from './api/coupons.api';
import { useNavigate } from '@tanstack/react-router';
import { Route } from '../../routes/_app/coupons/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Eye, Pause, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableEmpty
} from '@/components/ui/DataTable';
import { TablePagination } from '@/components/ui/TablePagination';

export function CouponsListPage() {
  const { page, limit } = Route.useSearch();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['coupons', { page, limit, search, status }],
    queryFn: () => couponsApi.getAll({ 
        page, 
        limit, 
        search: search || undefined, 
        status: status as any 
    }),
  });

  const coupons = data?.data || [];
  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success("Kupon o'chirildi");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => couponsApi.update(id, { status: status as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success("Kupon holati yangilandi");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success" className="rounded-full">Active</Badge>;
      case 'PAUSED': return <Badge className="bg-yellow-500 hover:bg-yellow-500 border-none rounded-full">Paused</Badge>;
      case 'EXPIRED': return <Badge variant="destructive" className="rounded-full">Expired</Badge>;
      case 'DRAFT': return <Badge variant="secondary" className="rounded-full">Draft</Badge>;
      case 'ARCHIVED': return <Badge variant="outline" className="rounded-full">Archived</Badge>;
      default: return <Badge variant="outline" className="rounded-full">{status}</Badge>;
    }
  };

  const handlePageChange = (newPage: number) => {
    navigate({ search: { page: newPage, limit } as any });
  };

  const handlePageSizeChange = (newSize: number) => {
    navigate({ search: { page: 1, limit: newSize } as any });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kuponlar</h1>
          <p className="text-muted-foreground">Promo-kodlar va chegirmalar boshqaruvi</p>
        </div>
        <Button onClick={() => navigate({ to: '/coupons/new' } as any)}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi kupon
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kod yoki nom bo'yicha qidirish..."
                className="pl-8"
                value={search}
                onChange={(e) => { setSearch(e.target.value); handlePageChange(1); }}
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); handlePageChange(1); }}>
              <SelectTrigger><SelectValue placeholder="Holat" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Barcha holatlar</SelectItem>
                <SelectItem value="ACTIVE">Faol</SelectItem>
                <SelectItem value="PAUSED">To'xtatilgan</SelectItem>
                <SelectItem value="DRAFT">Qoralama</SelectItem>
                <SelectItem value="EXPIRED">Muddati o'tgan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <DataTable>
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead>Kod</DataTableHead>
              <DataTableHead>Nomi</DataTableHead>
              <DataTableHead>Turi</DataTableHead>
              <DataTableHead className="text-right">Qiymati</DataTableHead>
              <DataTableHead className="text-center">Ishlatildi</DataTableHead>
              <DataTableHead className="text-center">Holat</DataTableHead>
              <DataTableHead className="text-center">Mintaqa</DataTableHead>
              <DataTableHead className="text-center">Muddati</DataTableHead>
              <DataTableHead className="text-right">Amallar</DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <DataTableRow key={i}>
                  <DataTableCell><Skeleton className="h-4 w-[100px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[150px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[60px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[80px] ml-auto" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[60px] mx-auto" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-6 w-[80px] mx-auto rounded-full" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[100px] mx-auto" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-8 w-16 ml-auto rounded" /></DataTableCell>
                </DataTableRow>
              ))
            ) : (!coupons || coupons.length === 0) ? (
              <DataTableEmpty colSpan={8} message="Kuponlar topilmadi" />
            ) : (
              coupons.map((coupon) => (
                <DataTableRow key={coupon.id}>
                  <DataTableCell className="font-mono font-bold text-stone-900">{coupon.code}</DataTableCell>
                  <DataTableCell>
                    <div className="font-medium text-stone-900">{coupon.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{coupon.description || '—'}</div>
                  </DataTableCell>
                  <DataTableCell className="text-xs uppercase font-medium tracking-wide text-stone-500">{coupon.type}</DataTableCell>
                  <DataTableCell className="text-right font-medium text-stone-900">
                    {coupon.type === 'PERCENTAGE'
                      ? `${coupon.value}%`
                      : coupon.regionCode === 'UZB' ? formatUzs(coupon.value) : formatKrw(coupon.value)}
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <span className="font-medium text-stone-900">{coupon.usageCount}</span>
                    {coupon.maxUsesTotal && <span className="text-stone-400"> / {coupon.maxUsesTotal}</span>}
                  </DataTableCell>
                  <DataTableCell className="text-center">{getStatusBadge(coupon.status)}</DataTableCell>
                  <DataTableCell className="text-center text-xs font-medium text-stone-600">
                    {coupon.regionCode === 'ALL' ? 'Barchasi' : coupon.regionCode === 'UZB' ? "O'zbekiston" : 'Koreya'}
                  </DataTableCell>
                  <DataTableCell className="text-center text-sm font-medium text-stone-700">
                    {coupon.expiresAt ? format(new Date(coupon.expiresAt), 'dd.MM.yyyy') : 'Limitsiz'}
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-900" onClick={() => navigate({ to: `/coupons/${coupon.id}` } as any)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {coupon.status === 'ACTIVE' ? (
                        <Button variant="ghost" size="icon" className="text-stone-400 hover:text-yellow-600" onClick={() => statusMutation.mutate({ id: coupon.id, status: 'PAUSED' })}>
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (coupon.status === 'PAUSED' || coupon.status === 'DRAFT') ? (
                        <Button variant="ghost" size="icon" className="text-stone-400 hover:text-green-600" onClick={() => statusMutation.mutate({ id: coupon.id, status: 'ACTIVE' })}>
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-stone-400 hover:text-red-600"
                        onClick={() => {
                            if(confirm("Haqiqatan ham o'chirasizmi?")) {
                                deleteMutation.mutate(coupon.id);
                            }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>

        {!isLoading && (
          <TablePagination 
            currentPage={page} 
            totalPages={totalPages} 
            pageSize={limit} 
            onPageChange={handlePageChange} 
            onPageSizeChange={handlePageSizeChange} 
          />
        )}
      </div>
    </div>
  );
}
