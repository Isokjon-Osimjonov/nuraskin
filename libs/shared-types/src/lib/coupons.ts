import { z } from 'zod';

export const couponStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED']);
export type CouponStatus = z.infer<typeof couponStatusSchema>;

export const couponTypeSchema = z.enum(['PERCENTAGE', 'FIXED']);
export type CouponType = z.infer<typeof couponTypeSchema>;

export const couponScopeSchema = z.enum(['ENTIRE_ORDER', 'PRODUCTS', 'CATEGORIES', 'BRANDS']);
export type CouponScope = z.infer<typeof couponScopeSchema>;

export const couponSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  description: z.string().nullable().optional(),
  type: couponTypeSchema,
  value: z.string(), // BigInt as string
  valueUzs: z.string().nullable().optional(),
  valueKrw: z.string().nullable().optional(),
  maxDiscountCap: z.string().nullable().optional(), // BigInt as string
  maxDiscountUzs: z.string().nullable().optional(),
  maxDiscountKrw: z.string().nullable().optional(),
  scope: couponScopeSchema,
  applicableResourceIds: z.array(z.string().uuid()).nullable().optional(),
  applicableBrands: z.array(z.string()).nullable().optional(),
  minOrderAmount: z.string(), // BigInt as string
  minOrderUzs: z.string().nullable().optional(),
  minOrderKrw: z.string().nullable().optional(),
  minOrderQty: z.number().int().min(1),
  regionCode: z.string().nullable().optional(),
  firstOrderOnly: z.boolean(),
  onePerCustomer: z.boolean(),
  targetCustomerIds: z.array(z.string().uuid()).nullable().optional(),
  startsAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  maxUsesTotal: z.number().int().nullable().optional(),
  maxUsesPerCustomer: z.number().int(),
  usageCount: z.number().int(),
  autoApply: z.boolean(),
  isStackable: z.boolean(),
  status: couponStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CouponResponse = z.infer<typeof couponSchema>;

export const createCouponSchema = couponSchema.omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = createCouponSchema.partial();
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;

export const validateCouponInputSchema = z.object({
  code: z.string(),
  regionCode: z.string().optional(),
  cartItems: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    categoryId: z.string().uuid().or(z.literal('')).optional(),
    brandName: z.string().nullable().optional(),
    subtotal: z.string(), // BigInt as string
  })),
});

export type ValidateCouponInput = z.infer<typeof validateCouponInputSchema>;

export interface CouponValidationResponse {
  valid: boolean;
  discountAmount?: string; // BigInt as string
  discountType?: CouponType;
  description?: string;
  error?: 'NOT_FOUND' | 'EXPIRED' | 'DEPLETED' | 'MIN_AMOUNT' | 'NOT_APPLICABLE' | 'LIMIT_REACHED' | 'INACTIVE';
  amountNeeded?: string; // BigInt as string for MIN_AMOUNT error
}
