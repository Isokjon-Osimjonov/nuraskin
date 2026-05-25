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

  korBankEnabled: z.boolean().optional(),
  korBankName: z.string().nullable().optional(),
  korBankHolder: z.string().nullable().optional(),
  korBankNumber: z.string().nullable().optional(),
  korE9payEnabled: z.boolean().optional(),
  korE9payName: z.string().nullable().optional(),
  korE9payAccount: z.string().nullable().optional(),

  uzbBankEnabled: z.boolean().optional(),
  uzbBankName: z.string().nullable().optional(),
  uzbBankHolder: z.string().nullable().optional(),
  uzbBankNumber: z.string().nullable().optional(),
  uzbE9payEnabled: z.boolean().optional(),
  uzbE9payName: z.string().nullable().optional(),
  uzbE9payAccount: z.string().nullable().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export const updatePaymentInfoSchema = z.object({
  korBankEnabled: z.boolean().optional(),
  korBankName: z.string().nullable().optional(),
  korBankHolder: z.string().nullable().optional(),
  korBankNumber: z.string().nullable().optional(),
  korE9payEnabled: z.boolean().optional(),
  korE9payName: z.string().nullable().optional(),
  korE9payAccount: z.string().nullable().optional(),

  uzbBankEnabled: z.boolean().optional(),
  uzbBankName: z.string().nullable().optional(),
  uzbBankHolder: z.string().nullable().optional(),
  uzbBankNumber: z.string().nullable().optional(),
  uzbE9payEnabled: z.boolean().optional(),
  uzbE9payName: z.string().nullable().optional(),
  uzbE9payAccount: z.string().nullable().optional(),
});

export type UpdatePaymentInfoInput = z.infer<typeof updatePaymentInfoSchema>;

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
  updatedAt: string;

  korBankEnabled: boolean;
  korBankName: string | null;
  korBankHolder: string | null;
  korBankNumber: string | null;
  korE9payEnabled: boolean;
  korE9payName: string | null;
  korE9payAccount: string | null;

  uzbBankEnabled: boolean;
  uzbBankName: string | null;
  uzbBankHolder: string | null;
  uzbBankNumber: string | null;
  uzbE9payEnabled: boolean;
  uzbE9payName: string | null;
  uzbE9payAccount: string | null;
}
