import { z } from 'zod';

export const customerStatusSchema = z.enum(['ACTIVE', 'BLOCKED', 'ALL']);
export const regionFilterSchema = z.enum(['UZB', 'KOR', 'ALL']);
export const debtStatusFilterSchema = z.enum(['GOOD', 'WARNING', 'BLOCKED', 'ALL']);

export const customerFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(20),
  region: regionFilterSchema.default('ALL'),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  debtStatus: debtStatusFilterSchema.default('ALL'),
  search: z.string().optional(),
});

export type CustomerFilters = z.infer<typeof customerFiltersSchema>;

export const customerListItemSchema = z.object({
  id: z.string().uuid(),
  telegramId: z.string().nullable(),
  phone: z.string().nullable(),
  fullName: z.string(),
  regionCode: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  lastOrderAt: z.string().nullable(),
  orderCount: z.number(),
  totalSpent: z.string(),
  outstandingDebt: z.string(),
  debtLimit: z.string(),
});

export type CustomerListItem = z.infer<typeof customerListItemSchema>;

export const updateCustomerSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  regionCode: z.enum(['UZB', 'KOR']).optional(),
  debtLimitOverride: z.string().nullable().optional(), // BigInt as string
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
