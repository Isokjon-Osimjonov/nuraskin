import { z } from 'zod';

export const addBatchSchema = z.object({
  productId: z.string().uuid(),
  batchRef: z.string().optional(),
  initialQty: z.coerce.number().int().positive(),
  costPrice: z.coerce.number().positive(),
  costCurrency: z.enum(['USD', 'UZS', 'KRW']).default('USD'),
  expiryDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  notes: z.string().optional(),
});

export type AddBatchInput = z.infer<typeof addBatchSchema>;

export const stockMovementSchema = z.object({
  productId: z.string().uuid(),
  batchId: z.string().uuid().optional(),
  movementType: z.enum([
    'STOCK_IN',
    'RESERVED',
    'RESERVATION_RELEASED',
    'DEDUCTED',
    'ADJUSTED',
    'RETURNED',
  ]),
  quantityDelta: z.number().int(),
  note: z.string().optional(),
});

export type StockMovementInput = z.infer<typeof stockMovementSchema>;

export const updateBatchSchema = z.object({
  batch_ref: z.string().optional(),
  initial_qty: z.coerce.number().int().positive().optional(),
  cost_price_krw: z.coerce.number().int().positive().optional(),
  expiry_date: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  received_at: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
});

export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;

export const adjustQuantitySchema = z.object({
  adjustment: z.coerce.number().int().refine((val) => val !== 0, {
    message: 'Adjustment must be non-zero',
  }),
  reason: z.string().min(5),
});

export type AdjustQuantityInput = z.infer<typeof adjustQuantitySchema>;

export interface InventoryBatchResponse {
  id: string;
  productId: string;
  batchRef: string | null;
  initialQty: number;
  currentQty: number;
  costPrice: string; // BigInt serialized as string
  costCurrency: string;
  expiryDate: string | null;
  receivedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementResponse {
  id: string;
  batchId: string | null;
  productId: string;
  orderId: string | null;
  movementType: string;
  quantityDelta: number;
  qtyBefore: number;
  qtyAfter: number;
  performedBy: string | null;
  note: string | null;
  createdAt: string;
}

export interface ProductStockSummary {
  productId: string;
  totalStock: number;
  batches: InventoryBatchResponse[];
}
