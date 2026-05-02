import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  inventoryApi,
  type InventoryOverviewItem,
  type ScannedProduct,
} from './api/inventory.api';
import { productsApi } from '../products/api/products.api';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { Route } from '../../routes/_app/inventory/index';
import {
  Search,
  Scan,
  AlertTriangle,
  Eye,
  Edit,
  Trash,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AddBatchSheet } from './components/AddBatchSheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableEmpty,
} from '@/components/ui/DataTable';
import { TablePagination } from '@/components/ui/TablePagination';

export function InventoryOverviewPage() {
  const { page, limit } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'active' | 'deleted'>(
    'active',
  );

  const [selectedProductForBatch, setSelectedProductForBatch] =
    React.useState<ScannedProduct | null>(null);
  const [isBatchSheetOpen, setIsBatchSheetOpen] = React.useState(false);

  const [productToDelete, setProductToDelete] =
    React.useState<InventoryOverviewItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ['inventory', 'overview', activeTab],
    queryFn: () =>
      inventoryApi.getOverview({ deleted: activeTab === 'deleted' }),
  });

  const isPaginatedResponse =
    !Array.isArray(rawItems) && (rawItems as any).data;
  const items = Array.isArray(rawItems)
    ? rawItems
    : (rawItems as any).data || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Mahsulot o'chirildi");
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xatolik yuz berdi');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: productsApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Mahsulot tiklandi');
    },
    onError: (error: any) => toast.error(error.message || 'Xatolik yuz berdi'),
  });

  const filteredItems = items.filter(
    (item: any) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brandName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode.includes(search),
  );

  const totalItems = isPaginatedResponse
    ? (rawItems as any).total
    : filteredItems.length;
  const paginatedItems = Array.isArray(rawItems)
    ? filteredItems.slice((page - 1) * limit, page * limit)
    : filteredItems;
  const totalPages = Math.ceil(totalItems / limit);

  const handlePageChange = (newPage: number) => {
    navigate({ search: { page: newPage, limit } as any });
  };

  const handlePageSizeChange = (newSize: number) => {
    navigate({ search: { page: 1, limit: newSize } as any });
  };

  const LOW_STOCK_THRESHOLD = 10;

  const handleAddBatch = (item: InventoryOverviewItem) => {
    setSelectedProductForBatch(item as unknown as ScannedProduct);
    setIsBatchSheetOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Omborxona</h1>
          <p className="text-muted-foreground">
            Mahsulotlar qoldig'i va partiyalar boshqaruvi.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/inventory/scan' })}
          >
            <Scan className="mr-2 h-4 w-4" />
            Scanner
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as any);
          handlePageChange(1);
        }}
        className="w-full"
      >
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="active">Faol mahsulotlar</TabsTrigger>
            <TabsTrigger value="deleted">
              O'chirilganlar mahsulotlar
            </TabsTrigger>
          </TabsList>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Mahsulotlarni qidirish..."
              className="pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handlePageChange(1);
              }}
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHead>Mahsulot</DataTableHead>
                <DataTableHead>Barcode / SKU</DataTableHead>
                <DataTableHead className="text-center">
                  Active Partiyalar
                </DataTableHead>
                <DataTableHead className="text-center">
                  Jami qoldiq
                </DataTableHead>
                <DataTableHead className="text-center">Status</DataTableHead>
                <DataTableHead className="text-right">Harakatlar</DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <DataTableRow key={i}>
                    <DataTableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-3 w-[100px]" />
                        </div>
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-3 w-[80px]" />
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <Skeleton className="h-6 w-6 mx-auto rounded-full" />
                    </DataTableCell>
                    <DataTableCell>
                      <Skeleton className="h-6 w-10 mx-auto rounded-full" />
                    </DataTableCell>
                    <DataTableCell>
                      <Skeleton className="h-6 w-[80px] mx-auto rounded-full" />
                    </DataTableCell>
                    <DataTableCell>
                      <Skeleton className="h-8 w-16 ml-auto rounded" />
                    </DataTableCell>
                  </DataTableRow>
                ))
              ) : paginatedItems.length === 0 ? (
                <DataTableEmpty colSpan={6} message="Mahsulot topilmadi." />
              ) : (
                paginatedItems.map((item: any) => (
                  <DataTableRow key={item.id} className={activeTab === 'deleted' ? 'bg-muted/10 grayscale-[0.2]' : ''}>
                  <DataTableCell>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      {item.imageUrls && item.imageUrls.length > 0 ? (
                        <img
                          src={item.imageUrls[0]}
                          alt={item.name}
                          className="h-10 w-10 rounded object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted" />
                      )}
                      <div>
                        <div className="font-medium text-stone-900">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.brandName}
                          </div>
                        </div>
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <div className="font-mono text-sm text-stone-900">
                        {item.barcode}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {item.sku}
                      </div>
                    </DataTableCell>
                    <DataTableCell className="text-center font-medium text-stone-900">
                      {item.activeBatchCount}
                    </DataTableCell>
                    <DataTableCell className="text-center">
                      <span
                        className={`inline-flex items-center justify-center font-medium ${
                          item.totalStock <= LOW_STOCK_THRESHOLD
                            ? 'text-orange-600'
                            : item.totalStock === 0
                              ? 'text-red-500'
                              : 'text-stone-900'
                        }`}
                      >
                        {item.totalStock <= LOW_STOCK_THRESHOLD &&
                          item.totalStock > 0 && (
                            <AlertTriangle className="mr-1 h-3 w-3" />
                          )}
                        {item.totalStock}
                      </span>
                    </DataTableCell>
                    <DataTableCell className="text-center">
                      {item.totalStock > 0 ? (
                        <Badge variant="success" className="rounded-full">
                          In Stock
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="rounded-full">
                          Out of Stock
                        </Badge>
                      )}
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      {activeTab === 'active' ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddBatch(item)}
                            className="text-stone-400 hover:text-stone-900"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate({ to: `/inventory/${item.id}` as any })
                            }
                            className="text-stone-400 hover:text-stone-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProductToDelete(item);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-stone-400 hover:text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => restoreMutation.mutate(item.id)}
                          disabled={restoreMutation.isPending}
                          className="text-stone-400 hover:text-green-600"
                        >
                          <RefreshCw
                            className={`mr-2 h-3 w-3 ${restoreMutation.isPending ? 'animate-spin' : ''}`}
                          />{' '}
                          Tiklash
                        </Button>
                      )}
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
      </Tabs>

      {selectedProductForBatch && (
        <AddBatchSheet
          product={selectedProductForBatch}
          open={isBatchSheetOpen}
          onOpenChange={(v) => !v && setIsBatchSheetOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ['inventory', 'overview'],
            });
            setIsBatchSheetOpen(false);
          }}
        />
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mahsulotni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham "{productToDelete?.name}" mahsulotini
              o'chirmoqchimisiz? Bu amal mahsulotni korzinaga o'tkazadi va uning
              qoldiqlari ombordan hisobdan chiqarilmaydi, lekin ro'yxatda
              ko'rinmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "O'chirilmoqda..." : "O'chirish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
