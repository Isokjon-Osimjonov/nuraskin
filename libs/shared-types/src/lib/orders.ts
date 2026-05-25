import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'DRAFT',
  'PENDING_PAYMENT',
  'PAYMENT_SUBMITTED',
  'PAYMENT_VERIFIED',
  'PAYMENT_REJECTED',
  'PAID',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
  'REFUNDED',
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  regionCode: z.enum(['UZB', 'KOR']),
  currency: z.enum(['USD', 'UZS', 'KRW']),
  adminNote: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  isFreeShipping: z.boolean().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const addOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export type AddOrderItemInput = z.infer<typeof addOrderItemSchema>;

export const updateOrderStatusSchema = z.object({
  to: orderStatusSchema,
  paymentNote: z.string().optional(),
  trackingNumber: z.string().optional(),
  note: z.string().optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const scanItemSchema = z.object({
  barcode: z.string().optional(),
  skuSuffix: z.string().optional(), // last 6 digits
}).refine(data => data.barcode || data.skuSuffix, {
  message: "Either barcode or skuSuffix must be provided",
});

export type ScanItemInput = z.infer<typeof scanItemSchema>;

export interface OrderItemResponse {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  brandName: string;
  barcode: string;
  sku: string;
  imageUrls: string[];
  quantity: number;
  unitPriceSnapshot: string; // Serialized BigInt
  subtotalSnapshot: string;   // Serialized BigInt
  currencySnapshot: string;
  isScanned: boolean;
  scannedAt: string | null;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  regionCode: string;
  status: OrderStatus;
  subtotal: string;
  cargoFee: string;
  totalAmount: string;
  currency: string;
  totalWeightGrams: number;
  paymentReceiptUrl: string | null;
  paymentSubmittedAt: string | null;
  paymentVerifiedAt: string | null;
  paymentNote: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  packedAt: string | null;
  adminNote: string | null;
  paymentExpiresAt: string | null;
  deliveryFullName: string | null;
  deliveryPhone: string | null;
  deliveryAddressLine1: string | null;
  deliveryAddressLine2: string | null;
  deliveryCity: string | null;
  deliveryPostalCode: string | null;
  deliveryRegionCode: string | null;
  couponCode: string | null;
  discountAmount: string;
  couponDiscount: string;
  wholesaleDiscount: string;
  // Manual order fields
  orderSource: 'STOREFRONT' | 'MANUAL';
  paymentAmount: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentConfirmedAt: string | null;
  deliveryFeeCharged: string;
  deliveryFeeActual: string | null;
  deliveryCoveredBy: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items: OrderItemResponse[];
}

export const orderExpenseTypeSchema = z.enum([
  'FREE_SHIPPING_SUBSIDY',
  'CARGO_OVERAGE',
  'OTHER',
]);

export type OrderExpenseType = z.infer<typeof orderExpenseTypeSchema>;

export const createOrderExpenseSchema = z.object({
  type: orderExpenseTypeSchema,
  amountKrw: z.number().int().positive(),
  note: z.string().max(500).optional(),
});

export type CreateOrderExpenseInput = z.infer<typeof createOrderExpenseSchema>;

export const createManualOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    negotiatedPriceKrw: z.number().nonnegative(),
  })).min(1),
  deliveryAddress: z.string().min(1),
  deliveryFeeCoveredBy: z.enum(['CUSTOMER', 'BUSINESS']),
  deliveryFeeCharged: z.number().nonnegative(),
  deliveryFeeActual: z.number().nonnegative(),
  adminNotes: z.string().optional(),
  region: z.enum(['KOR', 'UZB']),
  forceCreate: z.boolean().optional().default(false),
});

export type CreateManualOrderInput = z.infer<typeof createManualOrderSchema>;

export const confirmManualPaymentSchema = z.object({
  paymentAmount: z.number().nonnegative(),
  paymentMethod: z.enum(['TELEGRAM_TRANSFER', 'CASH', 'BANK_TRANSFER', 'CARD']),
  paymentReference: z.string().optional(),
  paymentNote: z.string().optional(),
});

export type ConfirmManualPaymentInput = z.infer<typeof confirmManualPaymentSchema>;

