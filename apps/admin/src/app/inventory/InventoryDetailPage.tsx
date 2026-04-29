import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from './api/inventory.api';
import { productsApi } from '../products/api/products.api';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Plus,
  Package,
  Barcode,
  Hash,
  MoreVertical,
  Pencil,
  Scale,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AddBatchSheet } from './components/AddBatchSheet';
import { EditBatchSheet } from './components/EditBatchSheet';
import { AdjustQuantityDialog } from './components/AdjustQuantityDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { InventoryBatchResponse } from '@nuraskin/shared-types';

export function InventoryDetailPage() {
  const { productId } = useParams({ from: '/_app/inventory/$productId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isBatchSheetOpen, setIsBatchSheetOpen] = React.useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedBatch, setSelectedBatch] = React.useState<InventoryBatchResponse | null>(null);

  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ['products', productId],
    queryFn: () => productsApi.getById(productId),
  });

  const { data: batches, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['inventory', 'batches', productId],
    queryFn: () => inventoryApi.getBatches(productId),
  });

  const isLoading = isProductLoading || isBatchesLoading;

  const handleSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ['inventory', 'batches', productId],
    });
    queryClient.invalidateQueries({ queryKey: ['products', productId] });
  };

  const handleDelete = async () => {
    if (!selectedBatch) return;
    try {
      await inventoryApi.deleteBatch(selectedBatch.id);
      toast.success('Partiya o\'chirildi');
      handleSuccess();
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Xatolik yuz berdi');
    }
  };

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
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {batches?.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
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
                      {Number(BigInt(batch.costPrice)).toLocaleString()} {batch.costCurrency === 'KRW' ? '₩' : batch.costCurrency}
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
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedBatch(batch);
                            setIsEditSheetOpen(true);
                          }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Tahrirlash
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedBatch(batch);
                            setIsAdjustDialogOpen(true);
                          }}>
                            <Scale className="mr-2 h-4 w-4" />
                            Miqdorni to'g'irlash
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedBatch(batch);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            O'chirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        onSuccess={handleSuccess}
      />

      <EditBatchSheet
        batch={selectedBatch}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        onSuccess={handleSuccess}
      />

      <AdjustQuantityDialog
        batch={selectedBatch}
        open={isAdjustDialogOpen}
        onOpenChange={setIsAdjustDialogOpen}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Partiyani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham ushbu partiyani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
              Faqatgina sotilmagan (foydalanilmagan) partiyani o'chirish mumkin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
