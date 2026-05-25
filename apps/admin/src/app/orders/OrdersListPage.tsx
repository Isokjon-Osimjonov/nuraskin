import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from './api/orders.api';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  ReceiptText, 
  Calendar as CalendarIcon,
  ChevronRight,
  CreditCard 
} from 'lucide-react';
import { OrderStatusBadge } from './components/OrderStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Route } from '../../routes/_app/orders/index';
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
import { formatPrice } from '@/lib/utils';

export function OrdersListPage() {
  const { page, limit } = Route.useSearch();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(),
  });

  const isPaginatedResponse = !Array.isArray(orders) && (orders as any).data;
  const ordersList = Array.isArray(orders) ? orders : (orders as any).data || [];
  
  const filteredOrders = ordersList.filter((o: any) => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = isPaginatedResponse ? (orders as any).total : filteredOrders.length;
  
  const paginatedOrders = Array.isArray(orders) 
    ? filteredOrders.slice((page - 1) * limit, page * limit) 
    : filteredOrders;
  const totalPages = Math.ceil(totalItems / limit);

  const handlePageChange = (newPage: number) => {
    navigate({ search: { page: newPage, limit } as any });
  };

  const handlePageSizeChange = (newSize: number) => {
    navigate({ search: { page: 1, limit: newSize } as any });
  };

  return (
    <div className="flex flex-col gap-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-stone-900">Buyurtmalar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Mijozlar buyurtmalari va to'lovlar holati.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none h-10 px-4" onClick={() => navigate({ to: '/orders/manual' as any })}>
            <CreditCard className="mr-2 h-4 w-4" />
            Manual
          </Button>
          <Button className="flex-1 sm:flex-none h-10 px-4" onClick={() => navigate({ to: '/orders/new' as any })}>
            <Plus className="mr-2 h-4 w-4" />
            Yangi
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Order# yoki mijoz nomi..."
            className="pl-8"
            value={search}
            onChange={(e) => { setSearch(e.target.value); handlePageChange(1); }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <DataTable>
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead>Order#</DataTableHead>
              <DataTableHead>Mijoz</DataTableHead>
              <DataTableHead>Holat</DataTableHead>
              <DataTableHead className="text-center">Mahsulot</DataTableHead>
              <DataTableHead className="text-right">Jami</DataTableHead>
              <DataTableHead className="text-center">Kvitansiya</DataTableHead>
              <DataTableHead>Sana</DataTableHead>
              <DataTableHead></DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <DataTableRow key={i}>
                  <DataTableCell><Skeleton className="h-4 w-[100px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[150px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-6 w-[100px] rounded-full" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[30px] mx-auto" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[80px] ml-auto" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-8 w-8 rounded mx-auto" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[100px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-8 w-8 rounded ml-auto" /></DataTableCell>
                </DataTableRow>
              ))
            ) : paginatedOrders.length === 0 ? (
              <DataTableEmpty colSpan={8} message="Buyurtmalar topilmadi." />
            ) : paginatedOrders.map((order: any) => (
              <DataTableRow 
                key={order.id} 
                className="cursor-pointer group"
                onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: order.id } })}
              >
                <DataTableCell className="font-mono text-stone-900 font-medium">
                  <div className="flex items-center gap-2">
                    {order.orderNumber}
                    {order.orderSource === 'MANUAL' && (
                      <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter border border-indigo-200">MANUAL</span>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <div className="font-medium text-stone-900">{order.customerName}</div>
                  <div className="text-xs text-muted-foreground uppercase">{order.regionCode}</div>
                </DataTableCell>
                <DataTableCell>
                  <OrderStatusBadge status={order.status} />
                </DataTableCell>
                <DataTableCell className="text-center">
                  <span className="font-medium">{order.itemCount ?? order.items?.length ?? 0}</span>
                </DataTableCell>
                <DataTableCell className="text-right font-medium text-stone-900">
                  {formatPrice(order.totalAmount, order.currency === 'UZS' ? 'UZB' : 'KOR')}
                </DataTableCell>
                <DataTableCell className="text-center">
                  {order.paymentReceiptUrl ? (
                    <div className="flex justify-center">
                      <img 
                        src={order.paymentReceiptUrl} 
                        className="h-8 w-8 rounded object-cover border border-stone-200 cursor-zoom-in hover:opacity-80 transition" 
                        alt="Receipt"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(order.paymentReceiptUrl, '_blank');
                        }}
                      />
                    </div>
                  ) : (
                    <ReceiptText className="h-4 w-4 text-stone-300 mx-auto" />
                  )}
                </DataTableCell>
                <DataTableCell className="text-stone-500 text-xs">
                  {format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}
                </DataTableCell>
                <DataTableCell className="text-right">
                  <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
                </DataTableCell>
              </DataTableRow>
            ))}
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
