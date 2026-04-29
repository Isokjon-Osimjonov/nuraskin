import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PlusIcon, Edit, Trash, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { toast } from 'sonner';
import { productsApi, type ProductListItem } from './api/products.api';
import { exchangeRatesApi } from '../exchange-rates/api/exchange-rates.api';
import { ProductFormPage } from './ProductFormPage';
import type { CategoryResponse } from '@nuraskin/shared-types';
import { format } from 'date-fns';
import { Route } from '../../routes/_app/products/index';
import { useNavigate } from '@tanstack/react-router';
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

export function ProductsPage() {
  const { page, limit } = Route.useSearch();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [editingProduct, setEditingProduct] = useState<
    ProductListItem | undefined
  >();
  const [productToDelete, setProductToDelete] = useState<
    ProductListItem | undefined
  >();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ['products', search, activeTab, page, limit],
    queryFn: () =>
      productsApi.getAll({
        search: search || undefined,
        deleted: activeTab === 'deleted',
        // Pass page and limit as requested
      } as any),
  });

  // Client-side pagination fallback if the API returns a full array
  const isPaginatedResponse =
    !Array.isArray(rawProducts) && (rawProducts as any).data;
  const productsList = Array.isArray(rawProducts)
    ? rawProducts
    : (rawProducts as any).data || [];
  const totalItems = isPaginatedResponse
    ? (rawProducts as any).total
    : productsList.length;

  const products = Array.isArray(rawProducts)
    ? productsList.slice((page - 1) * limit, page * limit)
    : productsList;
  const totalPages = Math.ceil(totalItems / limit);

  const { data: latestRate } = useQuery({
    queryKey: ['exchange-rates', 'latest'],
    queryFn: () => exchangeRatesApi.getLatest(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories`).then(
        (r) => r.json() as Promise<CategoryResponse[]>,
      ),
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleClose();
      toast.success('Mahsulot yaratildi');
    },
    onError: (error) => toast.error(error.message || 'Xatolik yuz berdi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof productsApi.update>[1];
    }) => productsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      handleClose();
      toast.success('Mahsulot yangilandi');
    },
    onError: (error) => toast.error(error.message || 'Xatolik yuz berdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setProductToDelete(undefined);
      toast.success("Mahsulot o'chirildi");
    },
    onError: (error) => toast.error(error.message || 'Xatolik yuz berdi'),
  });

  const restoreMutation = useMutation({
    mutationFn: productsApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Mahsulot tiklandi');
    },
    onError: (error: any) => toast.error(error.message || 'Xatolik yuz berdi'),
  });

  const handleEdit = (product: ProductListItem) => {
    setEditingProduct(product);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => setEditingProduct(undefined), 200);
  };

  const onSubmit = (
    data: Parameters<typeof createMutation.mutate>[0] extends infer T
      ? T
      : never,
  ) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data } as Parameters<
        typeof updateMutation.mutate
      >[0]);
    } else {
      createMutation.mutate(
        data as Parameters<typeof createMutation.mutate>[0],
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const formatUZS = (krw: string | null) => {
    if (!krw || !latestRate) return '—';
    const krwWhole = Number(BigInt(krw));
    const uzsWhole = krwWhole * latestRate.krwToUzs;
    const rounded = Math.round(uzsWhole / 1000) * 1000;
    return rounded.toLocaleString() + ' UZS';
  };

  const formatKRW = (krw: string | null) => {
    if (!krw) return '—';
    const krwWhole = Number(BigInt(krw));
    const rounded = Math.round(krwWhole / 100) * 100;
    return rounded.toLocaleString() + ' ₩';
  };

  const handlePageChange = (newPage: number) => {
    navigate({ search: { page: newPage, limit } as any });
  };

  const handlePageSizeChange = (newSize: number) => {
    navigate({ search: { page: 1, limit: newSize } as any });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            {totalItems} products in{' '}
            {activeTab === 'active' ? 'catalog' : 'trash'}
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => (v ? setOpen(true) : handleClose())}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(undefined)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </DialogTitle>
            </DialogHeader>
            <ProductFormPage
              initialData={editingProduct}
              categories={categories}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, barcode, sku, brand..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handlePageChange(1);
              }}
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <DataTableSkeleton columnCount={9} rowCount={5} />
          ) : (
            <div className="space-y-4">
              <DataTable>
                <DataTableHeader>
                  <DataTableRow>
                    <DataTableHead>Image</DataTableHead>
                    <DataTableHead>Name / Brand</DataTableHead>
                    <DataTableHead>Barcode</DataTableHead>
                    <DataTableHead>SKU</DataTableHead>
                    <DataTableHead className="text-right">
                      UZB Price (est)
                    </DataTableHead>
                    <DataTableHead className="text-right">
                      KOR Price
                    </DataTableHead>
                    <DataTableHead className="text-center">Stock</DataTableHead>
                    {activeTab === 'deleted' && (
                      <DataTableHead>O'chirilgan sana</DataTableHead>
                    )}
                    <DataTableHead className="text-center">
                      Status
                    </DataTableHead>
                    <DataTableHead className="text-right">
                      Actions
                    </DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {products.length === 0 ? (
                    <DataTableEmpty
                      colSpan={10}
                      message={
                        search
                          ? 'No products match your search.'
                          : activeTab === 'active'
                            ? 'No products yet. Add your first one!'
                            : 'Trash is empty.'
                      }
                    />
                  ) : (
                    products.map((p: any) => (
                      <DataTableRow
                        key={p.id}
                        className={
                          activeTab === 'deleted'
                            ? 'bg-muted/10 grayscale-[0.2]'
                            : ''
                        }
                      >
                        <DataTableCell>
                          {p.imageUrls && p.imageUrls[0] ? (
                            <img
                              src={p.imageUrls[0]}
                              alt={p.name}
                              className="h-10 w-10 rounded object-cover border"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              —
                            </div>
                          )}
                        </DataTableCell>
                        <DataTableCell>
                          <div className="font-medium text-stone-900">
                            {p.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {p.brandName}
                          </div>
                        </DataTableCell>
                        <DataTableCell className="font-mono text-xs">
                          {p.barcode}
                        </DataTableCell>
                        <DataTableCell className="font-mono text-xs">
                          {p.sku}
                        </DataTableCell>
                        <DataTableCell className="text-right whitespace-nowrap">
                          {formatUZS(p.uzbRetail)}
                        </DataTableCell>
                        <DataTableCell className="text-right whitespace-nowrap">
                          {formatKRW(p.korRetail)}
                        </DataTableCell>
                        <DataTableCell className="text-center">
                          {p.totalStock > 0 ? (
                            <span
                              className={
                                p.totalStock < 10
                                  ? 'text-orange-600 font-medium'
                                  : ''
                              }
                            >
                              {p.totalStock}
                            </span>
                          ) : (
                            <span className="text-red-500">Out</span>
                          )}
                        </DataTableCell>
                        {activeTab === 'deleted' && (
                          <DataTableCell className="text-xs text-muted-foreground">
                            {p.deletedAt
                              ? format(
                                  new Date(p.deletedAt),
                                  'dd.MM.yyyy HH:mm',
                                )
                              : '—'}
                          </DataTableCell>
                        )}
                        <DataTableCell className="text-center">
                          <Badge
                            variant={p.isActive ? 'success' : 'secondary'}
                            className="rounded-full"
                          >
                            {p.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </DataTableCell>
                        <DataTableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {activeTab === 'active' ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-stone-400 hover:text-stone-900"
                                  onClick={() => handleEdit(p)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-stone-400 hover:text-red-600"
                                  onClick={() => setProductToDelete(p)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-stone-400 hover:text-green-600"
                                onClick={() => restoreMutation.mutate(p.id)}
                                disabled={restoreMutation.isPending}
                              >
                                <RefreshCw
                                  className={`h-3 w-3 ${restoreMutation.isPending ? 'animate-spin' : ''}`}
                                />{' '}
                                Tiklash
                              </Button>
                            )}
                          </div>
                        </DataTableCell>
                      </DataTableRow>
                    ))
                  )}
                </DataTableBody>
              </DataTable>
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={limit}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </div>
      </Tabs>

      <ConfirmDeleteDialog
        open={!!productToDelete}
        onOpenChange={(v) => !v && setProductToDelete(undefined)}
        onConfirm={() =>
          productToDelete && deleteMutation.mutate(productToDelete.id)
        }
        isLoading={deleteMutation.isPending}
        title="Delete Product"
        description={`Delete "${productToDelete?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
