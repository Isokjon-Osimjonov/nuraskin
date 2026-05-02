import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from './api/customers.api';
import { useNavigate } from '@tanstack/react-router';
import { Route } from '../../routes/_app/customers/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, User, Eye, UserMinus, UserCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { UZ, translateServerError } from '@/lib/uz';
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
import { Skeleton } from '@/components/ui/skeleton';

export function CustomersListPage() {
  const { page, limit } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState('');
  const [region, setRegion] = React.useState('ALL');
  const [status, setStatus] = React.useState('all');
  const [debtStatus, setDebtStatus] = React.useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { page, limit, search, region, status, debtStatus }],
    queryFn: () => customersApi.getAll({ 
        page, 
        limit, 
        search: search || undefined, 
        region: region as any, 
        status: status as any, 
        debtStatus: debtStatus as any 
    }),
  });

  const customers = data?.data || [];
  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => 
        customersApi.update(id, { isActive }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        toast.success(UZ.common.success);
    },
    onError: (err: any) => toast.error(translateServerError(err.message)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        toast.success(UZ.common.success);
    },
    onError: (err: any) => toast.error(translateServerError(err.message)),
  });

  const getDebtBadge = (outstanding: string, debtLimit: string) => {
    const debt = BigInt(outstanding);
    const lim = BigInt(debtLimit);
    if (lim === 0n) return <Badge variant="outline" className="rounded-full">{UZ.accounting.noDebt}</Badge>;
    
    const usage = Number(debt * 100n / lim);
    if (usage >= 100) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none rounded-full">Bloklangan</Badge>;
    if (usage >= 80) return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none rounded-full">Ogohlantirish</Badge>;
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none rounded-full">Yaxshi</Badge>;
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
        <h1 className="text-3xl font-bold tracking-tight">{UZ.customers.title}</h1>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{UZ.common.filter}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={UZ.common.placeholderSearch}
                className="pl-8"
                value={search}
                onChange={(e) => { setSearch(e.target.value); handlePageChange(1); }}
              />
            </div>
            <Select value={region} onValueChange={(v) => { setRegion(v); handlePageChange(1); }}>
              <SelectTrigger><SelectValue placeholder={UZ.common.region} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{UZ.common.all}</SelectItem>
                <SelectItem value="UZB">O'zbekiston</SelectItem>
                <SelectItem value="KOR">Koreya</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v); handlePageChange(1); }}>
              <SelectTrigger><SelectValue placeholder={UZ.common.status} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{UZ.common.all}</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="inactive">Bloklangan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={debtStatus} onValueChange={(v) => { setDebtStatus(v); handlePageChange(1); }}>
              <SelectTrigger><SelectValue placeholder={UZ.accounting.outstandingDebt} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{UZ.common.all}</SelectItem>
                <SelectItem value="GOOD">Yaxshi</SelectItem>
                <SelectItem value="WARNING">Ogohlantirish</SelectItem>
                <SelectItem value="BLOCKED">Bloklangan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <DataTable>
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead className="w-[50px]"></DataTableHead>
              <DataTableHead>{UZ.customers.customerName}</DataTableHead>
              <DataTableHead>{UZ.common.region}</DataTableHead>
              <DataTableHead>{UZ.customers.phone}</DataTableHead>
              <DataTableHead className="text-right">{UZ.customers.totalOrders}</DataTableHead>
              <DataTableHead className="text-right">{UZ.customers.totalSpent}</DataTableHead>
              <DataTableHead className="text-right">{UZ.accounting.outstandingDebt}</DataTableHead>
              <DataTableHead>Qarz holati</DataTableHead>
              <DataTableHead>{UZ.common.status}</DataTableHead>
              <DataTableHead className="text-right">{UZ.common.actions}</DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <DataTableRow key={i}>
                  <DataTableCell><Skeleton className="h-10 w-10 rounded-full" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[150px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[60px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[100px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[40px] ml-auto" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[100px] ml-auto" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[100px] ml-auto" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-6 w-[80px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-6 w-[60px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-8 w-20 ml-auto" /></DataTableCell>
                </DataTableRow>
              ))
            ) : customers.length === 0 ? (
                <DataTableEmpty colSpan={10} message={UZ.customers.errors.notFound} />
            ) : (
              customers.map((customer) => (
                <DataTableRow key={customer.id}>
                  <DataTableCell>
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold">
                      {customer.fullName[0]}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="font-medium">{customer.fullName}</DataTableCell>
                  <DataTableCell>
                    <Badge variant="outline" className="rounded-full text-xs font-normal bg-stone-50">{customer.regionCode}</Badge>
                  </DataTableCell>
                  <DataTableCell className="font-mono text-sm">{customer.phone || '—'}</DataTableCell>
                  <DataTableCell className="text-right font-medium">{(customer as any).orderCount}</DataTableCell>
                  <DataTableCell className="text-right whitespace-nowrap">
                    {Number(BigInt((customer as any).totalSpent)).toLocaleString()} {(customer as any).currency || "UZS"}
                  </DataTableCell>
                  <DataTableCell className="text-right font-medium whitespace-nowrap text-stone-900">
                    {Number(BigInt((customer as any).outstandingDebt)).toLocaleString()} {(customer as any).currency || "UZS"}
                  </DataTableCell>
                  <DataTableCell>
                    {getDebtBadge((customer as any).outstandingDebt, (customer as any).debtLimit)}
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={customer.isActive ? 'success' : 'secondary'} className="rounded-full">
                      {customer.isActive ? 'Faol' : 'Bloklangan'}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-900" onClick={() => navigate({ to: '/customers/$id', params: { id: customer.id } as any })}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className={customer.isActive ? "text-stone-400 hover:text-orange-600" : "text-stone-400 hover:text-green-600"}
                        onClick={() => toggleStatusMutation.mutate({ id: customer.id, isActive: !customer.isActive })}
                      >
                        {customer.isActive ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
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
