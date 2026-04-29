import { z } from 'zod';

const regionalConfigSchema = z.object({
  regionCode: z.enum(['UZB', 'KOR']),
  retailPrice: z.coerce.number().positive(),
  wholesalePrice: z.coerce.number().positive(),
  currency: z.enum(['USD', 'UZS', 'KRW']).optional(),
  minWholesaleQty: z.coerce.number().int().min(1).optional().default(5),
  minOrderQty: z.coerce.number().int().min(1).optional().default(1),
});

export const createProductSchema = z.object({
  barcode: z.string().min(8).max(50),
  sku: z.string().min(3).max(50),
  name: z.string().min(2).max(255),
  brandName: z.string().min(1).max(100),
  categoryId: z.string().uuid(),
  descriptionUz: z.string().optional(),
  howToUseUz: z.string().optional(),
  ingredients: z.array(z.string()).default([]),
  skinTypes: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  weightGrams: z.coerce.number().int().min(0),
  imageUrls: z.array(z.string().url()).max(8),
  regionalConfigs: z.array(regionalConfigSchema).length(2),
  showStockCount: z.boolean().default(false),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  sku: z.string().min(3).max(50).optional(),
  name: z.string().min(2).max(255).optional(),
  brandName: z.string().min(1).max(100).optional(),
  categoryId: z.string().uuid().optional(),
  descriptionUz: z.string().optional(),
  howToUseUz: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  skinTypes: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  weightGrams: z.coerce.number().int().min(0).optional(),
  imageUrls: z.array(z.string().url()).max(8).optional(),
  regionalConfigs: z.array(regionalConfigSchema).length(2).optional(),
  isActive: z.boolean().optional(),
  showStockCount: z.boolean().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const analyzeImageSchema = z.object({
  imageUrl: z.string().url(),
});

export type AnalyzeImageResponse = {
  name: string;
  brandName: string;
  descriptionUz: string;
  howToUseUz: string;
  ingredients: string[];
  skinTypes: string[];
  benefits: string[];
};
