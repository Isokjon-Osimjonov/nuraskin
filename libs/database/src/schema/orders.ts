import {
  pgTable,
  uuid,
  varchar,
  bigint,
  integer,
  boolean,
  text,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { customers } from './customers';
import { products } from './products';
import { users } from './users';
import { exchangeRateSnapshots } from './settings';
import { inventoryBatches } from './inventory';

const bigintZero: SQL = sql`0`;

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  regionCode: varchar('region_code', { length: 5 }).notNull(),
  status: varchar('status', { length: 25 }).notNull().default('DRAFT'),
  subtotal: bigint('subtotal', { mode: 'bigint' }).notNull().default(bigintZero),
  cargoFee: bigint('cargo_fee', { mode: 'bigint' }).notNull().default(bigintZero),
  cargoCostKrw: bigint('cargo_cost_krw', { mode: 'bigint' }).notNull().default(bigintZero),
  totalAmount: bigint('total_amount', { mode: 'bigint' }).notNull().default(bigintZero),
  currency: varchar('currency', { length: 3 }).notNull(),
  totalWeightGrams: integer('total_weight_grams').notNull().default(0),
  couponId: uuid('coupon_id'),
  couponCode: varchar('coupon_code', { length: 50 }),
  discountAmount: bigint('discount_amount', { mode: 'bigint' }).notNull().default(bigintZero),
  rateSnapshotId: uuid('rate_snapshot_id').references(() => exchangeRateSnapshots.id, {
    onDelete: 'set null',
  }),
  paymentReceiptUrl: text('payment_receipt_url'),
  paymentSubmittedAt: timestamp('payment_submitted_at', { withTimezone: true }),
  paymentVerifiedAt: timestamp('payment_verified_at', { withTimezone: true }),
  paymentVerifiedBy: uuid('payment_verified_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  paymentRejectedAt: timestamp('payment_rejected_at', { withTimezone: true }),
  paymentNote: text('payment_note'),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  packedBy: uuid('packed_by').references(() => users.id, { onDelete: 'set null' }),
  packedAt: timestamp('packed_at', { withTimezone: true }),
  adminNote: text('admin_note'),
  // Delivery address snapshot
  deliveryFullName: text('delivery_full_name'),
  deliveryPhone: text('delivery_phone'),
  deliveryAddressLine1: text('delivery_address_line1'),
  deliveryAddressLine2: text('delivery_address_line2'),
  deliveryCity: text('delivery_city'),
  deliveryPostalCode: text('delivery_postal_code'),
  deliveryRegionCode: text('delivery_region_code'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  orderNumberIdx: uniqueIndex('orders_order_number_idx').on(t.orderNumber),
  customerIdIdx: index('orders_customer_id_idx').on(t.customerId),
  statusIdx: index('orders_status_idx').on(t.status),
  createdAtIdx: index('orders_created_at_idx').on(t.createdAt),
  statusCheck: check(
    'orders_status_check',
    sql`${t.status} IN ('DRAFT', 'PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'REFUNDED')`,
  ),
}));

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  batchId: uuid('batch_id').references(() => inventoryBatches.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull(),
  costAtSaleKrw: bigint('cost_at_sale_krw', { mode: 'bigint' }),
  unitPriceSnapshot: bigint('unit_price_snapshot', { mode: 'bigint' }).notNull(),
  subtotalSnapshot: bigint('subtotal_snapshot', { mode: 'bigint' }).notNull(),
  cargoFeeSnapshot: bigint('cargo_fee_snapshot', { mode: 'bigint' }).notNull().default(bigintZero),
  currencySnapshot: varchar('currency_snapshot', { length: 3 }).notNull(),
  isScanned: boolean('is_scanned').notNull().default(false),
  scannedAt: timestamp('scanned_at', { withTimezone: true }),
  scannedBy: uuid('scanned_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  orderIdIdx: index('order_items_order_id_idx').on(t.orderId),
  productIdIdx: index('order_items_product_id_idx').on(t.productId),
  batchIdIdx: index('order_items_batch_id_idx').on(t.batchId),
  quantityCheck: check('order_items_quantity_check', sql`${t.quantity} > 0`),
}));

// APPEND-ONLY — no UPDATE or DELETE ever
export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  fromStatus: varchar('from_status', { length: 25 }),
  toStatus: varchar('to_status', { length: 25 }).notNull(),
  changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  orderIdIdx: index('order_status_history_order_id_idx').on(t.orderId),
  createdAtIdx: index('order_status_history_created_at_idx').on(t.createdAt),
}));

export const orderExpenses = pgTable('order_expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  amountKrw: bigint('amount_krw', { mode: 'bigint' }).notNull(),
  note: text('note'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  isAuto: boolean('is_auto').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  orderIdIdx: index('idx_order_expenses_order_id').on(t.orderId),
  createdAtIdx: index('idx_order_expenses_created_at').on(t.createdAt),
}));

import { coupons } from './coupons';

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  coupon: one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
  rateSnapshot: one(exchangeRateSnapshots, {
    fields: [orders.rateSnapshotId],
    references: [exchangeRateSnapshots.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  expenses: many(orderExpenses),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  batch: one(inventoryBatches, {
    fields: [orderItems.batchId],
    references: [inventoryBatches.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
}));

export const orderExpensesRelations = relations(orderExpenses, ({ one }) => ({
  order: one(orders, {
    fields: [orderExpenses.orderId],
    references: [orders.id],
  }),
  createdByUser: one(users, {
    fields: [orderExpenses.createdBy],
    references: [users.id],
  }),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert;
