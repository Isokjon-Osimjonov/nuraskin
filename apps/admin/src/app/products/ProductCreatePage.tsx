import { queryKeys } from '@nuraskin/shared-utils';
import { api } from '@/lib/api';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ProductFormPage } from './ProductFormPage';
import { productsApi } from './api/products.api';
import { toast } from 'sonner';
import type { CategoryResponse } from '@nuraskin/shared-types';

interface ProductCreatePageProps {
  prefilledBarcode?: string;
}

export function ProductCreatePage({ prefilledBarcode }: ProductCreatePageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => api.get<CategoryResponse[]>('/categories'),
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      toast.success('Mahsulot yaratildi');
      navigate({ to: '/inventory/scan' });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(msg);
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <ProductFormPage
          prefilledBarcode={prefilledBarcode}
          categories={categories}
          onSubmit={data => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}
