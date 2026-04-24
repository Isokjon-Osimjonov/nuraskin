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
import {
  Search,
  Scan,
  AlertTriangle,
  Eye,
  Edit,
  Trash,
  Plus,
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
import { toast } from 'sonner';

export function InventoryOverviewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');

  const [selectedProductForBatch, setSelectedProductForBatch] =
    React.useState<ScannedProduct | null>(null);
  const [isBatchSheetOpen, setIsBatchSheetOpen] = React.useState(false);

  const [productToDelete, setProductToDelete] =
    React.useState<InventoryOverviewItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory', 'overview'],
    queryFn: inventoryApi.getOverview,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'overview'] });
      toast.success("Mahsulot o'chirildi");
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xatolik yuz berdi');
    },
  });

  const filteredItems = items?.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brandName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode.includes(search),
  );

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

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[80px]">
                  Image
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Product
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  SKU / Barcode
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-center">
                  Stock
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-center">
                  Batches
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Earliest Expiry
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-4">
                        <Skeleton className="h-12 w-12 rounded" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-[150px]" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-[100px]" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-[60px]" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-[40px]" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-[100px]" />
                      </td>
                      <td className="p-4 text-right">
                        <Skeleton className="h-8 w-[100px] ml-auto" />
                      </td>
                    </tr>
                  ))
                : filteredItems?.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4">
                        <img
                          src={item.imageUrls[0] || '/placeholder.png'}
                          alt={item.name}
                          className="h-12 w-12 rounded object-cover border"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.brandName}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-mono">{item.sku}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {item.barcode}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-bold">{item.totalStock}</span>
                          {item.totalStock < LOW_STOCK_THRESHOLD && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        {item.totalStock < LOW_STOCK_THRESHOLD && (
                          <span className="text-[10px] text-destructive font-medium uppercase">
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary">{item.batchCount}</Badge>
                      </td>
                      <td className="p-4">
                        {item.earliestExpiry ? (
                          <span
                            className={
                              new Date(item.earliestExpiry) < new Date()
                                ? 'text-destructive font-bold'
                                : ''
                            }
                          >
                            {new Date(item.earliestExpiry).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleAddBatch(item)}
                          >
                            <Plus className="h-3 w-3" />
                            Partiya
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() =>
                              navigate({
                                to: '/inventory/$productId',
                                params: { productId: item.id },
                              })
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-600"
                            onClick={() =>
                              navigate({
                                to: '/products/$productId',
                                params: { productId: item.id },
                              })
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              setProductToDelete(item);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && filteredItems?.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              No products found in inventory.
            </div>
          )}
        </div>
      </div>

      <AddBatchSheet
        product={selectedProductForBatch}
        open={isBatchSheetOpen}
        onOpenChange={setIsBatchSheetOpen}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ['inventory', 'overview'] })
        }
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mahsulotni o'chirishni tasdiqlaysizmi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              "{productToDelete?.name}" mahsuloti o'chiriladi. Bu amalni
              qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
