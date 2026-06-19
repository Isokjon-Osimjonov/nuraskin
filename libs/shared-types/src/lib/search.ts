import { z } from 'zod';

export const globalSearchQuerySchema = z.object({
  q: z.string().min(2, "Kamida 2 ta harf kiriting"),
});

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>;

export interface GlobalSearchProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  barcode: string;
  sku: string;
}

export interface GlobalSearchCustomer {
  id: string;
  fullName: string;
  phone: string | null;
  telegramId: string | null;
}

export interface GlobalSearchOrder {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
  currency: string;
}

export interface GlobalSearchResponse {
  products: GlobalSearchProduct[];
  customers: GlobalSearchCustomer[];
  orders: GlobalSearchOrder[];
  totalCounts: {
    products: number;
    customers: number;
    orders: number;
  };
}
