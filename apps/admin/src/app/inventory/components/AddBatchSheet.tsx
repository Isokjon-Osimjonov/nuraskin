import * as React from 'react';
import { Drawer } from 'vaul';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addBatchSchema, type AddBatchInput } from '@nuraskin/shared-types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { inventoryApi, type ScannedProduct } from '../api/inventory.api';
import { toast } from 'sonner';

interface AddBatchSheetProps {
  product: ScannedProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddBatchSheet({ product, open, onOpenChange, onSuccess }: AddBatchSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AddBatchInput>({
    resolver: zodResolver(addBatchSchema as any) as any,
    defaultValues: {
      productId: product?.id || '',
      initialQty: undefined as any,
      costPrice: undefined as any,
      costCurrency: 'KRW',
      batchRef: '',
      expiryDate: '',
      notes: '',
    },
  });

  React.useEffect(() => {
    if (product) {
      form.reset({
        productId: product.id,
        initialQty: undefined as any,
        costPrice: undefined as any,
        costCurrency: 'KRW',
        batchRef: '',
        expiryDate: '',
        notes: '',
      });
    }
  }, [product, form]);

  const onSubmit = async (data: AddBatchInput) => {
    setIsSubmitting(true);
    try {
      await inventoryApi.addBatch(data);
      toast.success(`Partiya qo'shildi`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[85vh] fixed bottom-0 left-0 right-0 z-50">
          <div className="p-4 bg-background rounded-t-[10px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-8" />
            
            <div className="max-w-md mx-auto">
              <Drawer.Title className="text-xl font-semibold mb-2">
                Stock-In: {product?.name}
              </Drawer.Title>
              <Drawer.Description className="text-muted-foreground mb-6">
                {product?.brandName} • SKU: {product?.sku}
              </Drawer.Description>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      name="initialQty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost (Unit KRW)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Calculated Total Cost Display */}
                  {(() => {
                    const quantity = form.watch('initialQty') || 0;
                    const costPerUnit = form.watch('costPrice') || 0;
                    const totalCost = quantity * costPerUnit;

                    if (quantity > 0 && costPerUnit > 0) {
                      return (
                        <div className="bg-stone-50 border border-stone-100 rounded-lg p-3 text-sm flex items-center justify-between">
                          <span className="text-stone-500">Jami tan narx:</span>
                          <strong className="text-stone-900 font-mono text-base">
                            {totalCost.toLocaleString()} ₩
                          </strong>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="grid grid-cols-1">
                    <FormField
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    name="batchRef"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="Factory batch number..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Add Stock'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
