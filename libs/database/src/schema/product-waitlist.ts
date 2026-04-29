import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { products } from './products';
import { customers } from './customers';

export const productWaitlist = pgTable('product_waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  regionCode: varchar('region_code', { length: 5 }).notNull().default('UZB'),
  notifiedAt: timestamp('notified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqWaitlist: uniqueIndex('product_waitlist_customer_product_idx').on(t.productId, t.customerId),
}));

export const productWaitlistRelations = relations(productWaitlist, ({ one }) => ({
  product: one(products, {
    fields: [productWaitlist.productId],
    references: [products.id],
  }),
  customer: one(customers, {
    fields: [productWaitlist.customerId],
    references: [customers.id],
  }),
}));

export type ProductWaitlist = typeof productWaitlist.$inferSelect;
export type NewProductWaitlist = typeof productWaitlist.$inferInsert;
