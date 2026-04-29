import { z } from 'zod';

export const expenseCategorySchema = z.enum([
  'PACKAGING',
  'PLATFORM_FEE',
  'SUPPLIES',
  'WAGES',
  'OTHER',
]);

export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

export const createExpenseSchema = z.object({
  category: expenseCategorySchema,
  amountKrw: z.number().int().positive(),
  description: z.string().min(1).max(500),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, use YYYY-MM-DD"),
  receiptUrl: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.partial();

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
