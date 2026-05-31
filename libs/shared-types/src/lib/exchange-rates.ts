import { z } from 'zod';

export const createExchangeRateSchema = z.object({
  krwToUzs: z.coerce.number().positive(),
  cargoRateKrwPerKg: z.coerce.number().positive(),
  note: z.string().optional(),
});

export const updateExchangeRateSchema = z.object({
  krwToUzs: z.coerce.number().positive(),
  cargoRateKrwPerKg: z.coerce.number().positive(),
  note: z.string().optional(),
});

export type CreateExchangeRateInput = z.infer<typeof createExchangeRateSchema>;

export interface ExchangeRateResponse {
  id: string;
  krwToUzs: number;
  cargoRateKrwPerKg: number;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}
