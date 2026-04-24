import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from './api/inventory.api';
import { productsApi } from '../products/api/products.api';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Package,
  Barcode,
  Hash,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AddBatchSheet } from './components/AddBatchSheet';
import { toast } from 'sonner';

export function InventoryDetailPage() {
  const { productId } = useParams({ from: '/_app/inventory/$productId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isBatchSheetOpen, setIsBatchSheetOpen] = React.useState(false);

  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ['products', productId],
    queryFn: () => productsApi.getById(productId),
  });

  const { data: batches, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['inventory', 'batches', productId],
    queryFn: () => inventoryApi.getBatches(productId),
  });

  const isLoading = isProductLoading || isBatchesLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-50" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center">
        <p>Mahsulot topilmadi.</p>
        <Button variant="link" onClick={() => navigate({ to: '/inventory' })}>
          Omborga qaytish
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 ">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/inventory' })}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Orqaga
        </Button>
        <Button onClick={() => setIsBatchSheetOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Partiya qo'shish
        </Button>
      </div>

      {/* Product Header */}
      <div className="bg-card rounded-lg border p-6 flex gap-6">
        <img
          src={product.imageUrls[0] || '/placeholder.png'}
          alt={product.name}
          className="h-32 w-32 rounded-lg object-cover border"
        />
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">{product.brandName}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Barcode className="h-4 w-4" />
              <span className="font-mono">{product.barcode}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span className="font-mono">{product.sku}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-bold">
                Jami qoldiq: {product.totalStock}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Partiyalar ro'yxati</h2>
        <div className="rounded-md border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Batch Ref</th>
                <th className="px-4 py-3 text-center font-medium">
                  Initial Qty
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  Current Qty
                </th>
                <th className="px-4 py-3 text-right font-medium">Cost Price</th>
                <th className="px-4 py-3 text-center font-medium">Currency</th>
                <th className="px-4 py-3 text-left font-medium">Expiry Date</th>
                <th className="px-4 py-3 text-left font-medium">Received At</th>
              </tr>
            </thead>
            <tbody>
              {batches?.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Hozircha partiyalar yo'q.
                  </td>
                </tr>
              ) : (
                batches?.map((batch) => (
                  <tr
                    key={batch.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono">
                      {batch.batchRef || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {batch.initialQty}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {batch.currentQty}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(Number(BigInt(batch.costPrice)) / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline">{batch.costCurrency}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {batch.expiryDate ? (
                        <span
                          className={
                            new Date(batch.expiryDate) < new Date()
                              ? 'text-destructive font-bold'
                              : ''
                          }
                        >
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(batch.receivedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddBatchSheet
        product={product as any}
        open={isBatchSheetOpen}
        onOpenChange={setIsBatchSheetOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ['inventory', 'batches', productId],
          });
          queryClient.invalidateQueries({ queryKey: ['products', productId] });
        }}
      />
    </div>
  );
}
