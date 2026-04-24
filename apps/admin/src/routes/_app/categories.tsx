import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CategoriesTable } from '../../app/categories/components/categories-table';
import { CategoryForm } from '../../app/categories/components/category-form';
import { categoriesApi } from '../../app/categories/api/categories.api';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import type { CategoryResponse } from '@nuraskin/shared-types';

export const Route = createFileRoute('/_app/categories')({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | undefined>();
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryResponse | undefined>();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleClose();
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: categoriesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleClose();
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
      setCategoryToDelete(undefined);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete category');
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
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage your product categories</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => (val ? setOpen(true) : handleClose())}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCategory(undefined)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
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
        onOpenChange={(open) => !open && setCategoryToDelete(undefined)}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Category"
        description={`Are you sure you want to delete the category "${categoryToDelete?.name}"? This action cannot be undone.`}
      />
      
      {isLoading ? (
        <DataTableSkeleton columnCount={5} rowCount={5} />
      ) : (
        <CategoriesTable 
          data={categories} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
