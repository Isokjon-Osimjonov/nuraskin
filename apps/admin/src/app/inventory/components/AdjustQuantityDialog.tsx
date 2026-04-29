import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adjustQuantitySchema, type AdjustQuantityInput, type InventoryBatchResponse } from '@nuraskin/shared-types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { inventoryApi } from '../api/inventory.api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface AdjustQuantityDialogProps {
  batch: InventoryBatchResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AdjustQuantityDialog({ batch, open, onOpenChange, onSuccess }: AdjustQuantityDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AdjustQuantityInput>({
    resolver: zodResolver(adjustQuantitySchema as any) as any,
    defaultValues: {
      adjustment: undefined as any,
      reason: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        adjustment: undefined as any,
        reason: '',
      });
    }
  }, [open, form]);

  const onSubmit = async (data: AdjustQuantityInput) => {
    if (!batch) return;
    setIsSubmitting(true);
    try {
      await inventoryApi.adjustQuantity(batch.id, data);
      toast.success('Miqdor muvaffaqiyatli o\'zgartirildi');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustment = form.watch('adjustment') || 0;
  const newQty = batch ? batch.currentQty + (adjustment || 0) : 0;
  const isInvalid = batch ? newQty < 0 || newQty > batch.initialQty : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Miqdorni o'zgartirish</DialogTitle>
          <DialogDescription>
            Partiyadagi mahsulot miqdorini qo'shish yoki ayirish.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase">Hozirgi</div>
              <div className="text-xl font-bold">{batch?.currentQty}</div>
            </div>
            <div className="text-2xl text-muted-foreground">→</div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase">Yangi</div>
              <div className={`text-xl font-bold ${isInvalid ? 'text-destructive' : 'text-primary'}`}>
                {newQty}
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                name="adjustment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O'zgarish miqdori (Adjustment)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="+10 yoki -5" 
                        {...field} 
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sababi (Reason)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Nima uchun o'zgartirilyapti..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Bekor qilish
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting || isInvalid}>
                  {isSubmitting ? 'Saqlanmoqda...' : 'Tasdiqlash'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
