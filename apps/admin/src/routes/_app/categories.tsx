import { queryKeys } from '@nuraskin/shared-utils';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CategoriesTable } from '../../app/categories/components/categories-table';
import { CategoryForm } from '../../app/categories/components/category-form';
import { categoriesApi } from '../../app/categories/api/categories.api';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import type { CategoryResponse } from '@nuraskin/shared-types';
import { TablePagination } from '@/components/ui/TablePagination';
import { z } from 'zod';

const categorySearchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
});

export const Route = createFileRoute('/_app/categories')({
  validateSearch: search => categorySearchSchema.parse(search),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { page, limit } = Route.useSearch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | undefined>();
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryResponse | undefined>();
  const queryClient = useQueryClient();

  const { data: categoriesResult, isLoading } = useQuery({
    queryKey: ['categories', page, limit],
    queryFn: () => categoriesApi.getAll({ page, limit }),
  });

  const categories = categoriesResult?.data || [];
  const totalItems = categoriesResult?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  const handlePageChange = (newPage: number) => {
    navigate({ search: { page: newPage, limit } as any });
  };

  const handlePageSizeChange = (newSize: number) => {
    navigate({ search: { page: 1, limit: newSize } as any });
  };

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
      handleClose();
      toast.success('Kategoriya yaratildi');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: categoriesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
      handleClose();
      toast.success('Kategoriya yangilandi');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
      toast.success("Kategoriya o'chirildi");
      setCategoryToDelete(undefined);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(msg);
    },
  });

  const handleEdit = (category: CategoryResponse) => {
    setEditingCategory(category);
    setOpen(true);
  };

  const handleDelete = (category: CategoryResponse) => {
    setCategoryToDelete(category);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Add small delay to avoid flicker while dialog closes
    setTimeout(() => setEditingCategory(undefined), 200);
  };

  const onSubmit = (data: any) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Kategoriyalar</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Mahsulot kategoriyalarini boshqaring
          </p>
        </div>
        <Dialog open={open} onOpenChange={v => !v && handleClose()}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
              <PlusIcon className="mr-2 h-4 w-4" />
              Kategoriya qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Kategoriyani tahrirlash' : "Kategoriya qo'shish"}
              </DialogTitle>
            </DialogHeader>
            <CategoryForm
              initialData={editingCategory}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      <ConfirmDeleteDialog
        open={!!categoryToDelete}
        onOpenChange={open => !open && setCategoryToDelete(undefined)}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
        title="Kategoriyani o'chirish"
        description={`Haqiqatan ham "${categoryToDelete?.name}" kategoriyasini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`}
      />

      {isLoading ? (
        <DataTableSkeleton columnCount={5} rowCount={5} />
      ) : (
        <div className="space-y-4">
          <CategoriesTable data={categories} onEdit={handleEdit} onDelete={handleDelete} />
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={limit}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
