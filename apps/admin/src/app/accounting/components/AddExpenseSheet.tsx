import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createExpenseSchema, updateExpenseSchema, type CreateExpenseInput, type UpdateExpenseInput } from '@nuraskin/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingApi } from '../api/accounting.api';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UploadCloudIcon, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
  expense?: any; // If provided, we are in EDIT mode
}

export function AddExpenseSheet({ open, onOpenChange, defaultCategory, expense }: AddExpenseSheetProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isEdit = !!expense;

  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(isEdit ? updateExpenseSchema : createExpenseSchema as any),
    defaultValues: {
      category: (defaultCategory as any) || 'OTHER',
      amountKrw: 0,
      description: '',
      expenseDate: new Date().toISOString().split('T')[0],
      receiptUrl: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      if (expense) {
        form.reset({
          category: expense.category,
          amountKrw: expense.amountKrw,
          description: expense.description,
          expenseDate: expense.expenseDate,
          receiptUrl: expense.receiptUrl || '',
        });
      } else {
        form.reset({
          category: (defaultCategory as any) || 'OTHER',
          amountKrw: 0,
          description: '',
          expenseDate: new Date().toISOString().split('T')[0],
          receiptUrl: '',
        });
      }
    }
  }, [open, expense, defaultCategory, form]);

  const mutation = useMutation({
    mutationFn: (data: CreateExpenseInput) => {
      if (isEdit) {
        // Only send changed fields
        const changedFields: any = {};
        Object.keys(data).forEach((key) => {
          if ((data as any)[key] !== (expense as any)[key]) {
            changedFields[key] = (data as any)[key];
          }
        });
        return accountingApi.updateExpense(expense.id, changedFields);
      }
      return accountingApi.createExpense(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(isEdit ? 'Xarajat yangilandi' : 'Xarajat muvaffaqiyatli qo\'shildi');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error('Xatolik yuz berdi: ' + error.message);
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url: uploadUrl, timestamp, signature, apiKey } = await accountingApi.getUploadUrl();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);

      const res = await fetch(uploadUrl, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      form.setValue('receiptUrl', data.secure_url || data.url);
    } catch (err: any) {
      toast.error('Rasmni yuklashda xatolik: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const amount = form.watch('amountKrw');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Xarajatni tahrirlash' : 'Xarajat qo\'shish'}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategoriya</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategoriyani tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PACKAGING">Qadoqlash</SelectItem>
                      <SelectItem value="PLATFORM_FEE">Platforma to'lovi</SelectItem>
                      <SelectItem value="SUPPLIES">Materiallar</SelectItem>
                      <SelectItem value="WAGES">Ish haqi</SelectItem>
                      <SelectItem value="OTHER">Boshqa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amountKrw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summa (KRW)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription className="text-blue-600 font-medium">
                    = ₩ {Number(amount || 0).toLocaleString()}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tavsif</FormLabel>
                  <FormControl>
                    <Input placeholder="Xarajat tavsifi..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sana</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chek (Rasm)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {field.value ? (
                        <div className="space-y-2">
                          <div className="relative w-32 h-32 group">
                            <img
                              src={field.value}
                              alt="Receipt"
                              className="w-full h-full object-cover rounded-md border shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                              <Button 
                                type="button" 
                                variant="secondary" 
                                size="sm" 
                                className="h-8 text-xs"
                                onClick={() => field.onChange('')}
                              >
                                O'zgartirish
                              </Button>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground italic">
                            Rasm yuklangan. O'zgartirish uchun bosing.
                          </p>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'flex flex-col items-center justify-center border-2 border-dashed rounded-md p-8 cursor-pointer hover:bg-muted/50 transition-colors',
                            uploading && 'opacity-50 pointer-events-none'
                          )}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            <UploadCloudIcon className="h-8 w-8 text-muted-foreground" />
                          )}
                          <p className="text-sm text-muted-foreground mt-2 font-medium">
                            {uploading ? 'Yuklanmoqda...' : 'Rasm yuklash'}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            PNG, JPG, JPEG (Max. 5MB)
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleUpload}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={mutation.isPending || uploading}>
                {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
