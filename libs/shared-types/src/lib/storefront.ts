import { z } from 'zod';

export const storefrontProductListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  brandName: z.string(),
  imageUrls: z.array(z.string()),
  categoryName: z.string().optional(),
  calculatedPrice: z.string(), // BigInt string
  cargoFee: z.string().optional(), // BigInt string (for UZB line item)
  currency: z.string(),
  weightGrams: z.number(),
  availableStock: z.number(),
  showStockCount: z.boolean(),
  inStock: z.boolean(),
  wholesalePrice: z.string().optional(),
  minWholesaleQty: z.number().optional(),
  isOnWaitlist: z.boolean().default(false),
});

export type StorefrontProductListItem = z.infer<typeof storefrontProductListItemSchema>;

export const storefrontProductDetailSchema = storefrontProductListItemSchema.extend({
  descriptionUz: z.string().nullable(),
  howToUseUz: z.string().nullable(),
  ingredients: z.array(z.string()),
  skinTypes: z.array(z.string()),
  benefits: z.array(z.string()),
  wholesalePrice: z.string(), // BigInt string
  minWholesaleQty: z.number(),
});

export type StorefrontProductDetail = z.infer<typeof storefrontProductDetailSchema>;

export const storefrontSettingsSchema = z.object({
  adminCardNumber: z.string().nullable(),
  adminCardHolder: z.string().nullable(),
  adminCardBank: z.string().nullable(),
  adminPhone: z.string().nullable(),
  telegramUrl: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  minOrderUzbUzs: z.string(),
  minOrderKorKrw: z.string(),
});

export type StorefrontSettings = z.infer<typeof storefrontSettingsSchema>;

export const createStorefrontOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  regionCode: z.enum(['UZB', 'KOR']),
  fullName: z.string().min(2),
  phone: z.string().min(7),
  address: z.string().min(5),
  city: z.string().min(2),
  district: z.string().min(2),
  boxId: z.string().uuid().optional(),
  couponCode: z.string().optional(),
  addressId: z.string().uuid().optional(),
  deliveryAddress: z
    .object({
      fullName: z.string(),
      phone: z.string(),
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      postalCode: z.string().optional(),
      regionCode: z.enum(['UZB', 'KOR']),
    })
    .optional(),
});

export type CreateStorefrontOrderInput = z.infer<typeof createStorefrontOrderSchema>;

export const contactFormSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  subject: z.string().min(1),
  message: z.string().min(1),
  region: z.string(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export interface StorefrontOrderItemResponse {
  productId: string;
  productName: string;
  imageUrls?: string[];
  quantity: number;
  unitPrice: string;
  subtotal: string;
  cargoFee?: string; // per line item for UZB
  currency: string;
}

export interface StorefrontOrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  regionCode: string;
  subtotal: string;
  cargoFee: string;
  totalAmount: string;
  currency: string;
  paymentReceiptUrl: string | null;
  paymentSubmittedAt: string | null;
  paymentNote: string | null;
  paymentExpiresAt: string | null;
  deliveryFullName: string | null;
  deliveryPhone: string | null;
  deliveryAddressLine1: string | null;
  deliveryAddressLine2: string | null;
  deliveryCity: string | null;
  deliveryPostalCode: string | null;
  deliveryRegionCode: string | null;
  createdAt: string;
  items: StorefrontOrderItemResponse[];
}

export const korShippingTierSchema = z.object({
  maxOrderKrw: z.coerce.number().int().min(0).nullable(),
  cargoFeeKrw: z.coerce.number().int().min(0),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type KorShippingTierInput = z.infer<typeof korShippingTierSchema>;

export interface KorShippingTierResponse {
  id: string;
  maxOrderKrw: string | null; // BigInt as string
  cargoFeeKrw: string; // BigInt as string
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export const shippingBoxSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  maxWeightGrams: z.coerce.number().int().positive(),
  tareWeightGrams: z.coerce.number().int().positive(),
  costPriceKrw: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type ShippingBoxInput = z.infer<typeof shippingBoxSchema>;

export interface ShippingBoxResponse {
  id: string;
  name: string;
  label: string;
  maxWeightGrams: number;
  tareWeightGrams: number;
  costPriceKrw: string; // BigInt string
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Waitlist Schemas
export const productWaitlistSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  notifiedAt: z.string().nullable(),
  createdAt: z.string(),
  product: z.object({
    id: z.string().uuid(),
    name: z.string(),
    imageUrls: z.array(z.string()),
    slug: z.string(),
    brandName: z.string().optional(),
    inStock: z.boolean(),
    calculatedPrice: z.string(),
    currency: z.string(),
    totalStock: z.number(),
  }),
});

export type ProductWaitlistResponse = z.infer<typeof productWaitlistSchema>;
