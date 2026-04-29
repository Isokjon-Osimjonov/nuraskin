import { z } from 'zod';

export const DashboardRegionSchema = z.enum(['ALL', 'UZB', 'KOR']);
export type DashboardRegion = z.infer<typeof DashboardRegionSchema>;

export const DashboardKPIsSchema = z.object({
  revenue_today_krw: z.string(),
  orders_today: z.number(),
  margin_today_percent: z.number(),
  inventory_value_krw: z.string(),
  outstanding_debt_krw: z.string(),
  action_queues: z.object({
    pending_payment_verification: z.number(),
    ready_to_pack: z.number(),
    reservations_expiring_soon: z.number(),
    low_stock_skus: z.number(),
  }),
});

export type DashboardKPIs = z.infer<typeof DashboardKPIsSchema>;

export const DashboardTrendSchema = z.object({
  days: z.array(z.object({
    date: z.string(),
    kor_revenue_krw: z.string(),
    uzb_revenue_krw: z.string(),
    total_orders: z.number(),
  })),
  top_skus: z.array(z.object({
    product_id: z.string(),
    product_name: z.string(),
    units_sold: z.number(),
    revenue_krw: z.string(),
  })),
});

export type DashboardTrend = z.infer<typeof DashboardTrendSchema>;
