import { z } from 'zod';

export const updateSettingsSchema = z.object({
  debtLimitDefault: z.coerce.number().int().min(0).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  adminCardNumber: z.string().max(50).nullable().optional(),
  adminCardHolder: z.string().max(100).nullable().optional(),
  adminCardBank: z.string().max(100).nullable().optional(),
  adminPhone: z.string().max(50).nullable().optional(),
  telegramUrl: z.string().url().max(200).nullable().optional(),
  instagramUrl: z.string().url().max(200).nullable().optional(),
  websiteUrl: z.string().url().max(200).nullable().optional(),
  minOrderUzbUzs: z.coerce.number().int().min(0).optional(),
  minOrderKorKrw: z.coerce.number().int().min(0).optional(),
  paymentTimeoutMinutes: z.coerce.number().int().min(5).max(1440).optional(),
  freeShippingThresholdKrw: z.coerce.number().int().min(0).optional(),
  standardShippingFeeKrw: z.coerce.number().int().min(0).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export interface SettingsResponse {
  id: string;
  debtLimitDefault: string; // BigInt as string (cents)
  lowStockThreshold: number;
  adminCardNumber: string | null;
  adminCardHolder: string | null;
  adminCardBank: string | null;
  adminPhone: string | null;
  telegramUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  minOrderUzbUzs: string; // BigInt as string
  minOrderKorKrw: string; // BigInt as string
  paymentTimeoutMinutes: number;
  freeShippingThresholdKrw: string;
  standardShippingFeeKrw: string;
  updatedAt: string;
}
