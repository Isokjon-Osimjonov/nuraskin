import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, Calendar, FileText, Pencil } from 'lucide-react';
import { accountingApi } from '../api/accounting.api';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { uz } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface ExpenseListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  category: string;
  categoryLabel: string;
  isOrderLinked?: boolean;
  onEdit?: (expense: any) => void;
}

export function ExpenseListDialog({
  open,
  onOpenChange,
  month,
  category,
  categoryLabel,
  isOrderLinked,
  onEdit,
}: ExpenseListDialogProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = React.useState<any>(null);

  const { data: expenses, isLoading, isError } = useQuery({
    queryKey: ['expenses', month, category, isOrderLinked],
    queryFn: async () => {
      return await accountingApi.listExpenses(month, category);
    },
    enabled: open,
  });

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    
    setDeletingId(expenseToDelete.id);
    try {
      if (isOrderLinked && expenseToDelete.orderId) {
        await accountingApi.deleteOrderExpense(expenseToDelete.orderId, expenseToDelete.id);
      } else {
        await accountingApi.deleteExpense(expenseToDelete.id);
      }
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', month, category] });
      toast.success('Xarajat o\'chirildi');
      setExpenseToDelete(null);
    } catch (err: any) {
      toast.error('Xatolik yuz berdi: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const formatKrw = (val: number | string) => {
    return Number(val || 0).toLocaleString() + ' ₩';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Xarajatlar ro'yxati — {categoryLabel}</DialogTitle>
            <DialogDescription>
              Tanlangan oy: {format(parseISO(month + '-01'), 'MMMM yyyy', { locale: uz })}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="text-center text-destructive py-8">
                Xarajatlarni yuklashda xatolik yuz berdi.
              </div>
            ) : !expenses || expenses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 italic">
                Bu kategoriyada xarajat yo'q
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(parseISO(expense.expenseDate), 'd-MMM', { locale: uz })}</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium truncate">
                        <FileText className="h-3 w-3 text-blue-500" />
                        <span>{expense.description}</span>
                      </div>
                      <div className="font-mono text-sm font-bold text-primary">
                        {formatKrw(expense.amountKrw)}
                      </div>
                      {expense.orderNumber && (
                        <div className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded w-fit font-medium">
                          Buyurtma: {expense.orderNumber}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      {!isOrderLinked && onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => onEdit(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setExpenseToDelete(expense)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xarajatni o'chirishni tasdiqlaysizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Ushbu amalni ortga qaytarib bo'lmaydi. "{expenseToDelete?.description}" xarajati butunlay o'chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deletingId}
            >
              {deletingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
