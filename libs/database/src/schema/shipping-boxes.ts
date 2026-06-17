import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  bigint,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { orders } from './orders';

export const shippingBoxes = pgTable('shipping_boxes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(),
  label: varchar('label', { length: 100 }).notNull(),
  maxWeightGrams: integer('max_weight_grams').notNull(),
  tareWeightGrams: integer('tare_weight_grams').notNull(),
  costPriceKrw: bigint('cost_price_krw', { mode: 'bigint' }).notNull().default(sql`0`),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orderBoxes = pgTable(
  'order_boxes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    boxId: uuid('box_id')
      .notNull()
      .references(() => shippingBoxes.id),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    orderIdIdx: index('order_boxes_order_id_idx').on(t.orderId),
  })
);

export type ShippingBox = typeof shippingBoxes.$inferSelect;
export type NewShippingBox = typeof shippingBoxes.$inferInsert;
export type OrderBox = typeof orderBoxes.$inferSelect;
export type NewOrderBox = typeof orderBoxes.$inferInsert;
