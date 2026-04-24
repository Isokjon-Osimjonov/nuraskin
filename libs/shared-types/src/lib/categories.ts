import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(255),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')).nullable(),
  isActive: z.boolean().default(true),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const categoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  imageUrl: z.string().nullable(),
  isActive: z.boolean(),
  productCount: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
