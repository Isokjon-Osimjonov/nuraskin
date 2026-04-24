import {
  pgTable,
  uuid,
  bigint,
  integer,
  boolean,
  varchar,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { products } from './products';

export const productRegionalConfigs = pgTable('product_regional_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  regionCode: varchar('region_code', { length: 5 }).notNull(),
  retailPrice: bigint('retail_price', { mode: 'bigint' }).notNull(),
  wholesalePrice: bigint('wholesale_price', { mode: 'bigint' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  minWholesaleQty: integer('min_wholesale_qty').notNull().default(5),
  minOrderQty: integer('min_order_qty').notNull().default(1),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  productRegionUniq: uniqueIndex('product_regional_configs_product_region_idx').on(
    t.productId,
    t.regionCode,
  ),
  productIdIdx: index('product_regional_configs_product_id_idx').on(t.productId),
  regionCodeCheck: check(
    'product_regional_configs_region_check',
    sql`${t.regionCode} IN ('UZB', 'KOR')`,
  ),
  currencyCheck: check(
    'product_regional_configs_currency_check',
    sql`${t.currency} IN ('USD', 'UZS', 'KRW')`,
  ),
}));

export const productRegionalConfigsRelations = relations(
  productRegionalConfigs,
  ({ one }) => ({
    product: one(products, {
      fields: [productRegionalConfigs.productId],
      references: [products.id],
    }),
  }),
);

export type ProductRegionalConfig = typeof productRegionalConfigs.$inferSelect;
export type NewProductRegionalConfig = typeof productRegionalConfigs.$inferInsert;
