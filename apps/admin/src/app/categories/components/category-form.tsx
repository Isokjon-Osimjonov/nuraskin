import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, type CreateCategoryInput, type CategoryResponse } from '@nuraskin/shared-types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGenerateSlug } from '../hooks/use-generate-slug';
import { DualSourceImage } from './dual-source-image';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';

interface CategoryFormProps {
  initialData?: CategoryResponse;
  onSubmit: (data: CreateCategoryInput) => void;
  isSubmitting?: boolean;
}

export function CategoryForm({ initialData, onSubmit, isSubmitting }: CategoryFormProps) {
  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema as any) as any,
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      imageUrl: initialData?.imageUrl || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  const name = form.watch('name');
  const generatedSlug = useGenerateSlug(name);

  React.useEffect(() => {
    if (!initialData && generatedSlug && !form.formState.dirtyFields.slug) {
      form.setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [generatedSlug, form, initialData]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomi</FormLabel>
              <FormControl><Input placeholder="Masalan: Terini parvarish" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL uchun)</FormLabel>
              <FormControl><Input placeholder="masalan: terini-parvarish" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rasm</FormLabel>
              <FormControl><DualSourceImage value={field.value || ''} onChange={field.onChange} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Faol holati</FormLabel>
                <div className="text-xs text-muted-foreground">
                  Kategoriyani ko'rsatish yoki yashirish
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
          {initialData ? 'Yangilash' : 'Saqlash'}
        </Button>
      </form>
    </Form>
  );
}
