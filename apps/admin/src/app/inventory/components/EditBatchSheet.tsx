import * as React from 'react';
import { Drawer } from 'vaul';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateBatchSchema, type UpdateBatchInput, type InventoryBatchResponse } from '@nuraskin/shared-types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { inventoryApi } from '../api/inventory.api';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EditBatchSheetProps {
  batch: InventoryBatchResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditBatchSheet({ batch, open, onOpenChange, onSuccess }: EditBatchSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UpdateBatchInput>({
    resolver: zodResolver(updateBatchSchema as any) as any,
    defaultValues: {
      batch_ref: '',
      initial_qty: undefined as any,
      cost_price_krw: undefined as any,
      expiry_date: '',
      received_at: '',
    },
  });

  React.useEffect(() => {
    if (batch && open) {
      form.reset({
        batch_ref: batch.batchRef || '',
        initial_qty: batch.initialQty,
        cost_price_krw: parseInt(batch.costPrice),
        expiry_date: batch.expiryDate || '',
        received_at: new Date(batch.receivedAt).toISOString().split('T')[0],
      });
    }
  }, [batch, open, form]);

  const onSubmit = async (data: UpdateBatchInput) => {
    if (!batch) return;
    setIsSubmitting(true);
    try {
      await inventoryApi.updateBatch(batch.id, data);
      toast.success('Partiya ma\'lumotlari yangilandi');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInitialQtyDisabled = batch ? batch.currentQty !== batch.initialQty : false;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[85vh] fixed bottom-0 left-0 right-0 z-50">
          <div className="p-4 bg-background rounded-t-[10px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-8" />
            
            <div className="max-w-md mx-auto">
              <Drawer.Title className="text-xl font-semibold mb-2">
                Partiyani tahrirlash
              </Drawer.Title>
              <Drawer.Description className="text-muted-foreground mb-6">
                ID: {batch?.id.slice(0, 8)}...
              </Drawer.Description>

              {isInitialQtyDisabled && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Diqqat</AlertTitle>
                  <AlertDescription>
                    Sotilgan partiyaning dastlabki miqdorini o'zgartirib bo'lmaydi.
                  </AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="batch_ref"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partiya raqami (Zavod)</FormLabel>
                        <FormControl>
                          <Input placeholder="Zavod partiya raqami..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      name="initial_qty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Qty</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              {...field} 
                              disabled={isInitialQtyDisabled}
                              onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="cost_price_krw"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost (Unit KRW)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="received_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Received At</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onOpenChange(false)}
                    >
                      Bekor qilish
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
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
