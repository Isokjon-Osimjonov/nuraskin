import { z } from 'zod';

export const cartItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  imageUrls: z.array(z.string()),
  price: z.string(), // retail or wholesale depending on qty
  wholesalePrice: z.string().optional(),
  minWholesaleQty: z.number().optional(),
  quantity: z.number().int().positive(),
  availableStock: z.number(),
  currency: z.string(),
  weightGrams: z.number(),
  slug: z.string(),
});

export type CartItemResponse = z.infer<typeof cartItemSchema>;

export const cartResponseSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  items: z.array(cartItemSchema),
  regionCode: z.string(),
  updatedAt: z.string(),
});

export type CartResponse = z.infer<typeof cartResponseSchema>;

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  regionCode: z.string().optional(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

// Alias for compatibility
export const updateItemQuantitySchema = updateCartItemSchema;
export type UpdateItemQuantityInput = UpdateCartItemInput;
