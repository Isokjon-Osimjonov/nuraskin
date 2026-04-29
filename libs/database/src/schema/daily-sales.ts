import {
  pgTable,
  uuid,
  text,
  bigint,
  date,
  integer,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { products } from './products';
import { relations, sql } from 'drizzle-orm';

export const dailySalesSummary = pgTable('daily_sales_summary', {
  date: date('date').notNull(),
  regionCode: text('region_code').notNull(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  unitsSold: integer('units_sold').notNull().default(0),
  revenueKrw: bigint('revenue_krw', { mode: 'bigint' }).notNull().default(sql`0`),
  cogsKrw: bigint('cogs_krw', { mode: 'bigint' }).notNull().default(sql`0`),
  cargoKrw: bigint('cargo_krw', { mode: 'bigint' }).notNull().default(sql`0`),
  orderCount: integer('order_count').notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.date, t.regionCode, t.productId] }),
  dateIdx: index('idx_daily_sales_date').on(t.date),
  regionIdx: index('idx_daily_sales_region').on(t.regionCode),
}));

export const dailySalesSummaryRelations = relations(dailySalesSummary, ({ one }) => ({
  product: one(products, {
    fields: [dailySalesSummary.productId],
    references: [products.id],
  }),
}));

export type DailySalesSummary = typeof dailySalesSummary.$inferSelect;
export type NewDailySalesSummary = typeof dailySalesSummary.$inferInsert;
