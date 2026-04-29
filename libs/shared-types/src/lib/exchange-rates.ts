import { z } from 'zod';

export const createExchangeRateSchema = z.object({
  krwToUzs: z.coerce.number().int().positive(),
  cargoRateKrwPerKg: z.coerce.number().int().positive(),
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
