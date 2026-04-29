import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ProductFormPage } from './ProductFormPage';
import { productsApi } from './api/products.api';
import { toast } from 'sonner';
import type { CategoryResponse } from '@nuraskin/shared-types';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductEditPageProps {
  productId: string;
}

export function ProductEditPage({ productId }: ProductEditPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ['products', productId],
    queryFn: () => productsApi.getById(productId),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories`).then(
        (r) => r.json() as Promise<CategoryResponse[]>
      ),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => productsApi.update(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', productId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Mahsulot yangilandi');
      navigate({ to: '/inventory' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xatolik yuz berdi');
    },
  });

  if (isProductLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center">
        <p>Product not found.</p>
        <button onClick={() => navigate({ to: '/inventory' })} className="text-primary underline">
          Back to Inventory
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
      </div>
      
      <div className="bg-card rounded-lg border p-6">
        <ProductFormPage
          initialData={product as any}
          categories={categories}
          onSubmit={(data) => updateMutation.mutate(data)}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </div>
  );
}
