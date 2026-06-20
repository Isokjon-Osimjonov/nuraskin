import * as React from 'react';
import { Drawer } from 'vaul';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateBatchSchema,
  correctInitialQtySchema,
  type UpdateBatchInput,
  type CorrectInitialQtyInput,
  type InventoryBatchResponse,
} from '@nuraskin/shared-types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import { inventoryApi } from '../api/inventory.api';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EditBatchSheetProps {
  batch: InventoryBatchResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditBatchSheet({ batch, open, onOpenChange, onSuccess }: EditBatchSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCorrecting, setIsCorrecting] = React.useState(false);

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

  const correctForm = useForm<CorrectInitialQtyInput>({
    resolver: zodResolver(correctInitialQtySchema as any) as any,
    defaultValues: {
      newInitialQty: undefined as any,
      reason: '',
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
      correctForm.reset({
        newInitialQty: undefined as any,
        reason: '',
      });
    }
  }, [batch, open, form, correctForm]);

  const onSubmit = async (data: UpdateBatchInput) => {
    if (!batch) return;
    setIsSubmitting(true);
    try {
      await inventoryApi.updateBatch(batch.id, data);
      toast.success("Partiya ma'lumotlari yangilandi");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCorrectSubmit = async (data: CorrectInitialQtyInput) => {
    if (!batch) return;
    setIsCorrecting(true);
    try {
      await inventoryApi.correctInitialQty(batch.id, data);
      toast.success("Boshlang'ich miqdor tuzatildi");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Xatolik yuz berdi');
    } finally {
      setIsCorrecting(false);
    }
  };

  const isInitialQtyDisabled = batch ? batch.currentQty !== batch.initialQty : false;
  const alreadyConsumed = batch ? batch.initialQty - batch.currentQty : 0;
  const newInitialQty = correctForm.watch('newInitialQty');
  const isCorrectSubmitDisabled = isCorrecting || !newInitialQty || newInitialQty < alreadyConsumed;

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

              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="edit">Asosiy</TabsTrigger>
                  <TabsTrigger value="correct">Tuzatish</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
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
                                <NumberInput
                                  min={1}
                                  value={field.value as number}
                                  disabled={isInitialQtyDisabled}
                                  onChange={field.onChange}
                                  allowDecimals={false}
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
                                <NumberInput
                                  value={field.value as number}
                                  onChange={field.onChange}
                                  allowDecimals={false}
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
                                <Input
                                  type="date"
                                  {...field}
                                  value={(field.value as string) || ''}
                                />
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
                                <Input
                                  type="date"
                                  {...field}
                                  value={(field.value as string) ?? ''}
                                />
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
                </TabsContent>
                <TabsContent value="correct">
                  <div className="mb-6 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hozirgi boshlang'ich:</span>
                      <span className="font-medium">{batch?.initialQty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sotilgan/ishlatilgan:</span>
                      <span className="font-medium">{alreadyConsumed}</span>
                    </div>
                  </div>

                  <Alert
                    variant="default"
                    className="mb-6 bg-yellow-50 text-yellow-900 border-yellow-200"
                  >
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-xs">
                      Bu funksiya FAQAT yozib olishdagi xatoni tuzatish uchun. Haqiqiy
                      sotuv/yo'qotish tarixi o'zgarmaydi — faqat partiyaning haqiqiy boshlang'ich
                      miqdori to'g'irlanadi.
                    </AlertDescription>
                  </Alert>

                  <Form {...correctForm}>
                    <form
                      onSubmit={correctForm.handleSubmit(onCorrectSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={correctForm.control}
                        name="newInitialQty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To'g'ri boshlang'ich miqdor</FormLabel>
                            <FormControl>
                              <NumberInput
                                min={1}
                                value={field.value as number}
                                onChange={field.onChange}
                                allowDecimals={false}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={correctForm.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sababi</FormLabel>
                            <FormControl>
                              <Input placeholder="Tuzatish sababi..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {newInitialQty !== undefined && newInitialQty >= alreadyConsumed && (
                        <div className="p-3 bg-muted rounded-md text-sm text-center font-medium">
                          Yangi qoldiq: {newInitialQty - alreadyConsumed} bo'ladi
                        </div>
                      )}

                      {newInitialQty !== undefined && newInitialQty < alreadyConsumed && (
                        <div className="text-sm text-destructive font-medium">
                          Boshlang'ich miqdorni {alreadyConsumed} tadan kam qilib bo'lmaydi
                        </div>
                      )}

                      <div className="pt-4 flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => onOpenChange(false)}
                        >
                          Bekor qilish
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isCorrectSubmitDisabled}>
                          {isCorrecting ? 'Saqlanmoqda...' : 'Saqlash'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
