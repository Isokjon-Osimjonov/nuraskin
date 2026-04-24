import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PlusIcon, Edit, Trash, Search } from 'lucide-react';
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
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { toast } from 'sonner';
import { productsApi, type ProductListItem } from './api/products.api';
import { ProductFormPage } from './ProductFormPage';
import type { CategoryResponse } from '@nuraskin/shared-types';

export function ProductsPage() {
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<
    ProductListItem | undefined
  >();
  const [productToDelete, setProductToDelete] = useState<
    ProductListItem | undefined
  >();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.getAll({ search: search || undefined }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      fetch(
        `${import.meta.env.VITE_API_URL}/categories`,
      ).then((r) => r.json() as Promise<CategoryResponse[]>),
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleClose();
      toast.success('Product created');
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof productsApi.update>[1];
    }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleClose();
      toast.success('Product updated');
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductToDelete(undefined);
      toast.success('Product deleted');
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to delete product'),
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

  const fmtPrice = (val: string | null) =>
    val ? (Number(BigInt(val)) / 100).toFixed(2) : '—';

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            {products.length} products in catalog
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

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, barcode, sku, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

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

      {isLoading ? (
        <DataTableSkeleton columnCount={8} rowCount={5} />
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search
            ? 'No products match your search.'
            : 'No products yet. Add your first one!'}
        </div>
      ) : (
        <div className="rounded-md border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-3 text-left font-medium">Image</th>
                <th className="px-3 py-3 text-left font-medium">
                  Name / Brand
                </th>
                <th className="px-3 py-3 text-left font-medium">Barcode</th>
                <th className="px-3 py-3 text-left font-medium">SKU</th>
                <th className="px-3 py-3 text-right font-medium">UZB Price</th>
                <th className="px-3 py-3 text-right font-medium">KOR Price</th>
                <th className="px-3 py-3 text-center font-medium">Stock</th>
                <th className="px-3 py-3 text-center font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-2">
                    {p.imageUrls[0] ? (
                      <img
                        src={p.imageUrls[0]}
                        alt={p.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.brandName}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{p.barcode}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                  <td className="px-3 py-2 text-right">
                    {p.uzbRetail ? `${fmtPrice(p.uzbRetail)} USD` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {p.korRetail ? `${fmtPrice(p.korRetail)} KRW` : '—'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {p.totalStock > 0 ? (
                      <span
                        className={
                          p.totalStock < 10 ? 'text-orange-600 font-medium' : ''
                        }
                      >
                        {p.totalStock}
                      </span>
                    ) : (
                      <span className="text-red-500">Out</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant={p.isActive ? 'success' : 'secondary'}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 border-none shadow-none"
                        onClick={() => handleEdit(p)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-md bg-red-50 text-red-500 hover:bg-red-100 border-none shadow-none"
                        onClick={() => setProductToDelete(p)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
